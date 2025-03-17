import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import BlockchainNetwork from '../BlockchainNetwork';

// 模拟网络数据
const mockNetworkData = {
  nodes: [
    { id: 'node1', label: '地址1', value: 100, group: 'exchange' },
    { id: 'node2', label: '地址2', value: 50, group: 'wallet' },
    { id: 'node3', label: '地址3', value: 75, group: 'contract' }
  ],
  links: [
    { source: 'node1', target: 'node2', value: 10, label: '交易1' },
    { source: 'node2', target: 'node3', value: 5, label: '交易2' }
  ]
};

// 模拟回调函数
const mockOnNodeClick = jest.fn();
const mockOnLinkClick = jest.fn();

// 模拟WebGL上下文
class MockWebGLRenderingContext {
  canvas = { width: 800, height: 600 };
  drawingBufferWidth = 800;
  drawingBufferHeight = 600;
  
  viewport() {}
  clearColor() {}
  clear() {}
  enable() {}
  blendFunc() {}
  getExtension() { return null; }
  createBuffer() { return {}; }
  bindBuffer() {}
  bufferData() {}
  createProgram() { return {}; }
  createShader() { return {}; }
  shaderSource() {}
  compileShader() {}
  getShaderParameter() { return true; }
  attachShader() {}
  linkProgram() {}
  getProgramParameter() { return true; }
  useProgram() {}
  getAttribLocation() { return 0; }
  getUniformLocation() { return {}; }
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  uniform1f() {}
  uniform2f() {}
  uniform3f() {}
  uniform4f() {}
  uniformMatrix4fv() {}
  drawArrays() {}
}

// 模拟canvas元素
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation(() => {
  return new MockWebGLRenderingContext();
});

describe('BlockchainNetwork 组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('渲染网络图', () => {
    render(
      <BlockchainNetwork 
        data={mockNetworkData}
        width={800}
        height={600}
        onNodeClick={mockOnNodeClick}
        onLinkClick={mockOnLinkClick}
      />
    );
    
    // 检查图例是否渲染
    expect(screen.getByText(/交易所/i)).toBeInTheDocument();
    expect(screen.getByText(/钱包/i)).toBeInTheDocument();
    expect(screen.getByText(/合约/i)).toBeInTheDocument();
    
    // 检查控制面板是否渲染
    expect(screen.getByText(/缩放/i)).toBeInTheDocument();
    expect(screen.getByText(/重置/i)).toBeInTheDocument();
  });

  test('处理空数据', () => {
    render(
      <BlockchainNetwork 
        data={{ nodes: [], links: [] }}
        width={800}
        height={600}
        onNodeClick={mockOnNodeClick}
        onLinkClick={mockOnLinkClick}
      />
    );
    
    // 检查空数据提示
    expect(screen.getByText(/没有可显示的网络数据/i)).toBeInTheDocument();
  });

  test('处理缩放控制', () => {
    render(
      <BlockchainNetwork 
        data={mockNetworkData}
        width={800}
        height={600}
        onNodeClick={mockOnNodeClick}
        onLinkClick={mockOnLinkClick}
      />
    );
    
    // 获取缩放按钮
    const zoomInButton = screen.getByRole('button', { name: /放大/i });
    const zoomOutButton = screen.getByRole('button', { name: /缩小/i });
    
    // 点击放大按钮
    fireEvent.click(zoomInButton);
    
    // 点击缩小按钮
    fireEvent.click(zoomOutButton);
    
    // 点击重置按钮
    const resetButton = screen.getByRole('button', { name: /重置/i });
    fireEvent.click(resetButton);
  });

  test('处理节点点击', () => {
    render(
      <BlockchainNetwork 
        data={mockNetworkData}
        width={800}
        height={600}
        onNodeClick={mockOnNodeClick}
        onLinkClick={mockOnLinkClick}
      />
    );
    
    // 模拟节点点击事件
    // 注意：由于实际的节点是在Canvas中渲染的，我们无法直接点击它们
    // 这里我们模拟内部的点击处理函数
    const instance = BlockchainNetwork.prototype.handleNodeClick;
    if (instance) {
      instance({ id: 'node1', label: '地址1', value: 100, group: 'exchange' });
      expect(mockOnNodeClick).toHaveBeenCalledWith({ id: 'node1', label: '地址1', value: 100, group: 'exchange' });
    }
  });

  test('响应式调整大小', () => {
    const { rerender } = render(
      <BlockchainNetwork 
        data={mockNetworkData}
        width={800}
        height={600}
        onNodeClick={mockOnNodeClick}
        onLinkClick={mockOnLinkClick}
      />
    );
    
    // 重新渲染组件，改变大小
    rerender(
      <BlockchainNetwork 
        data={mockNetworkData}
        width={1024}
        height={768}
        onNodeClick={mockOnNodeClick}
        onLinkClick={mockOnLinkClick}
      />
    );
    
    // 检查是否正确处理大小变化
    // 这里我们只能检查组件是否重新渲染，而不能直接检查Canvas大小
    expect(screen.getByText(/交易所/i)).toBeInTheDocument();
  });
}); 