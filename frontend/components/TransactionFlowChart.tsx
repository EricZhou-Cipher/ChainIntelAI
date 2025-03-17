import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ResponsiveContainer, 
  Tooltip, 
  Sankey, 
  Scatter,
  ScatterChart,
  ZAxis,
  Rectangle
} from 'recharts';
import { asJsxComponent } from '../utils/chartUtils';

// 定义节点类型
export interface Node {
  name: string;
  value?: number;
  address?: string;
  category?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

// 定义链接类型
export interface Link {
  source: number;
  target: number;
  value: number;
  timestamp?: string;
  txHash?: string;
}

// 定义组件属性类型
interface TransactionFlowChartProps {
  nodes: Node[];
  links: Link[];
  className?: string;
  onNodeClick?: (node: Node) => void;
  onLinkClick?: (link: Link) => void;
}

// 使用类型断言修复组件类型
const SafeResponsiveContainer = asJsxComponent(ResponsiveContainer);
const SafeTooltip = asJsxComponent(Tooltip);
const SafeSankey = asJsxComponent(Sankey);
const SafeScatter = asJsxComponent(Scatter);
const SafeScatterChart = asJsxComponent(ScatterChart);
const SafeZAxis = asJsxComponent(ZAxis);
const SafeRectangle = asJsxComponent(Rectangle);

/**
 * 交易流向图组件 - 使用 d3-sankey 实现交互式流向图
 */
const TransactionFlowChart: React.FC<TransactionFlowChartProps> = ({ 
  nodes, 
  links, 
  className = '',
  onNodeClick,
  onLinkClick
}) => {
  const { t } = useTranslation();
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [activeLink, setActiveLink] = useState<number | null>(null);
  
  // 获取节点颜色
  const getNodeColor = useCallback((node: Node) => {
    // 根据风险等级或类别设置不同颜色
    if (node.riskLevel) {
      switch (node.riskLevel) {
        case 'low': return '#10b981';
        case 'medium': return '#f59e0b';
        case 'high': return '#ef4444';
        case 'critical': return '#7f1d1d';
        default: return '#6b7280';
      }
    }
    
    // 根据类别设置颜色
    if (node.category) {
      switch (node.category) {
        case 'exchange': return '#3b82f6';
        case 'defi': return '#8b5cf6';
        case 'wallet': return '#14b8a6';
        case 'contract': return '#f97316';
        default: return '#6b7280';
      }
    }
    
    return '#6b7280';
  }, []);
  
  // 自定义节点组件
  const CustomNode = useCallback(({ x, y, width, height, index, payload }: any) => {
    const isActive = activeNode === index;
    const nodeData = payload as Node;
    const color = getNodeColor(nodeData);
    
    return (
      <SafeRectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={isActive ? 1 : 0.9}
        stroke="#fff"
        strokeWidth={isActive ? 2 : 0}
        cursor="pointer"
        onClick={() => {
          setActiveNode(index);
          if (onNodeClick && nodeData) {
            onNodeClick(nodeData);
          }
        }}
      />
    );
  }, [activeNode, getNodeColor, onNodeClick]);
  
  // 自定义链接组件
  const CustomLink = useCallback(({ sourceX, sourceY, targetX, targetY, sourceControlX, sourceControlY, targetControlX, targetControlY, linkWidth, index, payload }: any) => {
    const isActive = activeLink === index;
    
    return (
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceControlY}
           ${targetControlX},${targetControlY}
           ${targetX},${targetY}
        `}
        fill="none"
        stroke="#aaa"
        strokeWidth={linkWidth}
        strokeOpacity={isActive ? 0.8 : 0.3}
        cursor="pointer"
        onClick={() => {
          setActiveLink(index);
          if (onLinkClick && payload) {
            onLinkClick(payload);
          }
        }}
      />
    );
  }, [activeLink, onLinkClick]);
  
  // 自定义工具提示
  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      if (data.source !== undefined && data.target !== undefined) {
        // 链接工具提示
        return (
          <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md">
            <p className="font-medium text-gray-800">{t('charts.transactionFlow.link')}</p>
            <div className="space-y-1 mt-2">
              <div className="flex items-center">
                <span className="text-gray-700">{t('charts.transactionFlow.from')}: </span>
                <span className="font-medium ml-1">{nodes[data.source]?.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-700">{t('charts.transactionFlow.to')}: </span>
                <span className="font-medium ml-1">{nodes[data.target]?.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-700">{t('charts.transactionFlow.value')}: </span>
                <span className="font-medium ml-1">{data.value}</span>
              </div>
              {data.txHash && (
                <div className="flex items-center">
                  <span className="text-gray-700">{t('charts.transactionFlow.txHash')}: </span>
                  <span className="font-medium ml-1 text-xs">{`${data.txHash.substring(0, 10)}...`}</span>
                </div>
              )}
            </div>
          </div>
        );
      } else {
        // 节点工具提示
        return (
          <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md">
            <p className="font-medium text-gray-800">{data.name}</p>
            <div className="space-y-1 mt-2">
              {data.address && (
                <div className="flex items-center">
                  <span className="text-gray-700">{t('charts.transactionFlow.address')}: </span>
                  <span className="font-medium ml-1 text-xs">{`${data.address.substring(0, 10)}...`}</span>
                </div>
              )}
              {data.category && (
                <div className="flex items-center">
                  <span className="text-gray-700">{t('charts.transactionFlow.category')}: </span>
                  <span className="font-medium ml-1">{data.category}</span>
                </div>
              )}
              {data.riskLevel && (
                <div className="flex items-center">
                  <span className="text-gray-700">{t('charts.transactionFlow.riskLevel')}: </span>
                  <span className="font-medium ml-1">{data.riskLevel}</span>
                </div>
              )}
            </div>
          </div>
        );
      }
    }
    
    return null;
  }, [nodes, t]);
  
  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {t('charts.transactionFlow.title')}
        </h2>
      </div>
      
      <div className="h-96">
        <SafeResponsiveContainer width="100%" height="100%">
          <SafeSankey
            data={{ nodes, links }}
            node={CustomNode}
            link={CustomLink}
            nodePadding={50}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <SafeTooltip content={CustomTooltip} />
          </SafeSankey>
        </SafeResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>{t('charts.transactionFlow.instructions')}</p>
      </div>
    </div>
  );
};

export default TransactionFlowChart; 