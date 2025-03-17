import { connectMongoDB, disconnectMongoDB } from './mongodb';
import { redis } from './redis';

export * from './models/EventRecord';
export * from './models/AddressProfile';
export * from './models/RiskAnalysis';
export * from './dao/EventDAO';
export * from './dao/AddressProfileDAO';
export * from './dao/RiskAnalysisDAO';
export * from './redis';

export async function initializeDatabase(): Promise<void> {
  try {
    await connectMongoDB();
    // Redis 连接已经在 redis.ts 中初始化
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    await Promise.all([disconnectMongoDB(), redis.quit()]);
  } catch (error) {
    console.error('Database closure failed:', error);
    throw error;
  }
}
