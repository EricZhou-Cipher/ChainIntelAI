// 定义节点类型
export interface NetworkNode {
  id: string;
  address: string;
  type: 'address' | 'transaction' | 'contract';
  value?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  label?: string;
  x?: number;
  y?: number;
  
  // 力导向布局所需的固定位置属性
  fx?: number | null;
  fy?: number | null;
  
  // 聚类相关属性
  isCluster?: boolean;
  clusterSize?: number;
  clusteredNodes?: NetworkNode[];
}

// 定义链接类型
export interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  value: number;
  txHash?: string;
  timestamp?: string;
}

// 定义基本组件属性类型
export interface BlockchainNetworkBaseProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  width?: number;
  height?: number;
  className?: string;
  onNodeClick?: (node: NetworkNode) => void;
  onLinkClick?: (link: NetworkLink) => void;
}

// 优化版组件的附加属性
export interface BlockchainNetworkOptimizedProps extends BlockchainNetworkBaseProps {
  // 性能相关选项
  enableCulling?: boolean;       // 启用视口裁剪
  enableClustering?: boolean;    // 启用节点聚合
  clusterDistance?: number;      // 聚合距离
  renderQuality?: 'high' | 'medium' | 'low';  // 渲染质量
}

// 视图状态类型
export interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

// 工具提示数据类型
export interface TooltipData {
  content: React.ReactNode;
  x: number;
  y: number;
  visible: boolean;
} 