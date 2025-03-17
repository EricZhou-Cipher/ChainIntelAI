import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 创建Express应用
const app = express();

// CORS 配置
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// 中间件
// @ts-ignore - 忽略类型错误，这些中间件在运行时是兼容的
app.use(cors(corsOptions));
// @ts-ignore - 忽略类型错误，这些中间件在运行时是兼容的
app.use(helmet());
// @ts-ignore - 忽略类型错误，这些中间件在运行时是兼容的
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 连接到MongoDB
const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chainintelai';
    await mongoose.connect(mongoURI);
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 连接到Redis
const connectRedis = async () => {
  try {
    const redisURL = process.env.REDIS_URL || 'redis://localhost:6379';
    const redis = new Redis(redisURL);
    
    redis.on('connect', () => {
      console.log('Redis 连接成功');
    });
    
    redis.on('error', (err) => {
      console.error('Redis 连接失败:', err);
    });
    
    return redis;
  } catch (error) {
    console.error('Redis 连接初始化失败:', error);
    process.exit(1);
  }
};

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: 'ChainIntelAI 后端服务运行正常' });
});

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 数据库状态检查
app.get('/api/status', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // 检查 Redis 连接
    let redisStatus = 'unknown';
    try {
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      await redis.ping();
      redisStatus = 'connected';
      await redis.quit();
    } catch (error) {
      redisStatus = 'disconnected';
    }
    
    res.status(200).json({
      mongodb: mongoStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: '状态检查失败', 
      message: error.message || '未知错误' 
    });
  }
});

// 启动服务器
const startServer = async () => {
  await connectMongoDB();
  const redis = await connectRedis();
  
  const PORT = process.env.PORT || 3001;
  const server = createServer(app);
  
  server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`健康检查端点: http://localhost:${PORT}/health`);
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  });
  
  // 优雅关闭
  const gracefulShutdown = async () => {
    console.log('正在关闭服务器...');
    server.close(async () => {
      console.log('HTTP服务器已关闭');
      // Mongoose 5.x 版本后 close() 方法不再接受回调
      try {
        await mongoose.connection.close();
        console.log('MongoDB连接已关闭');
        redis.quit();
        console.log('Redis连接已关闭');
        process.exit(0);
      } catch (err) {
        console.error('关闭MongoDB连接时出错:', err);
        process.exit(1);
      }
    });
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

startServer().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
}); 