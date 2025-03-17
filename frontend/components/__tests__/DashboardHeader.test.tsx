import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardHeader from '../DashboardHeader';

// 模拟Next.js的usePathname钩子
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/dashboard')
}));

// 模拟next/image组件
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  }
}));

// 模拟国际化
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'navigation.dashboard': '仪表盘',
        'navigation.transactions': '交易',
        'navigation.addresses': '地址',
        'navigation.networkAnalysis': '网络分析',
        'navigation.alerts': '警报',
        'navigation.settings': '设置',
        'common.notifications': '通知',
        'common.noNotifications': '没有新通知',
        'common.openUserMenu': '打开用户菜单',
        'common.profile': '个人资料',
        'common.settings': '设置',
        'common.signOut': '退出',
        'common.search': '搜索',
      };
      return translations[key] || key;
    }
  })
}));

describe('DashboardHeader 组件', () => {
  test('渲染标题和导航链接', () => {
    render(<DashboardHeader />);
    
    // 检查标题
    expect(screen.getByText('Chain Intel AI')).toBeInTheDocument();
    
    // 检查导航链接
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
    expect(screen.getByText('交易')).toBeInTheDocument();
    expect(screen.getByText('地址')).toBeInTheDocument();
    expect(screen.getByText('网络分析')).toBeInTheDocument();
    expect(screen.getByText('警报')).toBeInTheDocument();
    expect(screen.getAllByText('设置')[0]).toBeInTheDocument();
  });
  
  test('点击通知按钮显示通知面板', () => {
    render(<DashboardHeader />);
    
    // 通知面板最初不可见
    expect(screen.queryByText('没有新通知')).not.toBeInTheDocument();
    
    // 点击通知按钮
    const notificationButton = screen.getByRole('button', { name: '通知' });
    fireEvent.click(notificationButton);
    
    // 通知面板现在可见
    expect(screen.getByText('没有新通知')).toBeInTheDocument();
  });
  
  test('点击用户菜单按钮显示用户菜单', () => {
    render(<DashboardHeader />);
    
    // 用户菜单最初不可见
    expect(screen.queryByText('个人资料')).not.toBeInTheDocument();
    
    // 点击用户菜单按钮
    const userMenuButton = screen.getByRole('button', { name: '打开用户菜单' });
    fireEvent.click(userMenuButton);
    
    // 用户菜单现在可见
    expect(screen.getByText('个人资料')).toBeInTheDocument();
    expect(screen.getAllByText('设置')[1]).toBeInTheDocument();
    expect(screen.getByText('common.logout')).toBeInTheDocument();
  });
  
  test('移动设备上显示菜单按钮', () => {
    render(<DashboardHeader />);
    
    // 检查菜单按钮存在
    const menuButton = screen.getByRole('button', { name: 'common.openMainMenu' });
    expect(menuButton).toBeInTheDocument();
    
    // 点击菜单按钮
    fireEvent.click(menuButton);
    
    // 由于移动菜单可能不会在测试环境中正确显示，我们只检查按钮的aria-expanded属性
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });
}); 