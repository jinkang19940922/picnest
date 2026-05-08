"""
PicNest - FastAPI 主入口
"""
import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pathlib import Path

from config import settings
from database import init_db
from routers import users, images, folders, upload, stats, trash
from routers.images import tags_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    # 启动时
    print(f"🚀 PicNest 启动中...")
    
    # 初始化数据库
    await init_db()
    print("✅ 数据库初始化完成")
    
    # 确保存储目录存在
    os.makedirs(settings.storage.base_path, exist_ok=True)
    for subdir in [settings.storage.originals, settings.storage.thumbnails, settings.storage.watermarked]:
        os.makedirs(os.path.join(settings.storage.base_path, subdir), exist_ok=True)
    for size in ["small", "medium", "large"]:
        os.makedirs(os.path.join(settings.storage.base_path, settings.storage.thumbnails, size), exist_ok=True)
    
    print(f"✅ 存储目录初始化完成: {settings.storage.base_path}")
    
    # 创建一个默认管理员账户（如果不存在）
    from database import get_db
    from utils.security import hash_password, create_access_token
    
    async with get_db() as db:
        cursor = await db.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
        if not await cursor.fetchone():
            import uuid
            admin_id = str(uuid.uuid4())
            default_quota = settings.user.default_quota
            await db.execute(
                """INSERT INTO users (id, username, password_hash, role, storage_quota) 
                   VALUES (?, ?, ?, 'admin', ?)""",
                (admin_id, "admin", hash_password("admin123"), default_quota),
            )
            await db.commit()
            print("⚠️  默认管理员已创建: admin / admin123")
    
    yield
    
    # 关闭时
    print("👋 PicNest 已关闭")


# 创建应用
app = FastAPI(
    title=settings.app.name,
    description="个人图床管理系统 API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件（图片访问）
static_path = Path(settings.storage.base_path).resolve()
if static_path.exists():
    app.mount("/data/images", StaticFiles(directory=str(static_path)), name="images")


# 注册路由
app.include_router(users.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")
app.include_router(tags_router, prefix="/api/v1")
app.include_router(folders.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(trash.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "PicNest API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/v1")
async def api_info():
    return {
        "name": settings.app.name,
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/auth",
            "images": "/api/v1/images",
            "folders": "/api/v1/folders",
            "tags": "/api/v1/tags",
            "stats": "/api/v1/stats",
            "trash": "/api/v1/trash",
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.server.host,
        port=settings.server.port,
        reload=settings.app.debug,
    )