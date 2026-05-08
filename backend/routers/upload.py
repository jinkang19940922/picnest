"""
PicNest - 上传路由
"""
import uuid
import os
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
import aiosqlite

from utils.security import get_current_user
from database import get_db
from config import settings
from services.image_service import get_image_dimensions, generate_md5


router = APIRouter(prefix="/images", tags=["上传"])


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    folder_id: str = Form(None),
    is_public: bool = Form(True),
    current_user: dict = Depends(get_current_user),
):
    """上传单张图片"""
    # 校验文件类型
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext.lower() not in settings.storage.allowed_extensions and file.content_type not in [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml"
    ]:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型: {ext}")
    
    # 读取文件内容
    content = await file.read()
    
    # 校验文件大小
    if len(content) > settings.storage.max_file_size:
        raise HTTPException(status_code=400, detail=f"文件大小超过限制 ({settings.storage.max_file_size // 1024 // 1024}MB)")
    
    # 检查重复 (MD5)
    md5_hash = generate_md5(content)
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id FROM images WHERE md5_hash = ? AND user_id = ?",
            (md5_hash, current_user["user_id"]),
        )
        existing = await cursor.fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="图片已存在")
        
        # 检查存储配额
        cursor = await db.execute(
            "SELECT storage_used, storage_quota FROM users WHERE id = ?",
            (current_user["user_id"],),
        )
        user = await cursor.fetchone()
        if user and user["storage_used"] + len(content) > user["storage_quota"]:
            raise HTTPException(status_code=507, detail="存储空间不足")
        
        # 生成 ID 和路径
        image_id = str(uuid.uuid4())
        
        # 获取图片尺寸
        try:
            width, height = get_image_dimensions(content)
        except:
            width, height = 0, 0
        
        # 确定扩展名
        mime_to_ext = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp",
            "image/avif": ".avif",
            "image/svg+xml": ".svg",
        }
        ext = mime_to_ext.get(file.content_type, ext)
        if not ext:
            ext = ".jpg"
        
        # 保存原图
        originals_dir = os.path.join(settings.storage.base_path, settings.storage.originals)
        os.makedirs(originals_dir, exist_ok=True)
        storage_path = f"{originals_dir}/{image_id}{ext}"
        
        with open(storage_path, "wb") as f:
            f.write(content)
        
        # 生成缩略图
        thumbnails = {}
        if settings.thumbnail.enabled:
            from PIL import Image as PILImage
            img = PILImage.open(io.BytesIO(content))
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            thumb_dir = os.path.join(settings.storage.base_path, settings.storage.thumbnails)
            os.makedirs(thumb_dir, exist_ok=True)
            
            for size_name, size in {
                "small": settings.thumbnail.small,
                "medium": settings.thumbnail.medium,
                "large": settings.thumbnail.large
            }.items():
                size_dir = os.path.join(thumb_dir, size_name)
                os.makedirs(size_dir, exist_ok=True)
                
                thumb = img.copy()
                thumb.thumbnail((size, size), PILImage.Resampling.LANCZOS)
                
                thumb_path = f"{size_dir}/{image_id}.webp"
                thumb.save(thumb_path, "WEBP", quality=settings.thumbnail.quality)
                thumbnails[size_name] = f"/data/images/thumbnails/{size_name}/{image_id}.webp"
        
        # 写入数据库
        await db.execute(
            """INSERT INTO images (
                id, filename, original_name, storage_path,
                thumbnail_small, thumbnail_medium, thumbnail_large,
                file_size, mime_type, width, height, md5_hash,
                folder_id, user_id, is_public
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                image_id, image_id, file.filename, storage_path,
                thumbnails.get("small"), thumbnails.get("medium"), thumbnails.get("large"),
                len(content), file.content_type, width, height, md5_hash,
                folder_id, current_user["user_id"], 1 if is_public else 0
            ),
        )
        
        # 更新用户存储使用量
        await db.execute(
            "UPDATE users SET storage_used = storage_used + ? WHERE id = ?",
            (len(content), current_user["user_id"]),
        )
        
        await db.commit()
        
        return {
            "id": image_id,
            "filename": image_id,
            "original_name": file.filename,
            "url": f"/data/images/originals/{image_id}{ext}",
            "thumbnails": thumbnails,
            "width": width,
            "height": height,
            "file_size": len(content),
            "mime_type": file.content_type,
        }


@router.post("/batch-upload")
async def batch_upload(
    files: list[UploadFile] = File(...),
    folder_id: str = Form(None),
    is_public: bool = Form(True),
    current_user: dict = Depends(get_current_user),
):
    """批量上传图片"""
    results = []
    errors = []
    
    for file in files[:20]:  # 最多 20 个
        try:
            # 校验类型
            ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
            if ext.lower() not in settings.storage.allowed_extensions:
                errors.append({"filename": file.filename, "error": "不支持的文件类型"})
                continue
            
            content = await file.read()
            
            if len(content) > settings.storage.max_file_size:
                errors.append({"filename": file.filename, "error": "文件过大"})
                continue
            
            # 检查重复
            md5_hash = generate_md5(content)
            async with get_db() as db:
                cursor = await db.execute(
                    "SELECT id FROM images WHERE md5_hash = ? AND user_id = ?",
                    (md5_hash, current_user["user_id"]),
                )
                if await cursor.fetchone():
                    errors.append({"filename": file.filename, "error": "图片已存在"})
                    continue
                
                # 配额检查
                cursor = await db.execute(
                    "SELECT storage_used, storage_quota FROM users WHERE id = ?",
                    (current_user["user_id"],),
                )
                user = await cursor.fetchone()
                if user and user["storage_used"] + len(content) > user["storage_quota"]:
                    errors.append({"filename": file.filename, "error": "存储空间不足"})
                    continue
                
                image_id = str(uuid.uuid4())
                
                try:
                    width, height = get_image_dimensions(content)
                except:
                    width, height = 0, 0
                
                mime_to_ext = {
                    "image/jpeg": ".jpg",
                    "image/png": ".png",
                    "image/gif": ".gif",
                    "image/webp": ".webp",
                    "image/avif": ".avif",
                    "image/svg+xml": ".svg",
                }
                ext = mime_to_ext.get(file.content_type, ext or ".jpg")
                
                originals_dir = os.path.join(settings.storage.base_path, settings.storage.originals)
                os.makedirs(originals_dir, exist_ok=True)
                storage_path = f"{originals_dir}/{image_id}{ext}"
                
                with open(storage_path, "wb") as f:
                    f.write(content)
                
                thumbnails = {}
                if settings.thumbnail.enabled:
                    from PIL import Image as PILImage
                    img = PILImage.open(io.BytesIO(content))
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    
                    thumb_dir = os.path.join(settings.storage.base_path, settings.storage.thumbnails)
                    os.makedirs(thumb_dir, exist_ok=True)
                    
                    for size_name, size in {
                        "small": settings.thumbnail.small,
                        "medium": settings.thumbnail.medium,
                        "large": settings.thumbnail.large
                    }.items():
                        size_dir = os.path.join(thumb_dir, size_name)
                        os.makedirs(size_dir, exist_ok=True)
                        
                        thumb = img.copy()
                        thumb.thumbnail((size, size), PILImage.Resampling.LANCZOS)
                        
                        thumb_path = f"{size_dir}/{image_id}.webp"
                        thumb.save(thumb_path, "WEBP", quality=settings.thumbnail.quality)
                        thumbnails[size_name] = f"/data/images/thumbnails/{size_name}/{image_id}.webp"
                
                await db.execute(
                    """INSERT INTO images (
                        id, filename, original_name, storage_path,
                        thumbnail_small, thumbnail_medium, thumbnail_large,
                        file_size, mime_type, width, height, md5_hash,
                        folder_id, user_id, is_public
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        image_id, image_id, file.filename, storage_path,
                        thumbnails.get("small"), thumbnails.get("medium"), thumbnails.get("large"),
                        len(content), file.content_type, width, height, md5_hash,
                        folder_id, current_user["user_id"], 1 if is_public else 0
                    ),
                )
                
                await db.execute(
                    "UPDATE users SET storage_used = storage_used + ? WHERE id = ?",
                    (len(content), current_user["user_id"]),
                )
                
                await db.commit()
                
                results.append({
                    "id": image_id,
                    "original_name": file.filename,
                    "url": f"/data/images/originals/{image_id}{ext}",
                    "thumbnails": thumbnails,
                })
                
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
    
    return {
        "uploaded": results,
        "errors": errors,
        "total": len(files),
        "success_count": len(results),
        "error_count": len(errors),
    }