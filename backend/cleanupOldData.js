import mongoose from "mongoose";
import logger from "./config/logger.js";
import { config } from "./config.js";

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    logger.info("✅ 数据库连接成功");
  } catch (error) {
    logger.error("❌ 数据库连接失败:", error);
    process.exit(1);
  }
}

// 清理旧数据
async function cleanupOldData() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 清理旧事件
    const eventResult = await mongoose.model("TransferEvent").deleteMany({
      timestamp: { $lt: thirtyDaysAgo },
    });

    // 清理旧状态记录
    const statusResult = await mongoose.model("EventStatus").deleteMany({
      updatedAt: { $lt: thirtyDaysAgo },
    });

    logger.info("数据清理完成", {
      deletedEvents: eventResult.deletedCount,
      deletedStatuses: statusResult.deletedCount,
      beforeDate: thirtyDaysAgo.toISOString(),
    });
  } catch (error) {
    logger.error("数据清理失败:", error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await connectDB();
    await cleanupOldData();
    process.exit(0);
  } catch (error) {
    logger.error("程序异常退出:", error);
    process.exit(1);
  }
}

// 启动程序
main().catch((error) => {
  logger.error("程序异常退出:", error);
  process.exit(1);
});
