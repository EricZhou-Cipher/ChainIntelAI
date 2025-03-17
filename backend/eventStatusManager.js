import mongoose from "mongoose";

const eventStatusSchema = new mongoose.Schema({
  chainId: {
    type: Number,
    required: true,
    index: true,
  },
  txHash: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Success", "Failed", "Alerted"],
    default: "Pending",
  },
  source: {
    type: String,
    enum: ["replay", "realtime"],
    required: true,
  },
  lastError: String,
  retryCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 创建复合唯一索引
eventStatusSchema.index({ chainId: 1, txHash: 1 }, { unique: true });

class EventStatusManager {
  constructor() {
    this.model = mongoose.model("EventStatus", eventStatusSchema);
  }

  async findOne(query) {
    return this.model.findOne(query);
  }

  async save(eventStatus) {
    return eventStatus.save();
  }

  async updateStatus(chainId, txHash, status) {
    return this.model.updateOne(
      { chainId, txHash },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );
  }
}

export default new EventStatusManager();
