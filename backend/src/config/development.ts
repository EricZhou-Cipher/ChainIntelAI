import { Config } from './default';

export const developmentConfig: Partial<Config> = {
  database: {
    host: 'localhost',
    port: 27017,
    username: '',
    password: '',
    database: 'chainintel_dev',
  },
  redis: {
    host: 'localhost',
    port: 6379,
    db: 1,
  },
  monitoring: {
    prometheus: {
      enabled: true,
      port: 9090,
    },
    logging: {
      level: 'debug',
      format: 'json',
    },
  },
};
