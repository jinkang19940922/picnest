# PicNest - 个人图床管理系统

<div align="center">

![PicNest Logo](https://via.placeholder.com/120x120/6366F1/EC4899?text=P)

**🖼️ 你的图片，随心托管**

一个轻量、优雅、可自托管的个人图床与画廊系统

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

</div>

---

## ✨ 特性

- 🎨 **精美 UI** — 极简现代设计，毛玻璃质感，响应式布局
- 🏞️ **瀑布流画廊** — 自适应列数、无限滚动、悬停预览
- 📤 **多方式上传** — 拖拽 / 粘贴 / URL 导入 / 批量上传
- 🔗 **多格式链接** — Markdown / HTML / URL / BBCode 一键复制
- 🛡️ **水印系统** — 文字/图片水印，位置透明度可调
- 📊 **统计面板** — 存储用量、上传趋势、流量分析
- 🗑️ **回收站** — 30 天误删恢复机制
- 🌙 **主题切换** — 浅色 / 深色 / 跟随系统

---

## 🚀 快速开始

### 前置要求

- Docker & Docker Compose
- Git

### 1. 克隆项目

```bash
git clone https://github.com/yourname/picnest.git
cd picnest
```

### 2. 配置（可选）

```bash
cp .env.example .env
# 编辑 .env 设置密钥和其他配置
```

### 3. 启动服务

```bash
docker-compose up -d --build
```

### 4. 访问

- **Web UI:** http://localhost:8080
- **API:** http://localhost:8080/api/v1

### 5. 默认账户

```
用户名: admin
密码:   admin123
```

> ⚠️ 请在首次登录后修改默认密码！

---

## 📁 项目结构

```
picnest/
├── backend/                 # FastAPI 后端
│   ├── main.py             # 应用入口
│   ├── config.py           # 配置管理
│   ├── database.py         # SQLite 数据库
│   ├── schemas.py          # Pydantic 模型
│   ├── routers/            # API 路由
│   ├── services/           # 业务逻辑
│   └── utils/              # 工具函数
├── frontend/               # React 前端
│   ├── src/
│   │   ├── api/            # API 客户端
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 页面
│   │   ├── stores/         # 状态管理
│   │   └── hooks/          # 自定义 Hooks
│   └── ...
├── data/                   # 数据持久化
│   ├── images/             # 图片存储
│   └── picnest.db          # SQLite 数据库
├── config.yaml             # 应用配置
├── docker-compose.yml      # Docker 编排
├── nginx.conf              # Nginx 配置
└── Dockerfile.*            # Docker 镜像
```

---

## ⚙️ 配置说明

主要配置项在 `config.yaml` 中：

```yaml
app:
  name: "PicNest"
  debug: false
  secret_key: "your-secret-key"
  base_url: "http://localhost:8080"

storage:
  max_file_size: 52428800  # 50MB
  allowed_extensions:
    - ".jpg"
    - ".png"
    - ...

thumbnail:
  enabled: true
  sizes:
    small: 150
    medium: 300
    large: 600

watermark:
  enabled: false
  text: "PicNest"
  position: "bottom-right"
  opacity: 0.5
```

---

## 🛠️ 开发

### 本地开发

**后端：**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**前端：**
```bash
cd frontend
npm install
npm run dev
```

### 构建镜像

```bash
# 仅后端
docker build -f Dockerfile.backend -t picnest-backend .

# 仅前端
docker build -f Dockerfile.frontend -t picnest-frontend .

# 全部
docker-compose build
```

---

## 📚 API 文档

启动服务后访问：

- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

### 主要接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/auth/login` | 登录 |
| POST | `/api/v1/auth/register` | 注册 |
| GET | `/api/v1/images` | 获取图片列表 |
| POST | `/api/v1/images/upload` | 上传图片 |
| DELETE | `/api/v1/images/{id}` | 删除图片 |
| GET | `/api/v1/folders` | 获取文件夹 |
| GET | `/api/v1/stats/overview` | 统计概览 |

---

## 🐳 Docker 部署

### 常用命令

```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 查看日志
docker-compose logs -f

# 重启
docker-compose restart

# 重建
docker-compose up -d --build
```

### 数据迁移

```bash
# 备份数据库
cp data/picnest.db data/picnest.db.bak

# 备份图片
tar -czf data/images.tar.gz data/images/
```

---

## 🧩 扩展

### 定时清理回收站

添加 cron 任务：

```bash
curl -X POST http://localhost:8080/api/v1/trash/auto-cleanup
```

### Nginx SSL 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # ... 其他配置同 HTTP
}
```

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE)

---

<div align="center">

**Made with ❤️ by PicNest Team**

</div>