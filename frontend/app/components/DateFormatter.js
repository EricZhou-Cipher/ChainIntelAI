"use client";

export default function DateFormatter({ timestamp, locale = "zh-CN" }) {
  if (!timestamp) return null;
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString(locale);
  };

  return (
    <span>
      {formatDate(timestamp)}
    </span>
  );
} 