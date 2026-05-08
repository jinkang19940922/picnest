"""
PicNest - 统计路由
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
import aiosqlite

from schemas import StatsOverview, StorageStats
from utils.security import get_current_user
from database import get_db
from config import settings


router = APIRouter(prefix="/stats", tags=["统计"])


@router.get("/overview", response_model=StatsOverview)
async def get_overview(current_user: dict = Depends(get_current_user)):
    """获取统计概览"""
    async with get_db() as db:
        user_id = current_user["user_id"]
        
        # 总图片数
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM images WHERE user_id = ? AND status = 'active'",
            (user_id,),
        )
        total_images = (await cursor.fetchone())["count"]
        
        # 总存储
        cursor = await db.execute(
            "SELECT SUM(file_size) as total FROM images WHERE user_id = ? AND status = 'active'",
            (user_id,),
        )
        total_storage = (await cursor.fetchone())["total"] or 0
        
        # 今日上传
        today = datetime.utcnow().date().isoformat()
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM images WHERE user_id = ? AND status = 'active' AND date(created_at) = ?",
            (user_id, today),
        )
        today_uploads = (await cursor.fetchone())["count"]
        
        # 本月上传
        month_start = datetime.utcnow().replace(day=1).date().isoformat()
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM images WHERE user_id = ? AND status = 'active' AND date(created_at) >= ?",
            (user_id, month_start),
        )
        month_uploads = (await cursor.fetchone())["count"]
        
        # 回收站数量
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM images WHERE user_id = ? AND status = 'trashed'",
            (user_id,),
        )
        trash_count = (await cursor.fetchone())["count"]
        
        # 文件夹分布
        cursor = await db.execute(
            """SELECT f.name, COUNT(i.id) as count
               FROM folders f
               LEFT JOIN images i ON i.folder_id = f.id AND i.status = 'active'
               WHERE f.user_id = ?
               GROUP BY f.id
               ORDER BY count DESC
               LIMIT 5""",
            (user_id,),
        )
        top_folders = [dict(row) for row in await cursor.fetchall()]
        
        # 标签分布
        cursor = await db.execute(
            """SELECT t.name, t.color, COUNT(it.image_id) as count
               FROM tags t
               LEFT JOIN image_tags it ON it.tag_id = t.id
               LEFT JOIN images i ON i.id = it.image_id AND i.status = 'active'
               WHERE t.user_id = ?
               GROUP BY t.id
               ORDER BY count DESC
               LIMIT 5""",
            (user_id,),
        )
        top_tags = [dict(row) for row in await cursor.fetchall()]
        
        return {
            "total_images": total_images,
            "total_storage": total_storage,
            "today_uploads": today_uploads,
            "month_uploads": month_uploads,
            "trash_count": trash_count,
            "top_folders": top_folders,
            "top_tags": top_tags,
        }


@router.get("/storage", response_model=StorageStats)
async def get_storage(current_user: dict = Depends(get_current_user)):
    """获取存储统计"""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT storage_used, storage_quota FROM users WHERE id = ?",
            (current_user["user_id"],),
        )
        user = await cursor.fetchone()
        
        used = user["storage_used"] or 0
        quota = user["storage_quota"]
        used_percent = round(used / quota * 100, 1) if quota > 0 else 0
        
        # 按文件夹分布
        cursor = await db.execute(
            """SELECT f.name, SUM(i.file_size) as total
               FROM folders f
               LEFT JOIN images i ON i.folder_id = f.id AND i.status = 'active'
               WHERE f.user_id = ?
               GROUP BY f.id
               HAVING total > 0
               ORDER BY total DESC""",
            (current_user["user_id"],),
        )
        by_folder = [dict(row) for row in await cursor.fetchall()]
        
        # 根目录
        cursor = await db.execute(
            "SELECT SUM(file_size) as total FROM images WHERE user_id = ? AND status = 'active' AND folder_id IS NULL",
            (current_user["user_id"],),
        )
        root_total = (await cursor.fetchone())["total"] or 0
        if root_total > 0:
            by_folder.insert(0, {"name": "根目录", "total": root_total})
        
        return {
            "used": used,
            "quota": quota,
            "used_percent": used_percent,
            "by_folder": by_folder,
        }