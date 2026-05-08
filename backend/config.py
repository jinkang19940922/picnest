"""
PicNest - 配置文件
"""
import os
from pathlib import Path
from typing import List, Optional
import yaml
from pydantic import Field, ConfigDict
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    name: str = "PicNest"
    debug: bool = False
    secret_key: str = "change-me"
    base_url: str = "http://localhost:8080"


class ServerConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    host: str = "0.0.0.0"
    port: int = 3000
    workers: int = 1


class DatabaseConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    type: str = "sqlite"
    path: str = "data/picnest.db"


class StorageConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    type: str = "local"
    base_path: str = "data/images"
    originals: str = "originals"
    thumbnails: str = "thumbnails"
    watermarked: str = "watermarked"
    max_file_size: int = 52428800  # 50MB
    allowed_extensions: List[str] = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"]


class ThumbnailConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    enabled: bool = True
    small: int = 150
    medium: int = 300
    large: int = 600
    quality: int = 85
    format: str = "webp"


class WatermarkConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    enabled: bool = False
    type: str = "text"
    text: str = "PicNest"
    font_size: int = 24
    position: str = "bottom-right"
    opacity: float = 0.5
    color: str = "#FFFFFF"
    margin: int = 20


class UserConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    default_quota: int = 1099511627776  # 1TB in bytes (1024^4)
    max_quota: int = 1127426918400     # 1.05TB in bytes
    registration_enabled: bool = True
    default_role: str = "user"


class TrashConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    auto_cleanup_days: int = 30
    cleanup_interval_hours: int = 24


class ThemeConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    default_mode: str = "light"
    allow_user_change: bool = True


class CORSConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    allow_origins: List[str] = ["*"]
    allow_credentials: bool = True


class LogConfig(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')
    
    level: str = "info"
    format: str = "text"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore')

    app: AppConfig = Field(default_factory=AppConfig)
    server: ServerConfig = Field(default_factory=ServerConfig)
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    storage: StorageConfig = Field(default_factory=StorageConfig)
    thumbnail: ThumbnailConfig = Field(default_factory=ThumbnailConfig)
    watermark: WatermarkConfig = Field(default_factory=WatermarkConfig)
    user: UserConfig = Field(default_factory=UserConfig)
    trash: TrashConfig = Field(default_factory=TrashConfig)
    theme: ThemeConfig = Field(default_factory=ThemeConfig)
    cors: CORSConfig = Field(default_factory=CORSConfig)
    log: LogConfig = Field(default_factory=LogConfig)

    @classmethod
    def from_yaml(cls, path: str) -> "Settings":
        """从 YAML 文件加载配置"""
        p = Path(path)
        if not p.exists():
            return cls()
        
        with open(p, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        
        if not data:
            return cls()
        
        def to_snake(camel_dict: dict) -> dict:
            result = {}
            for k, v in camel_dict.items():
                snake_key = "".join(["_" + c.lower() if c.isupper() else c for c in k]).lstrip("_")
                if isinstance(v, dict):
                    result[snake_key] = to_snake(v)
                else:
                    result[snake_key] = v
            return result
        
        data = to_snake(data)
        return cls(**data)


# 全局配置实例
def get_settings() -> Settings:
    config_path = os.environ.get("PICNEST_CONFIG", "config.yaml")
    return Settings.from_yaml(config_path)


settings = get_settings()