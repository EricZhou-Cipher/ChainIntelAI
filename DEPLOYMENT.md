# ChainIntelAI 部署指南

本文档详细说明了如何在服务器上部署 ChainIntelAI 系统。

## 目录

1. [系统要求](#系统要求)
2. [本地部署](#本地部署)
3. [Docker 部署](#docker-部署)
4. [服务器部署](#服务器部署)
5. [CI/CD 配置](#cicd-配置)
6. [监控配置](#监控配置)
7. [故障排除](#故障排除)

## 系统要求

### 硬件要求

- **CPU**: 至少 4 核
- **内存**: 至少 8GB RAM
- **存储**: 至少 50GB 可用空间
- **网络**: 稳定的互联网连接

### 软件要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / macOS 12+
- **Node.js**: v16+
- **MongoDB**: v4.4+
- **Redis**: v6+
- **Docker**: v20+ (如果使用 Docker 部署)
- **Docker Compose**: v2+ (如果使用 Docker 部署)

## 本地部署

### 1. 克隆仓库

```bash
git clone https://github.com/EricZhou-Cipher/ChainIntelAI.git
cd ChainIntelAI
```

### 2. 安装依赖

```bash
# 安装后端依赖
yarn install

# 安装前端依赖
cd frontend
yarn install
cd ..
```

### 3. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，填入必要的配置
nano .env
```

### 4. 启动服务

```bash
# 启动后端服务
yarn start

# 在另一个终端启动前端服务
cd frontend
yarn dev
```

### 5. 运行测试

```bash
# 运行所有测试
yarn test

# 查看测试覆盖率
yarn test:coverage
```

## Docker 部署

### 1. 克隆仓库

```bash
git clone https://github.com/EricZhou-Cipher/ChainIntelAI.git
cd ChainIntelAI
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，填入必要的配置
nano .env
```

### 3. 使用 Docker Compose 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

### 4. 停止服务

```bash
docker-compose down
```

## 服务器部署

### 1. 准备服务器

- 安装 Docker 和 Docker Compose
- 配置防火墙，开放必要的端口（80, 443, 3000, 27017, 6379）
- 设置 SSL 证书（如果需要 HTTPS）

### 2. 克隆仓库并配置

```bash
git clone https://github.com/EricZhou-Cipher/ChainIntelAI.git
cd ChainIntelAI
cp .env.example .env
nano .env  # 编辑环境变量
```

### 3. 使用 Docker Compose 部署

```bash
docker-compose up -d
```

### 4. 配置 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. 配置 SSL（可选）

使用 Certbot 配置 SSL：

```bash
certbot --nginx -d your-domain.com
```

## CI/CD 配置

ChainIntelAI 使用 GitHub Actions 进行 CI/CD。配置文件位于 `.github/workflows/ci.yml`。

### 1. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

- `DOCKER_USERNAME`: Docker Hub 用户名
- `DOCKER_PASSWORD`: Docker Hub 密码
- `SSH_PRIVATE_KEY`: 服务器 SSH 私钥
- `SSH_HOST`: 服务器 IP 地址
- `SSH_USER`: 服务器用户名

### 2. 自动部署流程

1. 推送代码到 `main` 分支
2. GitHub Actions 自动运行测试
3. 如果测试通过，构建 Docker 镜像
4. 推送 Docker 镜像到 Docker Hub
5. 通过 SSH 连接到服务器
6. 拉取最新的 Docker 镜像
7. 重启服务

## 监控配置

### 1. Prometheus 配置

ChainIntelAI 内置了 Prometheus 指标收集功能，可以通过 `http://your-server:9090/metrics` 访问。

配置 Prometheus 服务器：

```yaml
# prometheus.yml
scrape_configs:
  - job_name: "chainintelai"
    scrape_interval: 15s
    static_configs:
      - targets: ["your-server:9090"]
```

### 2. Grafana 配置

1. 安装 Grafana
2. 添加 Prometheus 数据源
3. 导入 ChainIntelAI 仪表盘（位于 `docs/grafana/dashboard.json`）

## 故障排除

### 常见问题

1. **服务无法启动**

   - 检查环境变量配置
   - 检查 MongoDB 和 Redis 连接
   - 查看日志文件

2. **测试失败**

   - 确保所有依赖都已安装
   - 检查测试环境变量
   - 查看测试日志

3. **Docker 部署问题**
   - 检查 Docker 和 Docker Compose 版本
   - 确保端口没有被占用
   - 查看 Docker 日志

### 日志位置

- **后端日志**: `logs/combined.log` 和 `logs/error.log`
- **Docker 日志**: 使用 `docker-compose logs -f` 查看

### 联系支持

如果您遇到无法解决的问题，请通过以下方式联系我们：

- GitHub Issues: [https://github.com/EricZhou-Cipher/ChainIntelAI/issues](https://github.com/EricZhou-Cipher/ChainIntelAI/issues)
- 电子邮件: [your-email@example.com](mailto:your-email@example.com)
