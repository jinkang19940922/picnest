"""
PicNest - Pydantic Schemas
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ========== 用户 ==========

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: str
    role: str
    avatar_url: Optional[str] = None
    storage_quota: int
    storage_used: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None


# ========== 文件夹 ==========

class FolderBase(BaseModel):
    name: str
    parent_id: Optional[str] = None
    color: str = "#6366F1"


class FolderCreate(FolderBase):
    pass


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None


class FolderResponse(FolderBase):
    id: str
    user_id: str
    sort_order: int
    created_at: datetime
    image_count: int = 0

    class Config:
        from_attributes = True


class FolderTreeResponse(FolderBase):
    id: str
    children: List["FolderTreeResponse"] = []

    class Config:
        from_attributes = True


# ========== 标签 ==========

class TagBase(BaseModel):
    name: str
    color: str = "#EC4899"


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True


# ========== 图片 ==========

class ImageBase(BaseModel):
    original_name: str
    folder_id: Optional[str] = None
    is_public: bool = True


class ImageResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    url: str
    thumbnails: dict
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: int
    mime_type: str
    folder_id: Optional[str] = None
    folder_name: Optional[str] = None
    tags: List[TagResponse] = []
    is_starred: bool
    is_public: bool
    view_count: int
    download_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class ImageUpdate(BaseModel):
    original_name: Optional[str] = None
    folder_id: Optional[str] = None
    is_public: Optional[bool] = None
    is_starred: Optional[bool] = None
    tag_ids: Optional[List[str]] = None


class ImageListResponse(BaseModel):
    data: List[ImageResponse]
    meta: dict


# ========== 统计 ==========

class StatsOverview(BaseModel):
    total_images: int
    total_storage: int
    today_uploads: int
    month_uploads: int
    trash_count: int
    top_folders: List[dict]
    top_tags: List[dict]


class StorageStats(BaseModel):
    used: int
    quota: int
    used_percent: float
    by_folder: List[dict]


# ========== 通用 ==========

class MessageResponse(BaseModel):
    message: str
    code: str = "success"


class PaginatedResponse(BaseModel):
    data: List[dict]
    meta: dict = Field(default_factory=lambda: {
        "page": 1,
        "per_page": 24,
        "total": 0,
        "total_pages": 0
    })