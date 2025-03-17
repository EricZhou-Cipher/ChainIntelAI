import React from 'react';
import { motion } from 'framer-motion';
import { useLazyImage } from '../hooks/useIntersectionObserver';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderColor?: string;
}

/**
 * 懒加载图片组件
 * 只有当图片进入视口时才会加载
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderColor = '#f3f4f6'
}) => {
  // 使用自定义Hook实现懒加载
  const [ref, imageSrc, isLoaded] = useLazyImage(src);

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height, backgroundColor: placeholderColor }}
    >
      {/* 占位符 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 图片 */}
      <motion.img
        ref={ref}
        src={imageSrc || ''}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};

// 使用React.memo优化渲染性能
export default React.memo(LazyImage); 