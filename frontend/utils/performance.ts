/**
 * 性能优化相关工具函数
 */

/**
 * 深度比较两个对象是否相等，用于React.memo的比较函数
 */
export function arePropsEqual(prevProps: any, nextProps: any): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  // 如果属性数量不同，则不相等
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  
  // 比较每个属性
  return prevKeys.every(key => {
    // 如果是函数，则认为它们相等（因为函数引用可能会变化，但功能相同）
    if (typeof prevProps[key] === 'function' && typeof nextProps[key] === 'function') {
      return true;
    }
    
    // 对于对象和数组，进行浅比较
    if (typeof prevProps[key] === 'object' && prevProps[key] !== null) {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    
    // 基本类型直接比较
    return prevProps[key] === nextProps[key];
  });
}

/**
 * 性能优化工具函数
 * 包含防抖、节流等常用的性能优化函数
 */

/**
 * 防抖函数 - 延迟执行函数，如果在延迟时间内再次调用则重新计时
 * 适用场景：输入搜索、窗口调整大小、表单验证等
 * 
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timer) {
      clearTimeout(timer);
    }
    
    timer = setTimeout(() => {
      fn.apply(context, args);
      timer = null;
    }, delay);
  };
}

/**
 * 节流函数 - 限制函数在一定时间内只能执行一次
 * 适用场景：滚动事件处理、频繁点击按钮、拖拽事件等
 * 
 * @param fn 需要节流的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (!inThrottle) {
      fn.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          fn.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * 缓存函数结果 - 记忆化函数，缓存计算结果避免重复计算
 * 适用场景：复杂计算、递归函数等
 * 
 * @param fn 需要缓存结果的函数
 * @returns 带缓存功能的函数
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map();
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    return result;
  };
}

/**
 * 批量处理函数 - 将多次操作合并为一次执行
 * 适用场景：批量DOM更新、合并多次API调用等
 * 
 * @param fn 需要批量处理的函数
 * @param delay 延迟时间（毫秒）
 * @returns 批量处理后的函数
 */
export function batch<T extends (...args: any[]) => any>(
  fn: (items: Parameters<T>[]) => void,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const items: Parameters<T>[] = [];
  
  return function(this: any, ...args: Parameters<T>) {
    items.push(args);
    
    if (!timer) {
      timer = setTimeout(() => {
        fn.call(this, items.slice());
        items.length = 0;
        timer = null;
      }, delay);
    }
  };
}

/**
 * RAF节流 - 使用requestAnimationFrame进行节流
 * 适用场景：动画、滚动事件等
 * 
 * @param fn 需要节流的函数
 * @returns 使用RAF节流后的函数
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  let ticking = false;
  let lastArgs: Parameters<T>;
  
  return function(this: any, ...args: Parameters<T>) {
    lastArgs = args;
    const context = this;
    
    if (!ticking) {
      requestAnimationFrame(() => {
        fn.apply(context, lastArgs);
        ticking = false;
      });
      
      ticking = true;
    }
  };
}

/**
 * 延迟加载函数 - 延迟执行函数直到空闲时间
 * 适用场景：非关键任务、数据预加载等
 * 
 * @param fn 需要延迟执行的函数
 * @returns Promise，解析为函数执行结果
 */
export function idleLoad<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise(resolve => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          const result = fn.apply(this, args);
          resolve(result);
        });
      } else {
        setTimeout(() => {
          const result = fn.apply(this, args);
          resolve(result);
        }, 1);
      }
    });
  };
} 