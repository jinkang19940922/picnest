"""
PicNest - 文件夹路由
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
import aiosqlite

from schemas import FolderCreate, FolderUpdate, FolderResponse
from utils.security import get_current_user
from database import get_db


router = APIRouter(prefix="/folders", tags=["文件夹"])


def build_folder_tree(folders: list, parent_id: str = None) -> list:
    """递归构建文件夹树"""
    tree = []
    for folder in folders:
        if folder["parent_id"] == parent_id:
            children = build_folder_tree(folders, folder["id"])
            folder_dict = dict(folder)
            folder_dict["children"] = children
            if "image_count" not in folder_dict:
                folder_dict["image_count"] = 0
            tree.append(folder_dict)
    return tree


@router.get("", response_model=list)
async def get_folders(current_user: dict = Depends(get_current_user)):
    """获取文件夹列表（树形结构）"""
    async with get_db() as db:
        cursor = await db.execute(
            """SELECT f.*, COUNT(i.id) as image_count
               FROM folders f
               LEFT JOIN images i ON i.folder_id = f.id AND i.status = 'active'
               WHERE f.user_id = ?
               GROUP BY f.id
               ORDER BY f.sort_order, f.name""",
            (current_user["user_id"],),
        )
        folders = await cursor.fetchall()
        return build_folder_tree([dict(f) for f in folders])


@router.post("", response_model=FolderResponse)
async def create_folder(
    data: FolderCreate,
    current_user: dict = Depends(get_current_user),
):
    """创建文件夹"""
    async with get_db() as db:
        # 检查父文件夹存在且属于当前用户
        if data.parent_id:
            cursor = await db.execute(
                "SELECT id FROM folders WHERE id = ? AND user_id = ?",
                (data.parent_id, current_user["user_id"]),
            )
            if not await cursor.fetchone():
                raise HTTPException(status_code=404, detail="父文件夹不存在")
        
        folder_id = str(uuid.uuid4())
        await db.execute(
            """INSERT INTO folders (id, name, parent_id, user_id, color)
               VALUES (?, ?, ?, ?, ?)""",
            (folder_id, data.name, data.parent_id, current_user["user_id"], data.color),
        )
        await db.commit()
        
        cursor = await db.execute("SELECT * FROM folders WHERE id = ?", (folder_id,))
        folder = await cursor.fetchone()
        result = dict(folder)
        result["image_count"] = 0
        return result


@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: str,
    data: FolderUpdate,
    current_user: dict = Depends(get_current_user),
):
    """更新文件夹"""
    async with get_db() as db:
        # 检查文件夹存在
        cursor = await db.execute(
            "SELECT * FROM folders WHERE id = ? AND user_id = ?",
            (folder_id, current_user["user_id"]),
        )
        folder = await cursor.fetchone()
        if not folder:
            raise HTTPException(status_code=404, detail="文件夹不存在")
        
        updates = []
        values = []
        for field in ["name", "parent_id", "color", "sort_order"]:
            value = getattr(data, field, None)
            if value is not None:
                updates.append(f"{field} = ?")
                values.append(value)
        
        if updates:
            updates.append("updated_at = ?")
            values.append(datetime.utcnow().isoformat())
            values.append(folder_id)
            
            await db.execute(
                f"UPDATE folders SET {', '.join(updates)} WHERE id = ?",
                values,
            )
            await db.commit()
        
        cursor = await db.execute("SELECT * FROM folders WHERE id = ?", (folder_id,))
        folder = await cursor.fetchone()
        return dict(folder)


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user),
):
    """删除文件夹（子文件夹一并删除，图片移到根目录）"""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id FROM folders WHERE id = ? AND user_id = ?",
            (folder_id, current_user["user_id"]),
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="文件夹不存在")
        
        # 将该文件夹下的图片移到根目录
        await db.execute(
            "UPDATE images SET folder_id = NULL WHERE folder_id = ?",
            (folder_id,),
        )
        
        # 删除文件夹（子文件夹通过外键级联删除）
        await db.execute("DELETE FROM folders WHERE id = ?", (folder_id,))
        await db.commit()
        
        return {"message": "文件夹已删除"}