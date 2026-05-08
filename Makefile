.PHONY: all build up down restart logs clean help

all: build up

# 构建所有镜像
build:
	HTTP_PROXY=$(HTTP_PROXY) HTTPS_PROXY=$(HTTPS_PROXY) docker-compose build

# 启动服务
up:
	docker-compose up -d

# 停止服务
down:
	docker-compose down

# 重启服务
restart: down up

# 查看日志
logs:
	docker-compose logs -f

# 重建并启动
rebuild: down build up

# 清理（删除容器和镜像）
clean:
	docker-compose down -v --rmi local
	rm -rf data/images/* data/picnest.db

# 进入后端容器
backend-shell:
	docker exec -it picnest-backend /bin/bash

# 进入前端容器
frontend-shell:
	docker exec -it picnest-frontend /bin/sh

# 查看运行状态
status:
	docker-compose ps

# 备份数据
backup:
	cp -r data/picnest.db data/picnest.db.bak
	tar -czf data/images-backup-$$(date +%Y%m%d).tar.gz data/images/

# 恢复数据
restore:
	cp data/picnest.db.bak data/picnest.db
	tar -xzf data/images-backup-*.tar.gz -C /

help:
	@echo "PicNest Makefile Commands:"
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View logs (follow mode)"
	@echo "  make rebuild    - Rebuild and restart"
	@echo "  make clean      - Remove containers and local data"
	@echo "  make backup     - Backup database and images"
	@echo "  make status     - Show service status"
	@echo "  make help       - Show this help message"