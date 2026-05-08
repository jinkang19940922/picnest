"""
PicNest - 回收站路由
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
import aiosqlite

from utils.security import get_current_user
from database import get_db
from config import settings


router = APIRouter(prefix="/trash", tags=["回收站"])


@router.get("")
async def get_trash(
    page: int = 1,
    per_page: int = 24,
    current_user: dict = Depends(get_current_user),
):
    """获取回收站列表"""
    async with get_db() as db:
        offset = (page - 1) * per_page
        
        cursor = await db.execute(
            """SELECT COUNT(*) FROM images
               WHERE user_id = ? AND status = 'trashed'""",
            (current_user["user_id"],),
        )
        total = (await cursor.fetchone())[0]
        
        cursor = await db.execute(
            """SELECT * FROM images
               WHERE user_id = ? AND status = 'trashed'
               ORDER BY trashed_at DESC
               LIMIT ? OFFSET ?""",
            (current_user["user_id"], per_page, offset),
        )
        images = await cursor.fetchall()
        
        return {
            "data": [dict(img) for img in images],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
            },
        }


@router.delete("/empty")
async def empty_trash(current_user: dict = Depends(get_current_user)):
    """清空回收站"""
    import os
    
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM images WHERE user_id = ? AND status = 'trashed'",
            (current_user["user_id"],),
        )
        images = await cursor.fetchall()
        
        deleted_count = 0
        for img in images:
            # 删除文件
            if img.get("storage_path"):
                path = img["storage_path"]
                if os.path.exists(path):
                    os.remove(path)
            
            for size in ["small", "medium", "large"]:
                key = f"thumbnail_{size}"
                if img.get(key):
                    path = img[key]
                    if os.path.exists(path):
                        os.remove(path)
            
            deleted_count += 1
        
        # 清空数据库记录
        await db.execute(
            "DELETE FROM images WHERE user_id = ? AND status = 'trashed'",
            (current_user["user_id"],),
        )
        
        await db.commit()
        
        return {"message": f"已永久删除 {deleted_count} 张图片"}


@router.post("/auto-cleanup")
async def auto_cleanup():
    """自动清理过期回收站图片（可由定时任务触发）"""
    import os
    
    async with get_db() as db:
        cleanup_days = settings.trash.auto_cleanup_days
        cutoff = (datetime.utcnow() - timedelta(days=cleanup_days)).isoformat()
        
        cursor = await db.execute(
            "SELECT * FROM images WHERE status = 'trashed' AND trashed_at < ?",
            (cutoff,),
        )
        images = await cursor.fetchall()
        
        deleted_count = 0
        for img in images:
            if img.get("storage_path") and os.path.exists(img["storage_path"]):
                os.remove(img["storage_path"])
            for size in ["small", "medium", "large"]:
                key = f"thumbnail_{size}"
                if img.get(key) and os.path.exists(img[key]):
                    os.remove(img[key])
            
            deleted_count += 1
        
        await db.execute(
            "DELETE FROM images WHERE status = 'trashed' AND trashed_at < ?",
            (cutoff,),
        )
        await db.commit()
        
        return {"message": f"自动清理完成，删除了 {deleted_count} 张过期图片"}