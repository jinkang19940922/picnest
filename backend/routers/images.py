"""
PicNest - 图片路由
"""
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
import aiosqlite

from schemas import ImageResponse, ImageUpdate, ImageListResponse, TagResponse, MessageResponse
from utils.security import get_current_user
from database import get_db
from config import settings


router = APIRouter(prefix="/images", tags=["图片"])


def row_to_image_response(row: dict, base_url: str) -> dict:
    """将数据库行转换为图片响应"""
    ext = ".jpg" if ".jpeg" in row["original_name"] or ".jpg" in row["original_name"] else "." + row["original_name"].rsplit(".", 1)[-1].lower() if "." in row["original_name"] else ""
    filename = row["filename"]
    
    return {
        "id": row["id"],
        "filename": row["filename"],
        "original_name": row["original_name"],
        "url": f"/data/images/originals/{filename}{ext}",
        "thumbnails": {
            "small": row.get("thumbnail_small"),
            "medium": row.get("thumbnail_medium"),
            "large": row.get("thumbnail_large"),
        },
        "width": row.get("width"),
        "height": row.get("height"),
        "file_size": row["file_size"],
        "mime_type": row["mime_type"],
        "folder_id": row.get("folder_id"),
        "folder_name": row.get("folder_name"),
        "tags": [],
        "is_starred": bool(row.get("is_starred")),
        "is_public": bool(row.get("is_public")),
        "view_count": row.get("view_count", 0),
        "download_count": row.get("download_count", 0),
        "created_at": row.get("created_at"),
    }


@router.get("", response_model=ImageListResponse)
async def get_images(
    page: int = Query(1, ge=1),
    per_page: int = Query(24, ge=1, le=100),
    folder_id: Optional[str] = None,
    tag_ids: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = Query("newest", regex="^(newest|oldest|size|name)$"),
    status: str = Query("active", regex="^(active|trashed)$"),
    current_user: dict = Depends(get_current_user),
):
    """获取图片列表"""
    async with get_db() as db:
        # 构建查询
        conditions = ["i.user_id = ?", "i.status = ?"]
        params = [current_user["user_id"], status]
        
        if folder_id:
            conditions.append("i.folder_id = ?")
            params.append(folder_id)
        
        if search:
            conditions.append("i.original_name LIKE ?")
            params.append(f"%{search}%")
        
        if tag_ids:
            tag_list = tag_ids.split(",")
            placeholders = ",".join("?" * len(tag_list))
            conditions.append(f"""i.id IN (
                SELECT image_id FROM image_tags WHERE tag_id IN ({placeholders})
            )""")
            params.extend(tag_list)
        
        # 排序
        order_map = {
            "newest": "i.created_at DESC",
            "oldest": "i.created_at ASC",
            "size": "i.file_size DESC",
            "name": "i.original_name ASC",
        }
        order = order_map.get(sort, "i.created_at DESC")
        
        # 总数
        where_clause = " AND ".join(conditions)
        cursor = await db.execute(
            f"SELECT COUNT(*) FROM images i WHERE {where_clause}",
            params,
        )
        total = (await cursor.fetchone())[0]
        
        # 分页查询
        offset = (page - 1) * per_page
        cursor = await db.execute(
            f"""SELECT i.*, f.name as folder_name
                FROM images i
                LEFT JOIN folders f ON f.id = i.folder_id
                WHERE {where_clause}
                ORDER BY {order}
                LIMIT ? OFFSET ?""",
            params + [per_page, offset],
        )
        images = await cursor.fetchall()
        
        # 获取标签
        image_ids = [img["id"] for img in images]
        tags_map = {}
        if image_ids:
            placeholders = ",".join("?" * len(image_ids))
            cursor = await db.execute(
                f"""SELECT it.image_id, t.*
                    FROM image_tags it
                    JOIN tags t ON t.id = it.tag_id
                    WHERE it.image_id IN ({placeholders})""",
                image_ids,
            )
            for row in await cursor.fetchall():
                if row["image_id"] not in tags_map:
                    tags_map[row["image_id"]] = []
                tags_map[row["image_id"]].append({
                    "id": row["id"],
                    "name": row["name"],
                    "color": row["color"],
                    "user_id": row["user_id"],
                })
        
        result = []
        for img in images:
            resp = row_to_image_response(dict(img), settings.app.base_url)
            resp["tags"] = tags_map.get(img["id"], [])
            result.append(resp)
        
        return {
            "data": result,
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
            },
        }


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: str,
    current_user: dict = Depends(get_current_user),
):
    """获取图片详情"""
    async with get_db() as db:
        cursor = await db.execute(
            """SELECT i.*, f.name as folder_name
               FROM images i
               LEFT JOIN folders f ON f.id = i.folder_id
               WHERE i.id = ? AND i.user_id = ?""",
            (image_id, current_user["user_id"]),
        )
        image = await cursor.fetchone()
        if not image:
            raise HTTPException(status_code=404, detail="图片不存在")
        
        # 更新浏览次数
        await db.execute(
            "UPDATE images SET view_count = view_count + 1 WHERE id = ?",
            (image_id,),
        )
        await db.commit()
        
        resp = row_to_image_response(dict(image), settings.app.base_url)
        
        # 获取标签
        cursor = await db.execute(
            """SELECT t.* FROM image_tags it
               JOIN tags t ON t.id = it.tag_id
               WHERE it.image_id = ?""",
            (image_id,),
        )
        resp["tags"] = [dict(row) for row in await cursor.fetchall()]
        
        return resp


