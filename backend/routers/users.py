"""
PicNest - 用户路由
"""
import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
import aiosqlite

from schemas import UserCreate, UserResponse, UserLogin, Token, UserUpdate
from utils.security import hash_password, verify_password, create_access_token, get_current_user
from database import get_db


router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/register", response_model=UserResponse)
async def register(data: UserCreate):
    """用户注册"""
    async with get_db() as db:
        # 检查用户名是否存在
        cursor = await db.execute("SELECT id FROM users WHERE username = ?", (data.username,))
        row = await cursor.fetchone()
        if row:
            raise HTTPException(status_code=400, detail="用户名已存在")
        
        # 创建用户
        user_id = str(uuid.uuid4())
        password_hash = hash_password(data.password)
        
        # 使用配置中的默认配额（字节）
        default_quota = settings.user.default_quota
        
        await db.execute(
            """INSERT INTO users (id, username, password_hash, email, storage_quota) VALUES (?, ?, ?, ?, ?)""",
            (user_id, data.username, password_hash, data.email, default_quota),
        )
        await db.commit()
        
        cursor = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = await cursor.fetchone()
        return dict(user)


@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    """用户登录"""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM users WHERE username = ? AND is_active = 1",
            (data.username,),
        )
        user = await cursor.fetchone()
        
        if not user or not verify_password(data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
            )
        
        access_token = create_access_token({
            "sub": user["id"],
            "role": user["role"],
            "username": user["username"],
        })
        
        return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """获取当前用户信息"""
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM users WHERE id = ?", (current_user["user_id"],))
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        return dict(user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """更新当前用户信息"""
    async with get_db() as db:
        updates = []
        values = []
        if data.email is not None:
            updates.append("email = ?")
            values.append(data.email)
        if data.avatar_url is not None:
            updates.append("avatar_url = ?")
            values.append(data.avatar_url)
        
        if updates:
            updates.append("updated_at = ?")
            values.append(datetime.utcnow().isoformat())
            values.append(current_user["user_id"])
            
            await db.execute(
                f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
                values,
            )
            await db.commit()
        
        cursor = await db.execute("SELECT * FROM users WHERE id = ?", (current_user["user_id"],))
        user = await cursor.fetchone()
        return dict(user)