// 使用内存存储来模拟数据库
const events = new Map();

export async function saveTransferEvent(event) {
  events.set(event.txHash, event);
  console.log("保存事件:", event);
  return event;
}

export async function getTransferEvent(txHash) {
  return events.get(txHash);
}

export async function getAllEvents() {
  return Array.from(events.values());
}
