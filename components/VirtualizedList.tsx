import React, { useState, useRef, useEffect, useCallback } from 'react';
import { throttle } from '../utils/performance';

// 列表项类型
interface ListItem {
  id: string | number;
  content: string;
}

// 虚拟列表属性类型
interface VirtualizedListProps {
  items: ListItem[];
  itemHeight: number;
  windowHeight: number;
  overscan?: number;
  renderItem: (item: ListItem, index: number) => React.ReactNode;
  className?: string;
}

/**
 * 虚拟化列表组件
 * 只渲染可视区域内的列表项，大幅提高长列表的性能
 */
const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items,
  itemHeight,
  windowHeight,
  overscan = 3,
  renderItem,
  className = ''
}) => {
  // 滚动容器引用
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 滚动位置状态
  const [scrollTop, setScrollTop] = useState(0);
  
  // 计算可视区域内的起始和结束索引
  const visibleItemsCount = Math.ceil(windowHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor(scrollTop / itemHeight) + visibleItemsCount + overscan
  );
  
  // 计算可视区域内的列表项
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  // 计算总内容高度
  const totalHeight = items.length * itemHeight;
  
  // 使用节流优化滚动事件处理
  const handleScroll = useCallback(
    throttle(() => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    }, 16), // 约60fps
    []
  );
  
  // 添加滚动事件监听
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);
  
  return (
    <div
      ref={containerRef}
      className={`overflow-auto relative ${className}`}
      style={{ height: windowHeight }}
    >
      {/* 创建一个占位容器，确保滚动条高度正确 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 渲染可视区域内的列表项 */}
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: actualIndex * itemHeight,
                height: itemHeight,
                left: 0,
                right: 0
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 使用示例组件
export const VirtualizedListExample: React.FC = () => {
  // 生成大量测试数据
  const generateItems = (count: number): ListItem[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      content: `列表项 ${i + 1} - ${Math.random().toString(36).substring(2, 8)}`
    }));
  };
  
  // 生成10000个列表项
  const items = generateItems(10000);
  
  // 渲染单个列表项
  const renderListItem = (item: ListItem, index: number) => (
    <div
      className={`p-4 border-b ${
        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
      } hover:bg-blue-50 transition-colors`}
    >
      <div className="font-medium">{item.content}</div>
      <div className="text-sm text-gray-500">ID: {item.id}</div>
    </div>
  );
  
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">虚拟化列表示例 (10,000 项)</h2>
      <p className="mb-4 text-gray-600">
        此列表使用虚拟化技术，只渲染可视区域内的元素，即使有10,000个项目也能保持流畅。
      </p>
      
      <div className="border rounded-md shadow-sm">
        <VirtualizedList
          items={items}
          itemHeight={72} // 每个列表项的高度
          windowHeight={400} // 可视窗口的高度
          overscan={5} // 额外渲染的项目数量
          renderItem={renderListItem}
        />
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-md border">
        <h3 className="font-medium mb-2">性能优化说明:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
          <li>只渲染可视区域内的列表项，而不是全部10,000项</li>
          <li>使用绝对定位放置列表项，避免重排</li>
          <li>滚动事件使用节流函数优化，减少不必要的渲染</li>
          <li>使用overscan参数预渲染额外的项目，使滚动更平滑</li>
          <li>适用于展示大量数据的场景，如日志、交易记录等</li>
        </ul>
      </div>
    </div>
  );
};

export default VirtualizedList; 