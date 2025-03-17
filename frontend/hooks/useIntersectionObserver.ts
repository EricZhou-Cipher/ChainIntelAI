import { useState, useEffect, useRef, RefObject } from 'react';

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

/**
 * 自定义Hook，用于检测元素是否进入视口
 * 可用于实现懒加载、无限滚动等功能
 */
export function useIntersectionObserver<T extends Element>(
  options: IntersectionObserverOptions = {}
): [RefObject<T | null>, boolean] {
  const { 
    root = null, 
    rootMargin = '0px', 
    threshold = 0,
    triggerOnce = false 
  } = options;
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // 清理函数
    const cleanup = () => {
      if (observerRef.current && elementRef.current) {
        observerRef.current.unobserve(elementRef.current);
        observerRef.current.disconnect();
      }
    };

    // 如果已经触发过且设置了triggerOnce，则不再观察
    if (triggerOnce && isIntersecting) {
      cleanup();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
        
        // 如果设置了triggerOnce且元素已进入视口，则停止观察
        if (triggerOnce && entry.isIntersecting) {
          cleanup();
        }
      },
      { root, rootMargin, threshold }
    );

    observerRef.current = observer;

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return cleanup;
  }, [root, rootMargin, threshold, triggerOnce, isIntersecting]);

  return [elementRef, isIntersecting];
}

/**
 * 用于实现无限滚动的自定义Hook
 */
export function useInfiniteScroll(
  callback: () => void,
  options: IntersectionObserverOptions = {}
): RefObject<HTMLDivElement | null> {
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '200px', // 提前200px触发
    ...options,
  });

  useEffect(() => {
    if (isIntersecting) {
      callback();
    }
  }, [isIntersecting, callback]);

  return ref;
}

/**
 * 用于实现图片懒加载的自定义Hook
 */
export function useLazyImage(
  src: string,
  options: IntersectionObserverOptions = {}
): [RefObject<HTMLImageElement | null>, string, boolean] {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver<HTMLImageElement>({
    triggerOnce: true, // 只触发一次
    ...options,
  });

  useEffect(() => {
    if (isIntersecting) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
    }
  }, [isIntersecting, src]);

  return [ref, imageSrc, isLoaded];
} 