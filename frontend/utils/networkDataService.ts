/**
 * 网络数据服务
 * 封装使用 Web Worker 生成大规模网络数据的函数
 */
import { NetworkNode, NetworkLink } from '../components/BlockchainNetworkTypes';
import { isWebGLSupported } from './webglDetector';

/**
 * 创建并返回网络数据 Worker
 * @returns {Worker} 网络数据 Worker 实例
 */
function createNetworkDataWorker(): Worker | null {
  // 检查是否在浏览器环境
  if (typeof window === 'undefined' || !window.Worker) {
    console.error('Web Worker 不受支持');
    return null;
  }
  
  try {
    return new Worker('/workers/networkDataWorker.js');
  } catch (error) {
    console.error('创建 Web Worker 失败:', error);
    return null;
  }
}

/**
 * 生成大规模网络数据（使用 Web Worker）
 * @param {number} nodeCount - 要生成的节点数量
 * @param {number} width - 网络宽度
 * @param {number} height - 网络高度
 * @returns {Promise<{nodes: NetworkNode[], links: NetworkLink[]}>} 生成的网络数据
 */
export function generateLargeNetworkData(
  nodeCount: number, 
  width: number = 800, 
  height: number = 600
): Promise<{nodes: NetworkNode[], links: NetworkLink[]}> {
  return new Promise((resolve, reject) => {
    const worker = createNetworkDataWorker();
    
    if (!worker) {
      // 如果 Worker 创建失败，使用备用方法（同步生成）
      console.warn('Web Worker 不可用，使用同步方法生成数据');
      try {
        // 导入同步数据生成函数（需要在项目中实现）
        import('./blockchainDataService').then(module => {
          const data = module.generateInitialNetworkData(nodeCount);
          resolve(data);
        }).catch(err => {
          reject(new Error('加载备用数据生成模块失败: ' + err.message));
        });
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    // 监听 Worker 消息
    worker.onmessage = (e) => {
      const { action, data } = e.data;
      
      if (action === 'initialDataGenerated') {
        resolve(data);
        // 完成后终止 Worker
        worker.terminate();
      } else if (action === 'error') {
        reject(new Error(data.message));
        worker.terminate();
      }
    };
    
    // 监听 Worker 错误
    worker.onerror = (e) => {
      reject(new Error('Web Worker 错误: ' + e.message));
      worker.terminate();
    };
    
    // 发送生成数据请求
    worker.postMessage({
      action: 'generateInitialData',
      data: { nodeCount, width, height }
    });
  });
}

/**
 * 向现有网络添加新节点（使用 Web Worker）
 * @param {NetworkNode[]} nodes - 现有节点
 * @param {NetworkLink[]} links - 现有链接
 * @param {number} count - 要添加的节点数量
 * @param {number} width - 网络宽度
 * @param {number} height - 网络高度
 * @returns {Promise<{nodes: NetworkNode[], links: NetworkLink[]}>} 更新后的网络数据
 */
export function addNodesToNetwork(
  nodes: NetworkNode[],
  links: NetworkLink[],
  count: number,
  width: number = 800,
  height: number = 600
): Promise<{nodes: NetworkNode[], links: NetworkLink[]}> {
  return new Promise((resolve, reject) => {
    const worker = createNetworkDataWorker();
    
    if (!worker) {
      // 如果 Worker 创建失败，使用备用方法
      console.warn('Web Worker 不可用，使用同步方法添加节点');
      try {
        // 这里应该实现一个备用同步方法
        setTimeout(() => {
          // 简单的备用实现 - 仅返回原始数据
          resolve({ nodes, links });
        }, 100);
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    // 监听 Worker 消息
    worker.onmessage = (e) => {
      const { action, data } = e.data;
      
      if (action === 'nodesAdded') {
        resolve(data);
        worker.terminate();
      } else if (action === 'error') {
        reject(new Error(data.message));
        worker.terminate();
      }
    };
    
    // 监听 Worker 错误
    worker.onerror = (e) => {
      reject(new Error('Web Worker 错误: ' + e.message));
      worker.terminate();
    };
    
    // 发送添加节点请求
    worker.postMessage({
      action: 'addNewNodes',
      data: { nodes, links, count, width, height }
    });
  });
}

/**
 * 检测最佳可视化模式
 * 根据数据量和设备能力选择最佳可视化方法
 * @param {number} nodeCount - 节点数量
 * @returns {'webgl' | 'svg'} 最佳可视化模式
 */
export function detectBestVisualizationMode(nodeCount: number): 'webgl' | 'svg' {
  // 检查 WebGL 支持
  const webglSupported = isWebGLSupported();
  
  // 如果不支持 WebGL 或节点数量较小，使用 SVG
  if (!webglSupported || nodeCount < 50) {
    return 'svg';
  }
  
  // 检查设备性能（简化版）
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );
  
  // 移动设备上，只有在节点数量较多时才使用 WebGL
  if (isMobile && nodeCount < 100) {
    return 'svg';
  }
  
  // 其他情况使用 WebGL
  return 'webgl';
}

/**
 * 估计网络可视化的性能要求
 * @param {number} nodeCount - 节点数量
 * @param {number} linkCount - 链接数量
 * @returns {'high' | 'medium' | 'low'} 性能要求级别
 */
export function estimatePerformanceRequirements(
  nodeCount: number, 
  linkCount: number
): 'high' | 'medium' | 'low' {
  const totalElements = nodeCount + linkCount;
  
  if (totalElements > 1000) {
    return 'high';
  } else if (totalElements > 300) {
    return 'medium';
  } else {
    return 'low';
  }
}

export default {
  generateLargeNetworkData,
  addNodesToNetwork,
  detectBestVisualizationMode,
  estimatePerformanceRequirements
}; 