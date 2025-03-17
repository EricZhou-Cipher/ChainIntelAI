"use client";

export default function StatusBadge({ status }) {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processed":
        return "bg-green-100 text-green-800";
      case "ignored":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "待处理";
      case "processed":
        return "已处理";
      case "ignored":
        return "已忽略";
      default:
        return "未知";
    }
  };

  return (
    <span
      className={`${getStatusBadgeClass(status)} text-xs font-medium px-2.5 py-0.5 rounded-full`}
    >
      {getStatusText(status)}
    </span>
  );
} 