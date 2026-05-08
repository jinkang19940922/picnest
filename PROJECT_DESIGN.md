# 🖼️ PicNest - 个人图床管理系统

> **项目路径：** `/home/openclaw_other/造梦空间/picnest`
> **版本：** v1.0.0
> **最后更新：** 2026-05-08

---

## 一、项目概述

**项目名称：** PicNest（图片巢穴）
**项目定位：** 轻量、优雅、可自托管的个人图床与画廊系统
**Slogan：** _你的图片，随心托管_

### 核心特性
- 🎨 **精美 UI** — 极简现代设计，毛玻璃质感，响应式布局
- 🏞️ **瀑布流画廊** — 自适应列数、无限滚动、悬停预览
- 📤 **多方式上传** — 拖拽 / 粘贴 / URL 导入 / 批量上传
- 🔗 **多格式链接** — Markdown / HTML / URL / BBCode / UBB
- 🛡️ **水印系统** — 文字/图片水印，位置透明度可调
- 📊 **统计面板** — 存储用量、上传趋势、流量分析
- 🗑️ **回收站** — 30 天误删恢复机制
- 🌙 **主题切换** — 浅色 / 深色 / 跟随系统

### 竞品分析

| 竞品 | 技术栈 | 优势 | 不足 |
|------|--------|------|------|
| Chevereto | PHP + MySQL | 功能完善，社区成熟 | PHP 老旧，界面较繁重 |
| Lychee | PHP + MySQL | 界面简洁 | 扩展性一般 |
| Photoprism | Go + TensorFlow | AI 标签、人脸识别 | 资源占用高，侧重相册 |
| imgproxy | Go | 高性能图片处理 | 仅处理层，非完整图床 |
| **PicNest（本案）** | **Python + React** | **轻量、现代化 UI、瀑布流、API First** | 初期版本功能较少 |

---

## 二、技术架构

### 2.1 技术选型

