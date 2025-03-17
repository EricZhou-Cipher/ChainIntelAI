import mongoose from 'mongoose';
import { databaseConfig } from './config/database.config';
import { createLogger } from '../utils/logger';

const logger = createLogger({
  level: 'info',
  format: 'json',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss',
});

export async function connectMongoDB(): Promise<void> {
  try {
    const { uri, options } = databaseConfig.mongodb;
    await mongoose.connect(uri, options);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error', { error });
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('MongoDB disconnection error', { error });
    throw error;
  }
}

// 监听连接事件
mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error', { error });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});
