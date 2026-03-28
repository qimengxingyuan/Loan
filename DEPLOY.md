# 部署指南

## Docker 部署

### 使用 Docker Compose（推荐）

1. 创建数据目录：
```bash
mkdir -p data
```

2. 启动服务：
```bash
docker-compose up -d
```

3. 查看日志：
```bash
docker-compose logs -f
```

4. 停止服务：
```bash
docker-compose down
```

### 使用 Docker 命令

```bash
# 拉取镜像
docker pull ghcr.io/qimengxingyuan/loan:latest

# 运行容器
docker run -d \
  --name loan-calculator \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_PATH=/app/data/loan.db \
  -e STATIC_PATH=/app/public \
  --restart unless-stopped \
  ghcr.io/qimengxingyuan/loan:latest
```

## GitHub Actions 自动构建

项目已配置 GitHub Actions 工作流，会自动构建并推送 Docker 镜像到 GitHub Container Registry。

### 触发条件

- 推送到 `main` 或 `master` 分支
- 推送标签 `v*`（如 v1.0.0）
- 提交 Pull Request 到 `main` 或 `master` 分支

### 镜像标签

- `latest` - 最新版本
- `main` / `master` - 分支版本
- `v1.0.0` - 语义化版本标签
- `sha-xxx` - 提交哈希

### 拉取私有镜像

GitHub Container Registry 的镜像默认是私有的，需要登录：

```bash
# 使用 GitHub Token 登录
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 拉取镜像
docker pull ghcr.io/qimengxingyuan/loan:latest
```

### 设置镜像为公开

1. 进入 GitHub 仓库页面
2. 点击 "Packages" 标签
3. 找到 `loan` 镜像包
4. 点击 "Package settings"
5. 在 "Danger Zone" 中将可见性改为 "Public"

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 服务端口 |
| `DB_PATH` | `/app/data/loan.db` | 数据库文件路径 |
| `STATIC_PATH` | `/app/public` | 静态文件路径 |

## 数据持久化

数据库文件挂载到 `./data` 目录，请确保该目录有写入权限。

## 健康检查

容器配置了健康检查，可以通过以下命令查看：

```bash
docker ps
```

或

```bash
curl http://localhost:3000/api/health
```