```
┌─────────────────────────────────────────────────┐
│                   客户端                          │
│         React 18 + Vite + TypeScript             │
│         Zustand (状态管理)                        │
│         Tailwind CSS + Radix UI                 │
│         Framer Motion (动画)                     │
└─────────────────────────┬───────────────────────┘
                          │ HTTP / REST API
┌─────────────────────────▼───────────────────────┐
│                  API 网关层 (Nginx)               │
│          SSL 终止 / 静态资源 / 缓存               │
└─────────────────────────┬───────────────────────┘
                          │
┌─────────────────────────▼───────────────────────┐
│                 后端服务 (FastAPI)                │
│                                                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│   │ 图片上传  │ │ 用户认证  │ │ 文件管理     │   │
│   │ 模块      │ │ 模块(JWT) │ │ 模块         │   │
│   └──────────┘ └──────────┘ └──────────────┘   │
│                                                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│   │ 水印处理  │ │ 缩略图    │ │ 统计面板     │   │
│   │ 模块      │ │ 生成      │ │ 模块         │   │
│   └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────┬───────────────────────┘
                          │
┌─────────────────────────▼───────────────────────┐
│                      数据层                      │
│  ┌─────────────────┐   ┌──────────────────────┐  │
│  │   SQLite        │   │   本地文件系统        │  │
│  │   (元数据)       │   │   /data/images       │  │
│  └─────────────────┘   └──────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 2.2 项目目录结构

```
picnest/
│
├── docker-compose.yml          # Docker Compose 编排
├── Dockerfile.backend           # 后端镜像
├── Dockerfile.frontend          # 前端镜像
├── nginx.conf                   # Nginx 反向代理
├── .env.example                 # 环境变量示例
├── config.yaml                  # 应用配置
├── README.md                    # 项目文档
│
├── backend/                     # ── 后端目录 ──
│   ├── main.py                 # FastAPI 入口
│   ├── config.py               # 配置管理
│   ├── database.py             # SQLite 连接
│   ├── models.py               # SQLAlchemy 模型
│   ├── schemas.py              # Pydantic schemas
│   ├── routers/                # API 路由
│   │   ├── __init__.py
│   │   ├── images.py           # 图片 CRUD
│   │   ├── folders.py          # 文件夹管理
│   │   ├── users.py            # 用户认证
│   │   ├── upload.py           # 上传处理
│   │   ├── stats.py            # 统计分析
│   │   └── trash.py            # 回收站
│   ├── services/               # 业务逻辑
│   │   ├── __init__.py
│   │   ├── image_service.py    # 图片处理
│   │   ├── storage_service.py  # 存储服务
│   │   ├── thumbnail_service.py# 缩略图
│   │   └── watermark_service.py# 水印
│   ├── utils/                  # 工具函数
│   │   ├── security.py         # JWT / 密码
│   │   └── helpers.py          # 通用辅助
│   └── requirements.txt        # Python 依赖
│
├── frontend/                   # ── 前端目录 ──
│   ├── public/
│   ├── src/
│   │   ├── main.tsx            # React 入口
│   │   ├── App.tsx             # 根组件
│   │   │
│   │   ├── api/               # API 客户端
│   │   │   ├── client.ts       # Axios 实例
│   │   │   ├── images.ts       # 图片接口
│   │   │   ├── folders.ts      # 文件夹接口
│   │   │   ├── auth.ts         # 认证接口
│   │   │   └── stats.ts        # 统计接口
│   │   │
│   │   ├── components/        # 组件库
│   │   │   ├── Layout/         # 布局组件
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── Upload/          # 上传组件
│   │   │   │   ├── DropZone.tsx  # 拖拽上传
│   │   │   │   ├── UploadList.tsx # 上传列表
│   │   │   │   └── PasteUpload.tsx# 粘贴上传
│   │   │   ├── Gallery/         # 画廊组件
│   │   │   │   ├── MasonryGrid.tsx  # 瀑布流
│   │   │   │   ├── ImageCard.tsx    # 图片卡片
│   │   │   │   ├── ImageOverlay.tsx # 悬停层
│   │   │   │   └── GalleryToolbar.tsx# 工具栏
│   │   │   ├── Preview/         # 预览组件
│   │   │   │   ├── ImagePreview.tsx # 预览弹窗
│   │   │   │   └── LinkModal.tsx    # 链接复制
│   │   │   ├── Folder/          # 文件夹组件
│   │   │   │   └── FolderTree.tsx
│   │   │   └── Common/          # 通用组件
│   │   │       ├── Button.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Skeleton.tsx
│   │   │       └── EmptyState.tsx
│   │   │
│   │   ├── pages/             # 页面
│   │   │   ├── Home.tsx        # 首页
│   │   │   ├── Gallery.tsx     # 画廊页
│   │   │   ├── UploadPage.tsx  # 上传页
│   │   │   ├── Trash.tsx       # 回收站
│   │   │   ├── Admin.tsx       # 管理后台
│   │   │   ├── Settings.tsx    # 设置页
│   │   │   └── Login.tsx       # 登录页
│   │   │
│   │   ├── stores/            # Zustand 状态
│   │   │   ├── imageStore.ts   # 图片状态
│   │   │   ├── folderStore.ts  # 文件夹状态
│   │   │   ├── uiStore.ts      # UI 状态
│   │   │   └── authStore.ts    # 认证状态
│   │   │
│   │   ├── hooks/             # 自定义 Hooks
│   │   │   ├── useInfiniteScroll.ts
│   │   │   ├── useImageUpload.ts
│   │   │   └── useMasonry.ts
│   │   │
│   │   ├── styles/             # 全局样式
│   │   │   ├── globals.css
│   │   │   └── themes.css
│   │   │
│   │   ├── types/             # TypeScript 类型
│   │   │   └── index.d.ts
│   │   │
│   │   └── utils/             # 工具函数
│   │       ├── format.ts      # 格式化
│   │       └── clipboard.ts   # 剪贴板
│   │
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── data/                       # ── 数据持久化 ──
    ├── images/                 # 图片存储
    │   ├── originals/          # 原图
    │   ├── thumbnails/        # 缩略图
    │   │   ├── small/         # 150px
    │   │   ├── medium/        # 300px
    │   │   └── large/         # 600px
    │   └── watermarked/       # 水印图
    └── picnest.db             # SQLite 数据库
