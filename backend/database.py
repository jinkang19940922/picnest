"""
PicNest - 数据库模块
"""
import aiosqlite
import os
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from config import settings


DATABASE_PATH = settings.database.path


async def init_db():
    """初始化数据库，创建表结构"""
    os.makedirs(os.path.dirname(DATABASE_PATH) or ".", exist_ok=True)
    
    async with aiosqlite.connect(DATABASE_PATH) as db:
        # 启用外键约束
        await db.execute("PRAGMA foreign_keys = ON")
        
        # 创建 users 表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT,
                role TEXT DEFAULT 'user',
                avatar_url TEXT,
                storage_quota INTEGER DEFAULT 10737418240,
                storage_used INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建 folders 表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT,
                user_id TEXT NOT NULL,
                color TEXT DEFAULT '#6366F1',
                sort_order INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # 创建 images 表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS images (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                storage_path TEXT NOT NULL,
                thumbnail_small TEXT,
                thumbnail_medium TEXT,
                thumbnail_large TEXT,
                file_size INTEGER NOT NULL,
                mime_type TEXT NOT NULL,
                width INTEGER,
                height INTEGER,
                md5_hash TEXT UNIQUE,
                folder_id TEXT,
                user_id TEXT NOT NULL,
                is_public INTEGER DEFAULT 1,
                is_starred INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                download_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                trashed_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted_at DATETIME,
                FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # 创建 tags 表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS tags (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                color TEXT DEFAULT '#EC4899',
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # 创建 image_tags 关联表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS image_tags (
                image_id TEXT REFERENCES images(id) ON DELETE CASCADE,
                tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
                PRIMARY KEY (image_id, tag_id)
            )
        """)
        
        # 创建 FTS5 全文搜索虚拟表
        await db.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS images_fts USING fts5(
                original_name,
                content='images',
                content_rowid='rowid'
            )
        """)
        
        # 创建索引
        await db.execute("CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_images_folder_id ON images(folder_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_images_status ON images(status)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id)")
        
        # 触发器：自动同步 FTS
        await db.execute("""
            CREATE TRIGGER IF NOT EXISTS images_ai AFTER INSERT ON images BEGIN
                INSERT INTO images_fts(rowid, original_name) VALUES (new.rowid, new.original_name);
            END
        """)
        
        await db.execute("""
            CREATE TRIGGER IF NOT EXISTS images_ad AFTER DELETE ON images BEGIN
                INSERT INTO images_fts(images_fts, rowid, original_name) VALUES('delete', old.rowid, old.original_name);
            END
        """)
        
        await db.execute("""
            CREATE TRIGGER IF NOT EXISTS images_au AFTER UPDATE ON images BEGIN
                INSERT INTO images_fts(images_fts, rowid, original_name) VALUES('delete', old.rowid, old.original_name);
                INSERT INTO images_fts(rowid, original_name) VALUES (new.rowid, new.original_name);
            END
        """)
        
        await db.commit()


@asynccontextmanager
async def get_db():
    """获取数据库连接的上下文管理器"""
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()