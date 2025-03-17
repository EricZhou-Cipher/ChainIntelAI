"use client";

import React, { useState, useCallback } from 'react';

// 子组件属性类型
interface ChildProps {
  name: string;
  count: number;
  onClick: () => void;
}

// 使用React.memo优化的子组件
const MemoizedChild = React.memo(({ name, count, onClick }: ChildProps) => {
  console.log(`${name} 组件渲染`);
  
  return (
    <div className="p-4 border rounded-md mb-4 bg-white shadow-sm">
      <h3 className="text-lg font-medium text-gray-800">{name}</h3>
      <p className="text-gray-600 my-2">计数: {count}</p>
      <button
        onClick={onClick}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        增加计数
      </button>
    </div>
  );
});

// 为组件添加displayName，便于调试
MemoizedChild.displayName = 'MemoizedChild';

// 主组件
const MemoizedComponent: React.FC = () => {
  // 状态
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  
  // 使用useCallback优化事件处理函数，避免不必要的重新渲染
  const handleClick1 = useCallback(() => {
    setCount1(prev => prev + 1);
  }, []);
  
  const handleClick2 = useCallback(() => {
    setCount2(prev => prev + 1);
  }, []);
  
  console.log('父组件渲染');
  
  return (
    <div className="p-6 max-w-md mx-auto bg-gray-50 rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">React.memo 优化示例</h2>
      <p className="text-gray-600 mb-4">
        只有当组件的props发生变化时，被React.memo包裹的组件才会重新渲染。
        点击按钮时，只有相关的子组件会重新渲染，而不是所有子组件。
      </p>
      
      <div className="space-y-4">
        <MemoizedChild 
          name="组件 A" 
          count={count1} 
          onClick={handleClick1} 
        />
        
        <MemoizedChild 
          name="组件 B" 
          count={count2} 
          onClick={handleClick2} 
        />
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-2">性能优化说明:</h3>
        <ul className="list-disc pl-5 text-gray-600 space-y-1">
          <li>使用 React.memo 包裹子组件，避免不必要的重新渲染</li>
          <li>使用 useCallback 包裹事件处理函数，确保函数引用稳定</li>
          <li>当点击"组件A"的按钮时，只有"组件A"会重新渲染</li>
          <li>当点击"组件B"的按钮时，只有"组件B"会重新渲染</li>
          <li>父组件的状态更新不会导致无关子组件的重新渲染</li>
        </ul>
      </div>
    </div>
  );
};

export default MemoizedComponent; 