```

---

## 三、核心功能详解

### 3.1 瀑布流画廊 (Masonry Gallery)

**界面布局：**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  🔍 搜索图片名称...                [🏷️ 标签 ▼] [📅 日期 ▼] [📏 大小 ▼]  [☀️]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐  ┌───────────────────────┐  ┌──────────┐  ┌──────────┐    │
│  │          │  │                       │  │          │  │          │    │
│  │          │  │                       │  │          │  │          │    │
│  │   IMG    │  │        IMG            │  │   IMG    │  │   IMG    │    │
│  │  (短)    │  │       (高)            │  │  (中)    │  │  (短)    │    │
│  │          │  │                       │  │          │  │          │    │
│  ├──────────┤  │                       │  ├──────────┤  ├──────────┤    │
│  │a.jpg 1.2M│  │b.jpg 2.5MB            │  │c.jpg 0.8M│  │d.jpg 1.1M│    │
│  └──────────┘  └───────────────────────┘  └──────────┘  └──────────┘    │
│                                                                          │
│  ┌───────────────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │                       │  │          │  │          │  │          │    │
│  │                       │  │          │  │          │  │          │    │
│  │        IMG            │  │   IMG    │  │   IMG    │  │   IMG    │    │
│  │       (特高)          │  │  (方)    │  │  (中)    │  │  (长)    │    │
│  │                       │  │          │  │          │  │          │    │
│  ├───────────────────────┤  ├──────────┤  ├──────────┤  ├──────────┤    │
│  │e.jpg 3.1MB            │  │f.jpg 0.5M│  │g.jpg 1.8M│  │h.jpg 2.2M│    │
│  └───────────────────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                                          │
│                      ─ 加载更多 ↓ (第 3/10 页) ─                         │
└──────────────────────────────────────────────────────────────────────────┘
```

**瀑布流核心参数：**

| 参数 | 值 | 说明 |
|------|-----|------|
| 桌面 (≥1200px) | 4 列 | 大屏显示器 |
| 平板 (768-1199px) | 3 列 | iPad / 小平板 |
| 手机 (480-767px) | 2 列 | 大屏手机 |
| 小屏 (<480px) | 1 列 | 小屏手机 |
| 列间距 | 16px | gutter |
| 卡片圆角 | 12px | border-radius |
| 加载页大小 | 24 张/页 | per_page |

**悬停预览层 (ImageOverlay)：**
```
┌─────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░  │  ← 毛玻璃遮罩 (backdrop-filter: blur(8px))
│  ░░┌───────────────┐░░  │
│  ░░│               │░░  │
│  ░░│   图片本体     │░░  │
│  ░░│               │░░  │
│  ░░└───────────────┘░░  │
│  ░░ 📷 photo_001.jpg ░░  │  ← 文件名
│  ░░ 1920 × 1080      ░░  │  ← 分辨率
│  ░░ 2.5 MB    2024-01-15░░  │  ← 大小 & 日期
│  ░░                     ░░  │
│  ░░ [👁 预览] [📋 链接] [🗑] ░░  │  ← 操作按钮
│  ░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────┘
```

**骨架屏加载动画：**
```
┌─────┐ ┌───────────┐ ┌─────┐ ┌─────┐
│▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓│ │▓▓▓▓▓▓│  ← 灰度闪烁动画
│▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓▓│ │     │ │▓▓▓▓▓▓│    (shimmer effect)
└─────┘ └───────────┘ └─────┘ └─────┘
```

