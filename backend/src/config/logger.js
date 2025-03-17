import winston from "winston";
// 不导入 winston-daily-rotate-file，避免依赖问题

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  ],
});

export default logger;
