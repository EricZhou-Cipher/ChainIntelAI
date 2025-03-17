.PHONY: start stop clean logs ps

# 启动所有服务
start:
	docker-compose up -d

# 停止所有服务
stop:
	docker-compose down

# 清理所有数据（包括卷）
clean:
	docker-compose down -v
	rm -rf logs/*

# 查看日志
logs:
	docker-compose logs -f

# 查看服务状态
ps:
	docker-compose ps

# 重新构建服务
rebuild:
	docker-compose up -d --build

# 进入容器
shell:
	docker-compose exec replay /bin/bash

# 查看数据库
db-shell:
	docker-compose exec mongodb mongosh -u admin -p password 