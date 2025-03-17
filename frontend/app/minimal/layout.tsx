import React from 'react';
import Navigation from './navigation';

export const metadata = {
  title: '最小化测试',
  description: '最小化测试页面',
};

export default function MinimalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <div className="mb-4 p-2 bg-blue-100 rounded">
        <h1 className="text-lg font-bold">最小化布局</h1>
      </div>
      <Navigation />
      {children}
    </div>
  );
} 