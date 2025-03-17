import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import { NetworkNode, NetworkLink, BlockchainNetworkBaseProps } from './BlockchainNetworkTypes';

// 导出类型以便其他文件使用
export type { NetworkNode, NetworkLink };

/**
 * 区块链网络图组件 - 使用D3.js Force Layout实现交互式网络图
 */
const BlockchainNetwork: React.FC<BlockchainNetworkBaseProps> = ({
  nodes,
  links,
  width = 800,
  height = 600,
  className = '',
  onNodeClick,
  onLinkClick
}) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    content: React.ReactNode;
    x: number;
    y: number;
    visible: boolean;
  }>({
    content: null,
    x: 0,
    y: 0,
    visible: false
  });

  // 获取节点颜色
  const getNodeColor = (node: NetworkNode) => {
    // 根据节点类型设置不同颜色
    if (node.type === 'transaction') {
      return '#3b82f6'; // 蓝色
    } else if (node.type === 'contract') {
      return '#8b5cf6'; // 紫色
    }
    
    // 根据风险等级设置地址颜色
    if (node.riskLevel) {
      switch (node.riskLevel) {
        case 'low': return '#10b981';
        case 'medium': return '#f59e0b';
        case 'high': return '#ef4444';
        case 'critical': return '#7f1d1d';
        default: return '#6b7280';
      }
    }
    
    return '#6b7280'; // 默认灰色
  };

  // 获取节点大小
  const getNodeSize = (node: NetworkNode) => {
    if (node.value) {
      // 根据节点值大小设置半径，最小8，最大20
      return Math.max(8, Math.min(20, 8 + node.value / 10));
    }
    
    // 根据节点类型设置默认大小
    if (node.type === 'transaction') {
      return 6;
    } else if (node.type === 'contract') {
      return 10;
    }
    
    return 8; // 默认大小
  };

  // 创建网络图
  useEffect(() => {
    if (!svgRef.current || !nodes.length || !links.length) return;

    // 清除之前的图形
    d3.select(svgRef.current).selectAll('*').remove();

    // 创建SVG容器
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // 添加缩放功能
    const g = svg.append('g');
    
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 4])
        .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          g.attr('transform', event.transform.toString());
          setTooltipData(prev => ({ ...prev, visible: false }));
        })
    );

    // 创建箭头标记
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#999')
      .attr('d', 'M0,-5L10,0L0,5');

    // 准备数据
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    
    // 创建力导向模拟
    const simulation = d3.forceSimulation<d3.SimulationNodeDatum & NetworkNode>()
      .nodes(nodes as (d3.SimulationNodeDatum & NetworkNode)[])
      .force('link', d3.forceLink<d3.SimulationNodeDatum & NetworkNode, d3.SimulationLinkDatum<d3.SimulationNodeDatum & NetworkNode>>(
        links.map(link => ({
          source: link.source,
          target: link.target,
          value: link.value
        })) as d3.SimulationLinkDatum<d3.SimulationNodeDatum & NetworkNode>[]
      ).id(d => (d as NetworkNode).id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1))
      .force('collision', d3.forceCollide().radius(d => getNodeSize(d as NetworkNode) + 5));

    // 创建链接
    const link = g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value))
      .attr('marker-end', 'url(#arrow)')
      .style('cursor', 'pointer')
      .on('mouseover', (event: MouseEvent, d: NetworkLink) => {
        d3.select(event.currentTarget as Element)
          .attr('stroke', '#000')
          .attr('stroke-opacity', 1);
        
        // 显示工具提示
        const sourceNode = nodeMap.get(typeof d.source === 'string' ? d.source : d.source.id);
        const targetNode = nodeMap.get(typeof d.target === 'string' ? d.target : d.target.id);
        
        if (sourceNode && targetNode) {
          setTooltipData({
            content: (
              <div>
                <div className="font-medium">{t('network.link')}</div>
                <div className="text-sm">
                  <div>{t('network.from')}: {sourceNode.label || sourceNode.id}</div>
                  <div>{t('network.to')}: {targetNode.label || targetNode.id}</div>
                  <div>{t('network.value')}: {d.value}</div>
                  {d.txHash && <div>{t('network.txHash')}: {d.txHash.substring(0, 10)}...</div>}
                </div>
              </div>
            ),
            x: event.pageX,
            y: event.pageY,
            visible: true
          });
        }
        
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        setSelectedLink(`${sourceId}-${targetId}`);
      })
      .on('mouseout', (event: MouseEvent) => {
        d3.select(event.currentTarget as Element)
          .attr('stroke', '#999')
          .attr('stroke-opacity', 0.6);
        
        setTooltipData(prev => ({ ...prev, visible: false }));
        setSelectedLink(null);
      })
      .on('click', (event: MouseEvent, d: NetworkLink) => {
        if (onLinkClick) {
          onLinkClick(d);
        }
      });

    // 创建节点
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event: MouseEvent, d: NetworkNode) => {
        d3.select(event.currentTarget as Element)
          .attr('stroke', '#000')
          .attr('stroke-width', 2);
        
        // 显示工具提示
        setTooltipData({
          content: (
            <div>
              <div className="font-medium">{d.label || d.id}</div>
              <div className="text-sm">
                <div>{t('network.type')}: {t(`network.nodeTypes.${d.type}`)}</div>
                {d.riskLevel && <div>{t('network.riskLevel')}: {t(`riskLevel.${d.riskLevel}`)}</div>}
                {d.value && <div>{t('network.value')}: {d.value}</div>}
              </div>
            </div>
          ),
          x: event.pageX,
          y: event.pageY,
          visible: true
        });
        
        setSelectedNode(d.id);
      })
      .on('mouseout', (event: MouseEvent) => {
        d3.select(event.currentTarget as Element)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5);
        
        setTooltipData(prev => ({ ...prev, visible: false }));
        setSelectedNode(null);
      })
      .on('click', (event: MouseEvent, d: NetworkNode) => {
        if (onNodeClick) {
          onNodeClick(d);
        }
      })
      .call((selection) => {
        const dragBehavior = d3.drag<SVGCircleElement, NetworkNode>()
          .on('start', (event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>, d: NetworkNode) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            (d as any).fx = d.x;
            (d as any).fy = d.y;
          })
          .on('drag', (event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>, d: NetworkNode) => {
            (d as any).fx = event.x;
            (d as any).fy = event.y;
          })
          .on('end', (event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>, d: NetworkNode) => {
            if (!event.active) simulation.alphaTarget(0);
            (d as any).fx = null;
            (d as any).fy = null;
          });
        
        // 应用拖拽行为
        dragBehavior(selection as any);
      });

    // 添加节点标签
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => d.label || d.id.substring(0, 6) + '...')
      .style('font-size', '10px')
      .style('pointer-events', 'none')
      .style('fill', '#333');

    // 更新模拟
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    // 清理函数
    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, onNodeClick, onLinkClick, t]);

  return (
    <div className={`relative ${className}`}>
      <svg ref={svgRef} className="w-full h-full"></svg>
      
      {/* 工具提示 */}
      {tooltipData.visible && (
        <div
          className="absolute bg-white p-2 rounded shadow-lg border border-gray-200 z-10 pointer-events-none"
          style={{
            left: tooltipData.x + 10,
            top: tooltipData.y - 10,
            maxWidth: '250px'
          }}
        >
          {tooltipData.content}
        </div>
      )}
      
      {/* 控制面板 */}
      <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-md border border-gray-200">
        <div className="flex space-x-2">
          <button
            className="p-1 rounded hover:bg-gray-100"
            title={t('network.zoomIn')}
            onClick={() => {
              const svg = d3.select(svgRef.current);
              const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
                svg.select('g').attr('transform', event.transform.toString());
              });
              (svg.transition() as any).call(zoom.scaleBy, 1.3);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100"
            title={t('network.zoomOut')}
            onClick={() => {
              const svg = d3.select(svgRef.current);
              const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
                svg.select('g').attr('transform', event.transform.toString());
              });
              (svg.transition() as any).call(zoom.scaleBy, 0.7);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100"
            title={t('network.resetZoom')}
            onClick={() => {
              const svg = d3.select(svgRef.current);
              const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
                svg.select('g').attr('transform', event.transform.toString());
              });
              (svg.transition() as any).call(zoom.transform, d3.zoomIdentity);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-md border border-gray-200">
        <div className="text-sm font-medium mb-1">{t('network.legend')}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span>{t('network.nodeTypes.transaction')}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
            <span>{t('network.nodeTypes.contract')}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span>{t('riskLevel.low')}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span>{t('riskLevel.medium')}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span>{t('riskLevel.high')}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-900 mr-1"></div>
            <span>{t('riskLevel.critical')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainNetwork; 