@router.put("/{image_id}", response_model=ImageResponse)
async def update_image(
    image_id: str,
    data: ImageUpdate,
    current_user: dict = Depends(get_current_user),
):
    """更新图片信息"""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM images WHERE id = ? AND user_id = ?",
            (image_id, current_user["user_id"]),
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="图片不存在")
        
        updates = []
        values = []
        
        if data.original_name is not None:
            updates.append("original_name = ?")
            values.append(data.original_name)
        if data.folder_id is not None:
            updates.append("folder_id = ?")
            values.append(data.folder_id)
        if data.is_public is not None:
            updates.append("is_public = ?")
            values.append(1 if data.is_public else 0)
        if data.is_starred is not None:
            updates.append("is_starred = ?")
            values.append(1 if data.is_starred else 0)
        
        if updates:
            updates.append("updated_at = ?")
            values.append(datetime.utcnow().isoformat())
            values.append(image_id)
            await db.execute(
                f"UPDATE images SET {', '.join(updates)} WHERE id = ?",
                values,
            )
        
        # 更新标签
        if data.tag_ids is not None:
            await db.execute("DELETE FROM image_tags WHERE image_id = ?", (image_id,))
            for tag_id in data.tag_ids:
                await db.execute(
                    "INSERT OR IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)",
                    (image_id, tag_id),
                )
        
        await db.commit()
        
        # 返回更新后的图片
        cursor = await db.execute(
            """SELECT i.*, f.name as folder_name
               FROM images i
               LEFT JOIN folders f ON f.id = i.folder_id
               WHERE i.id = ?""",
            (image_id,),
        )
        image = await cursor.fetchone()
        resp = row_to_image_response(dict(image), settings.app.base_url)
        
        cursor = await db.execute(
            "SELECT t.* FROM image_tags it JOIN tags t ON t.id = it.tag_id WHERE it.image_id = ?",
            (image_id,),
        )
        resp["tags"] = [dict(row) for row in await cursor.fetchall()]
        
        return resp


@router.delete("/{image_id}")
async def delete_image(
    image_id: str,
    current_user: dict = Depends(get_current_user),
):
    """删除图片（移入回收站）"""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM images WHERE id = ? AND user_id = ? AND status = 'active'",
            (image_id, current_user["user_id"]),
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="图片不存在")
        
        await db.execute(
            """UPDATE images SET status = 'trashed', trashed_at = ?
               WHERE id = ?""",
            (datetime.utcnow().isoformat(), image_id),
        )
        await db.commit()
        
        return {"message": "图片已移入回收站"}


@router.post("/batch-delete")
async def batch_delete_images(
    image_ids: List[str],
    current_user: dict = Depends(get_current_user),
):
    """批量删除图片"""
    async with get_db() as db:
        placeholders = ",".join("?" * len(image_ids))
        await db.execute(
            f"""UPDATE images SET status = 'trashed', trashed_at = ?
                WHERE id IN ({placeholders}) AND user_id = ? AND status = 'active'""",
            [datetime.utcnow().isoformat()] + image_ids + [current_user["user_id"]],
        )
        await db.commit()
        return {"message": f"已删除 {len(image_ids)} 张图片"}


@router.post("/{image_id}/restore")
async def restore_image(
    image_id: str,
    current_user: dict = Depends(get_current_user),
):
    """恢复图片"""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM images WHERE id = ? AND user_id = ? AND status = 'trashed'",
            (image_id, current_user["user_id"]),
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="图片不存在或不在回收站中")
        
        await db.execute(
            "UPDATE images SET status = 'active', trashed_at = NULL WHERE id = ?",
            (image_id,),
        )
        await db.commit()
        
        return {"message": "图片已恢复"}


@router.delete("/{image_id}/permanent")
async def permanent_delete_image(
    image_id: str,
    current_user: dict = Depends(get_current_user),
):
    """永久删除图片"""
    import os
    
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM images WHERE id = ? AND user_id = ?",
            (image_id, current_user["user_id"]),
        )
        image = await cursor.fetchone()
        if not image:
            raise HTTPException(status_code=404, detail="图片不存在")
        
        # 删除文件
        for path_field in ["storage_path", "thumbnail_small", "thumbnail_medium", "thumbnail_large"]:
            if image.get(path_field):
                file_path = os.path.join(settings.storage.base_path, image[path_field].lstrip("/data/images/"))
                if os.path.exists(file_path):
                    os.remove(file_path)
        
        # 从数据库删除
        await db.execute("DELETE FROM images WHERE id = ?", (image_id,))
        await db.commit()
        
        return {"message": "图片已永久删除"}


# 标签路由
tags_router = APIRouter(prefix="/tags", tags=["标签"])


@tags_router.get("")
async def get_tags(current_user: dict = Depends(get_current_user)):
    """获取标签列表"""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM tags WHERE user_id = ? ORDER BY name",
            (current_user["user_id"],),
        )
        return [dict(row) for row in await cursor.fetchall()]


@tags_router.post("")
async def create_tag(
    name: str,
    color: str = "#EC4899",
    current_user: dict = Depends(get_current_user),
):
    """创建标签"""
    async with get_db() as db:
        tag_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO tags (id, name, color, user_id) VALUES (?, ?, ?, ?)",
            (tag_id, name, color, current_user["user_id"]),
        )
        await db.commit()
        
        cursor = await db.execute("SELECT * FROM tags WHERE id = ?", (tag_id,))
        return dict(await cursor.fetchone())


@tags_router.delete("/{tag_id}")
async def delete_tag(
    tag_id: str,
    current_user: dict = Depends(get_current_user),
):
    """删除标签"""
    async with get_db() as db:
        await db.execute(
            "DELETE FROM tags WHERE id = ? AND user_id = ?",
            (tag_id, current_user["user_id"]),
        )
        await db.commit()
        return {"message": "标签已删除"}