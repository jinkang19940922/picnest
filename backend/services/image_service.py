"""
PicNest - 图片处理服务
"""
import io
import hashlib
from typing import Tuple, Optional
from datetime import datetime
import aiosqlite

from PIL import Image
from config import settings


def get_image_dimensions(file_data: bytes) -> Tuple[int, int]:
    """获取图片尺寸"""
    img = Image.open(io.BytesIO(file_data))
    return img.size  # (width, height)


def generate_md5(file_data: bytes) -> str:
    """生成 MD5 哈希"""
    return hashlib.md5(file_data).hexdigest()


async def process_image(
    file_data: bytes,
    original_name: str,
    image_id: str,
    user_id: str,
) -> dict:
    """
    处理图片：生成缩略图、应用水印等
    返回处理结果信息
    """
    # 确保存储目录存在
    import os
    originals_dir = os.path.join(settings.storage.base_path, settings.storage.originals)
    thumb_dir = os.path.join(settings.storage.base_path, settings.storage.thumbnails)
    os.makedirs(originals_dir, exist_ok=True)
    os.makedirs(thumb_dir, exist_ok=True)
    
    # 获取图片信息
    img = Image.open(io.BytesIO(file_data))
    width, height = img.size
    
    # 转换为 RGB（处理 PNG 透明通道）
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    # 保存原图
    ext = get_file_ext(original_name)
    original_path = f"{originals_dir}/{image_id}{ext}"
    img.save(original_path, quality=95)
    
    thumbnails = {}
    
    # 生成缩略图
    if settings.thumbnail.enabled:
        for size_name, size in {"small": settings.thumbnail.small, "medium": settings.thumbnail.medium, "large": settings.thumbnail.large}.items():
            thumb_size_dir = os.path.join(thumb_dir, size_name)
            os.makedirs(thumb_size_dir, exist_ok=True)
            
            thumb_img = img.copy()
            thumb_img.thumbnail((size, size), Image.Resampling.LANCZOS)
            
            thumb_path = f"{thumb_size_dir}/{image_id}.webp"
            thumb_img.save(thumb_path, "WEBP", quality=settings.thumbnail.quality)
            thumbnails[size_name] = f"/data/images/thumbnails/{size_name}/{image_id}.webp"
    
    # 应用水印
    if settings.watermark.enabled:
        watermarked_path = f"{os.path.join(settings.storage.base_path, settings.storage.watermarked)}/{image_id}{ext}"
        await apply_watermark(img, watermarked_path)
    else:
        watermarked_path = original_path
    
    return {
        "width": width,
        "height": height,
        "original_path": original_path,
        "thumbnail_small": thumbnails.get("small"),
        "thumbnail_medium": thumbnails.get("medium"),
        "thumbnail_large": thumbnails.get("large"),
    }


def get_file_ext(filename: str) -> str:
    """获取文件扩展名"""
    if "." not in filename:
        return ".jpg"
    ext = "." + filename.rsplit(".", 1)[-1].lower()
    # 统一转为 jpg 存储
    if ext in [".jpeg", ".jpg"]:
        return ".jpg"
    if ext == ".png":
        return ".png"
    if ext == ".gif":
        return ".gif"
    return ext


async def apply_watermark(img: Image.Image, output_path: str):
    """应用水印"""
    from PIL import ImageDraw, ImageFont
    
    draw = ImageDraw.Draw(img)
    
    # 字体设置
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", settings.watermark.font_size)
    except:
        font = ImageFont.load_default()
    
    # 计算水印位置
    text = settings.watermark.text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    img_width, img_height = img.size
    margin = settings.watermark.margin
    
    positions = {
        "bottom-right": (img_width - text_width - margin, img_height - text_height - margin),
        "bottom-left": (margin, img_height - text_height - margin),
        "top-right": (img_width - text_width - margin, margin),
        "top-left": (margin, margin),
        "center": ((img_width - text_width) // 2, (img_height - text_height) // 2),
    }
    
    pos = positions.get(settings.watermark.position, positions["bottom-right"])
    
    # 绘制水印
    fill_color = settings.watermark.color.lstrip("#")
    fill_color = tuple(int(fill_color[i:i+2], 16) for i in (0, 2, 4))
    fill_color = fill_color + (int(settings.watermark.opacity * 255),)
    
    draw.text(pos, text, fill=fill_color, font=font)
    
    import os
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)