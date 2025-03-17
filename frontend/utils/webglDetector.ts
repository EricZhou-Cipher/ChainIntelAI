/**
 * WebGL 检测工具
 * 用于检测浏览器是否支持 WebGL 渲染
 */

/**
 * 检查浏览器是否支持 WebGL
 * @returns {boolean} 如果支持 WebGL 返回 true，否则返回 false
 */
export function isWebGLSupported(): boolean {
  try {
    // 创建临时 canvas 元素
    const canvas = document.createElement('canvas');
    // 尝试获取 WebGL 上下文
    const gl = 
      canvas.getContext('webgl') || 
      canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    // 如果成功获取到 WebGL 上下文，并且上下文是有效的
    return !!(gl && gl instanceof WebGLRenderingContext);
  } catch (e) {
    console.error('WebGL 检测失败:', e);
    return false;
  }
}

/**
 * 检查 WebGL 支持的最大纹理大小
 * 这对于确定设备能够处理的最大数据量很有用
 * @returns {number} 最大纹理大小
 */
export function getMaxTextureSize(): number {
  try {
    const canvas = document.createElement('canvas');
    const gl = 
      canvas.getContext('webgl') || 
      canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    if (!gl) return 0;
    
    const size = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    return size || 0; // 如果size为null或undefined，返回0
  } catch (e) {
    console.error('获取最大纹理大小失败:', e);
    return 0;
  }
}

/**
 * 检查设备的性能级别
 * 根据设备能力返回建议的渲染质量级别
 * @returns {'high' | 'medium' | 'low'} 建议的渲染质量级别
 */
export function getDevicePerformanceLevel(): 'high' | 'medium' | 'low' {
  // 检查是否支持 WebGL
  if (!isWebGLSupported()) {
    return 'low';
  }
  
  // 检查最大纹理大小
  const maxTextureSize = getMaxTextureSize();
  
  // 检查是否有硬件加速
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true });
  
  // 如果没有硬件加速，或者最大纹理大小较小，则返回低性能级别
  if (!gl || maxTextureSize < 4096) {
    return 'low';
  }
  
  // 如果纹理大小大于等于16384，返回高性能级别
  if (maxTextureSize >= 16384) {
    return 'high';
  }
  
  // 检查是否是移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // 如果是移动设备，返回中等性能级别
  if (isMobile) {
    return 'medium';
  }
  
  // 如果纹理大小大于等于8192，返回高性能级别
  if (maxTextureSize >= 8192) {
    return 'high';
  }
  
  // 其他情况返回中等性能级别
  return 'medium';
}

/**
 * WebGL 功能对象
 * 包含有关设备 WebGL 能力的信息
 */
export interface WebGLCapabilities {
  supported: boolean;
  hardwareAccelerated: boolean;
  maxTextureSize: number;
  performanceLevel: 'high' | 'medium' | 'low';
  renderer: string;
  vendor: string;
}

/**
 * 获取完整的 WebGL 功能信息
 * @returns {WebGLCapabilities} WebGL 功能对象
 */
export function getWebGLCapabilities(): WebGLCapabilities {
  const supported = isWebGLSupported();
  let hardwareAccelerated = false;
  let maxTextureSize = 0;
  let renderer = '';
  let vendor = '';
  
  if (supported) {
    try {
      const canvas = document.createElement('canvas');
      
      // 检查硬件加速
      const gl1 = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true });
      hardwareAccelerated = !!gl1;
      
      // 获取 WebGL 上下文
      const gl = 
        canvas.getContext('webgl') || 
        canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      
      if (gl) {
        // 获取最大纹理大小
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        
        // 获取渲染器信息
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        }
      }
    } catch (e) {
      console.error('获取 WebGL 功能信息失败:', e);
    }
  }
  
  return {
    supported,
    hardwareAccelerated,
    maxTextureSize,
    performanceLevel: getDevicePerformanceLevel(),
    renderer,
    vendor
  };
}

export default {
  isWebGLSupported,
  getMaxTextureSize,
  getDevicePerformanceLevel,
  getWebGLCapabilities
}; 