**无限滚动触发逻辑：**
```
滚动位置 >= (总高度 - 视口高度 * 1.5)  →  加载下一页
        ↓
    防抖 300ms
        ↓
    显示加载指示器
        ↓
    请求 API (page, per_page, folder_id, tag, sort)
        ↓
    追加到列表 / 显示"没有更多了"
```

---

### 3.2 图片上传 (Upload)

**支持方式：**

| 方式 | 触发 | 说明 |
|------|------|------|
| 🖱️ 拖拽 | 拖文件到 DropZone | 支持多文件 |
| 📋 粘贴 | Ctrl+V / Cmd+V | 剪贴板图片 |
| 📁 点击 | 点击选择文件 | 支持批量 |
| 🔗 URL | 输入图片 URL | 远程图片导入 |
| 📱 批量 | 多文件选择 | 最多 20 个 |

**上传流程：**
```
用户选择文件
      ↓
前端校验 (大小、格式、尺寸)
      ↓
分片上传 ( > 5MB 时启用)
      ↓
后端接收 → 病毒扫描(预留) → 脱敏处理(预留)
      ↓
生成 MD5 哈希 → 检查重复
      ↓
存储原图 → 生成缩略图 → 添加水印(可选)
      ↓
写入数据库 → 返回图片信息
      ↓
前端展示 + 显示链接选项
```

**上传进度 UI：**
```
┌──────────────────────────────────────────────────┐
│ 📷 vacation photo.jpg                           │
│ ████████████████████░░░░░░░░░░░░░  68%  2.3MB/s│
│                        [⏸ 暂停]  [✕ 取消]        │
└──────────────────────────────────────────────────┘
```

---

### 3.3 链接输出 (Link Output)

点击图片右下角「📋 链接」按钮，弹出链接格式选择器：

```
┌─────────────────────────────────────────┐
│  📋 复制图片链接                    [✕]  │
├─────────────────────────────────────────┤
│                                         │
│  [ Markdown ]  [ HTML ]  [ URL ]  [ BB ] │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ![](https://pic.xxx.com/i/abc.jpg)│  │
│  └───────────────────────────────────┘  │
│                        [📋 复制]  [🔄 刷新] │
│                                         │
│  ☑️ 复制成功后打开 URL                   │
└─────────────────────────────────────────┘
```

**支持的格式：**

| 格式 | 输出示例 |
|------|---------|
| Markdown | `![](https://pic.xxx.com/i/abc.jpg)` |
| HTML | `<img src="https://pic.xxx.com/i/abc.jpg" alt=""/>` |
| URL | `https://pic.xxx.com/i/abc.jpg` |
| BBCode | `[img]https://pic.xxx.com/i/abc.jpg[/img]` |
| UBB | `{img}https://pic.xxx.com/i/abc.jpg{/img}` |
| DataURL | `data:image/jpeg;base64,/9j/4AAQ...` |

---

### 3.4 文件夹管理

支持多级目录创建与管理，目录结构树：

```
📁 全部图片
├── 📁 摄影
│   ├── 📁 风景
│   └── 📁 人像
├── 📁 截图
│   ├── 📁 工作
│   └── 📁 个人
├── 📁 素材
│   ├── 📁 图标
│   └── 📁 背景
└── 📁 临时
```

**操作：** 新建 / 重命名 / 移动 / 删除（含二次确认）

---

### 3.5 标签系统

- 为图片打多个标签
- 标签自动补全
- 按标签筛选
- 标签云展示

---

### 3.6 回收站

- 删除后默认进入回收站
- 30 天后自动清理
- 支持恢复 / 永久删除
- 显示删除时间倒计时

---

### 3.7 统计分析

