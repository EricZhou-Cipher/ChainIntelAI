import React from 'react';
import './globals.css';

export const metadata = {
  title: 'ChainIntelAI - 区块链智能分析平台',
  description: '实时监控和分析区块链活动，识别潜在风险',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        {children}
      </body>
    </html>
  );
} 