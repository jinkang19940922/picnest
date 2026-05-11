# Changelog - v1.1.1 (2026-05-11 13:12)

## 🐛 Bug Fixes

- 无

## ✨ Features & Improvements

- config.yaml 格式规范化（去除多余引号、空格整理、注释清理）

## 📦 Files Changed

- config.yaml（格式规范化）

---

# Changelog - v1.1.0 (2026-05-09)

## 🐛 Bug Fixes

### 前端 (Frontend)

- **预览弹窗双击无法重置缩放至100%**
  - 根因：`handleDoubleClick` 在 `handleWheel` 的 `setScale` 批量更新之后才执行，导致闭包捕获的 scale 值仍为旧值
  - 修复：引入 `scaleRef` 替代 `setState` 回调读取当前值，确保 `handleWheel` 和 `handleDoubleClick` 读写同一个最新值

- **预览弹窗滚轮操作穿透导致背景画廊滚动**
  - 根因：framer-motion 的 `motion.div` 透传 React 合成事件树，滚轮事件在冒泡阶段被父组件消费；触控板手势还会冒泡至 `window` 触发 OS 级滚动
  - 修复：
    - `<main>` 设置 `style={{ overflowY: isPreviewOpen ? 'hidden' : undefined }}` 禁止自身滚动
    - `document.body` 设置 `overflow: hidden` 配合 `overscrollBehavior: none` 阻止触控板手势穿透
    - 外层 `motion.div`（backdrop）添加 `onMouseDown` + `onWheel` 的 `stopPropagation`
    - `handleWheel` 中同时调用 `e.stopPropagation()` + `e.preventDefault()`，并在所有子元素添加 `onMouseDown stopPropagation` 防止冒泡
    - 预览开关状态通过 Zustand `uiStore.isPreviewOpen` 全局同步

- **Auth 状态重hydrate时序竞争**
  - 根因：`useState(() => { fetchUser() })` 懒初始化函数仅执行一次，`localStorage` 恢复前 token 已检查
  - 修复：`ProtectedRoute` 中使用 `setInterval` 轮询 `zustand._hasHydrated`，确认状态恢复后再渲染子路由

- **回收站缩略图不显示**
  - 根因：后端 Trash API 返回 snake_case（`thumbnail_small`），前端 `ImageItem` 类型期望 camelCase（`thumbnails.small`）
  - 修复：创建 `TrashItem` 接口匹配后端返回字段

- **设置页存储配额硬编码**
  - 根因：配额显示写死为 `"5 GB"`
  - 修复：使用 `formatFileSize(auth.storage_quota)` 动态显示真实配额

- **图片卡片删除按钮 TODO**
  - 实现：完整链路 `ImageCard → MasonryGrid → Gallery → imageStore.deleteImage`

- **预览弹窗删除后未关闭**
  - 修复：`onClose` 和 `onDelete` 均触发 `setPreview(null)` 和 `setPreviewOpen(false)`

- **设置页账户信息保存未连接API**
  - 修复：添加"保存账户信息"按钮调用 `authApi.updateMe({ username, email })`

- **统计数据存储百分比错误**
  - 修复：`Promise.all` 并行获取 `stats/overview` + `stats/storage` + `auth/me`，进度条使用 `storage.used_percent`

- **回收站 `empty_trash` 接口500错误**
  - 根因：`sqlite3.Row` 对象无 `.get()` 方法
  - 修复：`[dict(img) for img in images_raw]` 转为字典后操作

### 后端 (Backend)

- `empty_trash` 与 `auto_cleanup` 接口：`sqlite3.Row` → `dict` 转换修复

## ✨ Features & Improvements

### 前端

- **粘贴上传**：全局监听 `paste` 事件，自动检测剪贴板图片并触发上传
- **侧边栏折叠/展开**：`uiStore.sidebarCollapsed` 状态持久化，展开时显示折叠按钮，折叠后左侧显示浮动展开按钮
- **瀑布流骨架屏随机高度**：10 种预设高度循环，视觉效果更自然
- **图片卡片悬浮 Redesign**：缩放 + 阴影提升、底部信息叠加层（文件名/尺寸）、选中发光边框、`onError` 占位图
- **链接复制弹窗**：修复背景透明度（`rgba(0,0,0,0.65)` + `backdrop-filter: blur`）
- **操作按钮 Tooltip**：为所有 action button 添加 `title` 属性，移除卡片上冗余的链接图标
- **无限滚动修复**：滚动监听从外层容器迁移至 `IntersectionObserver` + `sentinelRef`，`rootMargin: 300px` 提前触发
- **预览信息栏格式**：缩放百分比显示（实时更新）

## 📦 Files Changed

```
frontend/src/App.tsx                         # Auth重hydration + 预览状态同步
frontend/src/components/Gallery/ImageCard.tsx    # 悬浮UI + tooltip + 删除
frontend/src/components/Gallery/MasonryGrid.tsx # 骨架屏 + 无限滚动
frontend/src/components/Layout/Layout.tsx       # overflow控制
frontend/src/components/Layout/Sidebar.tsx       # 折叠/展开功能
frontend/src/components/Preview/ImagePreview.tsx # 滚轮/缩放/双击重置 + 事件穿透修复
frontend/src/components/Preview/PreviewContext.tsx # (未使用，预留)
frontend/src/components/Upload/DropZone.tsx      # paste上传
frontend/src/pages/Gallery.tsx                   # setPreviewOpen 同步
frontend/src/pages/Settings.tsx                  # 配额显示 + 账户信息保存
frontend/src/pages/Stats.tsx                     # 存储百分比修正
frontend/src/pages/Trash.tsx                    # TrashItem类型
frontend/src/stores/uiStore.ts                  # sidebarCollapsed + isPreviewOpen
backend/routers/trash.py                       # sqlite3.Row → dict
```

---

## Previous Release

- v1.0.0: 初始 PicNest v1.0.0 - 个人图床系统