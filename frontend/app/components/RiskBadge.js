"use client";

export default function RiskBadge({ level }) {
  const getRiskBadgeClass = (level) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskLevelText = (level) => {
    switch (level) {
      case "high":
        return "高风险";
      case "medium":
        return "中风险";
      case "low":
        return "低风险";
      default:
        return "未知";
    }
  };

  return (
    <span
      className={`${getRiskBadgeClass(level)} text-xs font-medium px-2.5 py-0.5 rounded-full`}
    >
      {getRiskLevelText(level)}
    </span>
  );
} 