import { config } from '../../config';

export interface DatabaseConfig {
  mongodb: {
    uri: string;
    options: {
      useNewUrlParser: boolean;
      useUnifiedTopology: boolean;
      maxPoolSize: number;
      minPoolSize: number;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix: string;
  };
}

export const databaseConfig: DatabaseConfig = {
  mongodb: {
    uri: config.database
      ? `mongodb://${config.database.host}:${config.database.port}/${config.database.database}`
      : 'mongodb://localhost:27017/chainintel',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 5,
    },
  },
  redis: {
    host: config.redis?.host || 'localhost',
    port: config.redis?.port || 6379,
    password: config.redis?.password,
    db: config.redis?.db || 0,
    keyPrefix: 'chainintel:',
  },
};
