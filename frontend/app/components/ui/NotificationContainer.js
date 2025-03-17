'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../contexts/AppContext';
import Notification from './Notification';

/**
 * 通知容器组件，用于显示多个通知
 * @returns {JSX.Element|null} 通知容器组件
 */
export default function NotificationContainer() {
  const { notifications, removeNotification } = useApp();

  // 处理通知关闭
  const handleClose = (id) => {
    removeNotification(id);
  };

  // 如果没有通知，则不渲染
  if (!notifications || notifications.length === 0) {
    return null;
  }

  // 使用 createPortal 将通知渲染到 body 的末尾
  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-4">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={handleClose}
        />
      ))}
    </div>,
    document.body
  );
} 