```
┌─────────────────────────────────────────────────────┐
│  📊 统计概览                                         │
├──────────┬──────────┬──────────┬───────────────────┤
│ 🖼️ 128   │ 💾 2.4GB │ 📅 今日+12 │ 📈 本月 156      │
│ 图片总数   │ 存储用量  │ 今日上传   │ 本月上传         │
├──────────┴──────────┴──────────┴───────────────────┤
│                                                      │
│  📈 上传趋势图 (近 30 天)                            │
│  ▓▓▓▓▓▓▓▓▓▓▓▓                                     │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                          │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐                    │
│  │ 📁 摄影 45% │  │ 📁 截图 30% │                    │
│  │ ████████   │  │ ██████     │                    │
│  └─────────────┘  └─────────────┘                    │
└─────────────────────────────────────────────────────┘
```

---

## 四、数据库设计

### 4.1 ER 图

```
users ─────┐
  │         │ 1:N
  │         └──────→ folders ───────┐
  │                                │ 1:N
  │ images ────────────────────────┘
  │   │
  │   └── tags (多对多 via image_tags)
  │
  └── image_tags ←── tags
```

### 4.2 表结构

**users (用户表)**
```sql
CREATE TABLE users (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email       TEXT,
    role        TEXT DEFAULT 'user',      -- 'admin' | 'user'
    avatar_url  TEXT,
    storage_quota   INTEGER DEFAULT 10737418240,  -- 10GB
    storage_used    INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**folders (文件夹表)**
```sql
CREATE TABLE folders (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    parent_id   TEXT REFERENCES folders(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    color       TEXT DEFAULT '#6366F1',   -- 文件夹颜色
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**images (图片表)**
```sql
CREATE TABLE images (
    id              TEXT PRIMARY KEY,
    filename        TEXT NOT NULL,           -- 存储文件名 (UUID)
    original_name   TEXT NOT NULL,           -- 原始文件名
    storage_path    TEXT NOT NULL,           -- 相对存储路径
    thumbnail_small  TEXT,                   -- 缩略图小
    thumbnail_medium TEXT,                   -- 缩略图中
    thumbnail_large  TEXT,                   -- 缩略图大
    file_size       INTEGER NOT NULL,        -- 文件大小 (bytes)
    mime_type       TEXT NOT NULL,           -- MIME 类型
    width           INTEGER,                  -- 图片宽度
    height          INTEGER,                  -- 图片高度
    md5_hash        TEXT UNIQUE,             -- MD5 去重
    folder_id       TEXT REFERENCES folders(id) ON DELETE SET NULL,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public       BOOLEAN DEFAULT 1,       -- 公开/私有
    is_starred      BOOLEAN DEFAULT 0,       -- 收藏
    view_count      INTEGER DEFAULT 0,        -- 浏览次数
    download_count  INTEGER DEFAULT 0,       -- 下载次数
    status          TEXT DEFAULT 'active',   -- active | trashed | deleted
    trashed_at      DATETIME,                -- 入回收站时间
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at      DATETIME
);
```

**tags (标签表)**
```sql
CREATE TABLE tags (
    id      TEXT PRIMARY KEY,
    name    TEXT UNIQUE NOT NULL,
    color   TEXT DEFAULT '#EC4899',
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE
);
```

**image_tags (图片-标签关联表)**
```sql
CREATE TABLE image_tags (
    image_id TEXT REFERENCES images(id) ON DELETE CASCADE,
    tag_id   TEXT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (image_id, tag_id)
);
```

**FTS5 全文搜索 (图片搜索)**
```sql
CREATE VIRTUAL TABLE images_fts USING fts5(
    original_name, tags, content='images', content_rowid='rowid'
);
```

---

## 五、API 接口设计

### 5.1 接口概览

**Base URL：** `/api/v1`

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/auth/login` | 登录 | ❌ |
| POST | `/auth/register` | 注册 | ❌ |
| POST | `/auth/refresh` | 刷新 Token | ✅ |
| GET | `/users/me` | 当前用户信息 | ✅ |
| PUT | `/users/me` | 更新用户信息 | ✅ |
| GET | `/images` | 获取图片列表 | ✅ |
| POST | `/images/upload` | 上传图片 | ✅ |
| POST | `/images/batch-upload` | 批量上传 | ✅ |
| GET | `/images/:id` | 获取图片详情 | ✅ |
| PUT | `/images/:id` | 更新图片信息 | ✅ |
| DELETE | `/images/:id` | 删除图片(进回收站) | ✅ |
| POST | `/images/batch-delete` | 批量删除 | ✅ |
| DELETE | `/images/:id/permanent` | 永久删除 | ✅ |
| POST | `/images/:id/restore` | 恢复图片 | ✅ |
| GET | `/folders` | 获取文件夹树 | ✅ |
| POST | `/folders` | 创建文件夹 | ✅ |
| PUT | `/folders/:id` | 更新文件夹 | ✅ |
| DELETE | `/folders/:id` | 删除文件夹 | ✅ |
| GET | `/tags` | 获取标签列表 | ✅ |
| POST | `/tags` | 创建标签 | ✅ |
| GET | `/trash` | 回收站列表 | ✅ |
| DELETE | `/trash/empty` | 清空回收站 | ✅ |
| GET | `/stats/overview` | 统计概览 | ✅ |
| GET | `/stats/storage` | 存储统计 | ✅ |

### 5.2 主要接口详情

**获取图片列表 GET /images**
```json
// Query Parameters
{
  "page": 1,
  "per_page": 24,
  "folder_id": "optional",
  "tag_ids": ["optional"],
  "search": "optional",
  "sort": "newest|oldest|size|name", 
  "status": "active|trashed"
}

// Response
{
  "data": [
    {
      "id": "abc123",
      "filename": "abc123.jpg",
      "original_name": "vacation.jpg",
      "url": "/data/images/originals/abc123.jpg",
      "thumbnails": {
        "small": "/data/images/thumbnails/small/abc123.jpg",
        "medium": "/data/images/thumbnails/medium/abc123.jpg",
        "large": "/data/images/thumbnails/large/abc123.jpg"
      },
      "width": 1920,
      "height": 1080,
      "file_size": 2621440,
      "mime_type": "image/jpeg",
      "folder_id": "folder-uuid",
      "folder_name": "摄影",
      "tags": [{"id": "t1", "name": "风景", "color": "#22C55E"}],
      "is_starred": false,
      "view_count": 42,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 24,
    "total": 128,
    "total_pages": 6
  }
}
```

**上传图片 POST /images/upload**
```json
// Request: multipart/form-data
{
  "file": "<binary>",
  "folder_id": "optional",
  "tag_ids": ["t1", "t2"],
  "is_public": true,
  "watermark": false
}

// Response
{
  "id": "new-uuid",
  "filename": "new-uuid.jpg",
  "url": "/data/images/originals/new-uuid.jpg",
  "thumbnails": {...},
  "width": 1920,
  "height": 1080,
  "file_size": 2621440,
  "original_name": "my-photo.jpg"
}
```

---

## 六、Docker 部署

### 6.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # ── 后端 API ──
  backend:
    build:
      context: ./backend
      dockerfile: ../Dockerfile.backend
    container_name: picnest-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data/images:/app/data/images
      - ./data/picnest.db:/app/data/picnest.db
      - ./config.yaml:/app/config.yaml:ro
    environment:
      - TZ=Asia/Shanghai
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - picnest-net

  # ── 前端 Web UI ──
  frontend:
    build:
      context: ./frontend
      dockerfile: ../Dockerfile.frontend
    container_name: picnest-frontend
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - picnest-net

  # ── Nginx 反向代理 ──
  nginx:
    image: nginx:alpine
    container_name: picnest-nginx
    restart: unless-stopped
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./data/images:/data/images:ro  # 只读给 Nginx
      - ./data/ssl:/etc/nginx/ssl:ro   # SSL 证书
    depends_on:
      - backend
      - frontend
    networks:
      - picnest-net

networks:
  picnest-net:
    driver: bridge
```

### 6.2 环境变量 (.env)

```bash
# 应用
APP_NAME=PicNest
APP_DEBUG=false
APP_SECRET_KEY=your-super-secret-key-change-me

# 数据库
DATABASE_URL=sqlite:///./data/picnest.db

# 存储
STORAGE_PATH=/app/data/images
MAX_FILE_SIZE_MB=50

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443
```

### 6.3 快速启动

```bash
# 1. 进入项目目录
cd /home/openclaw_other/造梦空间/picnest

# 2. 复制配置
cp .env.example .env
# 编辑 .env 设置密钥

# 3. 构建并启动
docker-compose up -d --build

# 4. 查看日志
docker-compose logs -f

# 5. 访问
open http://localhost:8080
```

---

## 七、UI/UX 设计规范

### 7.1 色彩系统

**浅色模式 (Light)**
```
背景:     #FFFFFF
表面:     #F8FAFC
边框:     #E2E8F0
主文本:   #0F172A
次文本:   #64748B
主色:     #6366F1  (Indigo-500)
主色悬停: #4F46E5  (Indigo-600)
辅助色:   #EC4899  (Pink-500)
成功:     #22C55E  (Green-500)
警告:     #F59E0B  (Amber-500)
危险:     #EF4444  (Red-500)
```

**深色模式 (Dark)**
```
背景:     #0F172A
表面:     #1E293B
边框:     #334155
主文本:   #F8FAFC
次文本:   #94A3B8
主色:     #818CF8  (Indigo-400)
主色悬停: #6366F1  (Indigo-500)
辅助色:   #F472B6  (Pink-400)
成功:     #4ADE80  (Green-400)
警告:     #FBBF24  (Amber-400)
危险:     #F87171  (Red-400)
```

### 7.2 字体

```
主字体:   "Inter", "Noto Sans SC", system-ui, sans-serif
等宽字体: "JetBrains Mono", "Fira Code", monospace
```

**字号层级：**
```
xs:   12px
sm:   14px
base: 16px
lg:   18px
xl:   20px
2xl:  24px
3xl:  30px
4xl:  36px
```

### 7.3 间距系统

```
4px 基础单位
xs: 4px    sm: 8px    md: 16px
lg: 24px   xl: 32px   2xl: 48px
```

### 7.4 圆角

```
sm:   4px
md:   8px
lg:   12px
xl:   16px
full: 9999px (药丸形)
```

### 7.5 阴影

```
sm:   0 1px 2px rgba(0,0,0,0.05)
md:   0 4px 6px rgba(0,0,0,0.07)
lg:   0 10px 15px rgba(0,0,0,0.1)
xl:   0 20px 25px rgba(0,0,0,0.15)
```

### 7.6 动效规范

| 动画 | 时长 | 缓动 |
|------|------|------|
| 微交互 (hover) | 150ms | ease-out |
| 展开/收起 | 200ms | ease-in-out |
| 页面过渡 | 300ms | ease-in-out |
| 模态弹窗 | 250ms | ease-out |
| 骨架屏闪烁 | 1.5s | linear (循环) |

---

## 八、配置说明 (config.yaml)

```yaml
app:
  name: "PicNest"
  debug: false
  secret_key: "change-me-in-production"
  base_url: "http://localhost:8080"

server:
  host: "0.0.0.0"
  port: 3000
  workers: 4

database:
  type: "sqlite"
  path: "data/picnest.db"
  # 迁移: 自动创建表结构

storage:
  type: "local"
  base_path: "data/images"
  originals: "originals"
  thumbnails: "thumbnails"
  watermarked: "watermarked"
  max_file_size: 52428800      # 50MB
  allowed_extensions:
    - ".jpg"
    - ".jpeg"
    - ".png"
    - ".gif"
    - ".webp"
    - ".avif"
    - ".svg"

thumbnail:
  enabled: true
  sizes:
    small:  150
    medium: 300
    large:  600
  quality: 85
  format: "webp"              # 转为 webp 节省空间

watermark:
  enabled: false
  type: "text"                # text | image
  text: "PicNest"
  font_size: 24
  position: "bottom-right"   # top-left | top-right | bottom-left | bottom-right | center
  opacity: 0.5
  color: "#FFFFFF"
  margin: 20

user:
  default_quota: 10737418240  # 10GB
  registration_enabled: true
  default_role: "user"

trash:
  auto_cleanup_days: 30       # 30 天后自动清理
  cleanup_interval_hours: 24   # 每 24 小时检查一次

theme:
  default_mode: "light"       # light | dark | system
  allow_user_change: true

cors:
  allow_origins:
    - "http://localhost:8080"
  allow_credentials: true

log:
  level: "info"
  format: "json"
```

---

## 九、技术亮点

| # | 特性 | 说明 |
|---|------|------|
| 1 | 🏞️ **瀑布流布局** | 纯 CSS Grid + Intersection Observer，性能优秀 |
| 2 | ⚡ **渐进式加载** | 骨架屏 → 缩略图 → 原图，感知流畅 |
| 3 | 🔍 **本地 FTS5 搜索** | SQLite 内置全文搜索，无需额外服务 |
| 4 | 🖼️ **WebP 缩略图** | 自动转 WebP，大幅节省带宽和存储 |
| 5 | 🔗 **多格式链接** | 一键复制，适配各类使用场景 |
| 6 | 🌙 **主题无缝切换** | CSS 变量 + localStorage，刷新仍保持 |
| 7 | 📱 **响应式设计** | 4 → 3 → 2 → 1 列自适应 |
| 8 | 🎨 **毛玻璃 UI** | backdrop-filter 打造现代质感 |
| 9 | 🔐 **JWT 无状态认证** | 支持 Token 刷新，可扩展 API |
| 10 | 🗑️ **软删除 + 回收站** | 30 天恢复窗口，防止误删 |
| 11 | 📊 **实时统计** | 上传趋势、存储用量一目了然 |
| 12 | 🏷️ **标签系统** | 多对多关联，支持标签筛选 |

---

## 十、后续扩展计划

- [ ] **云存储支持** — S3 / 阿里云 OSS / 腾讯 COS
- [ ] **图片编辑** — 裁剪、旋转、滤镜、压缩
- [ ] **相册分享** — 生成公开相册链接
- [ ] **API Token** — 第三方应用接入
- [ ] **Webhook** — 上传完成事件通知
- [ ] **浏览器插件** — 一键截图上传
- [ ] **移动端 App** — Flutter / React Native
- [ ] **AI 标签** — 自动图片分类（基于 TensorFlow.js）
- [ ] **HEIC 格式** — iOS 图片格式支持
- [ ] **CDN 集成** — 加速全球访问

---

## 十一、依赖清单

### 后端 (Python 3.11+)

```
fastapi==0.109.2
uvicorn[standard]==0.27.1
python-multipart==0.0.9
pillow==10.2.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
aiosqlite==0.19.0
pyyaml==6.0.1
python-magic==0.4.27
pydantic==2.6.1
pydantic-settings==2.1.0
httpx==0.26.0
```

### 前端 (Node.js 18+)

```
react==18.2.0
react-dom==18.2.0
react-router-dom==6.22.0
zustand==4.5.1
axios==1.6.7
@tanstack/react-query==5.17.19
framer-motion==11.0.3
react-dropzone==14.2.3
@radix-ui/react-dialog==1.0.5
@radix-ui/react-dropdown-menu==2.0.6
@radix-ui/react-select==2.0.0
@radix-ui/react-tooltip==1.0.7
clsx==2.1.0
tailwind-merge==2.2.1
date-fns==3.3.1
```

---

_🎨 PicNest v1.0 — 匠心设计，为你的图片打造一个温暖的家_