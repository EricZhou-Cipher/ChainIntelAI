import React, { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';

// 应用状态类型
interface AppState {
  theme: 'light' | 'dark';
  language: string;
  isAuthenticated: boolean;
  user: {
    id?: string;
    name?: string;
    role?: string;
  } | null;
  notifications: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
  }>;
}

// 初始状态
const initialState: AppState = {
  theme: 'light',
  language: 'zh',
  isAuthenticated: false,
  user: null,
  notifications: []
};

// 动作类型
type AppAction =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'LOGIN'; payload: { id: string; name: string; role: string } }
  | { type: 'LOGOUT' }
  | { type: 'ADD_NOTIFICATION'; payload: { message: string; type: 'info' | 'success' | 'warning' | 'error' } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

// 状态reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.payload };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: Date.now().toString(),
            message: action.payload.message,
            type: action.payload.type,
            read: false
          }
        ]
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    default:
      return state;
  }
};

// 创建Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // 派生状态和操作
  isDarkMode: boolean;
  toggleTheme: () => void;
  unreadNotificationsCount: number;
  addNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  login: (userData: { id: string; name: string; role: string }) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider组件
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 使用useMemo缓存派生状态和操作，避免不必要的重新计算
  const contextValue = useMemo(() => {
    // 派生状态
    const isDarkMode = state.theme === 'dark';
    const unreadNotificationsCount = state.notifications.filter(n => !n.read).length;

    // 操作函数
    const toggleTheme = () => {
      dispatch({ type: 'SET_THEME', payload: isDarkMode ? 'light' : 'dark' });
    };

    const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message, type } });
    };

    const markNotificationRead = (id: string) => {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
    };

    const clearNotifications = () => {
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    };

    const login = (userData: { id: string; name: string; role: string }) => {
      dispatch({ type: 'LOGIN', payload: userData });
    };

    const logout = () => {
      dispatch({ type: 'LOGOUT' });
    };

    return {
      state,
      dispatch,
      isDarkMode,
      toggleTheme,
      unreadNotificationsCount,
      addNotification,
      markNotificationRead,
      clearNotifications,
      login,
      logout
    };
  }, [state]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// 自定义Hook，用于在组件中访问Context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 