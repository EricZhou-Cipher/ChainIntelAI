FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json yarn.lock ./
RUN yarn install

# 复制源代码
COPY . .

# 创建日志目录
RUN mkdir -p logs

# 构建应用
RUN yarn build

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3000
EXPOSE 9090

# 启动命令
CMD ["yarn", "start"] 