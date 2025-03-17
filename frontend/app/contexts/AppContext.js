'use client';

import { createContext, useContext, useReducer } from 'react';

// 初始状态
const initialState = {
  user: null,
  isAuthenticated: false,
  notifications: [],
  loading: {
    dashboard: false,
    transactions: false,
    addresses: false,
    alerts: false
  },
  errors: {
    dashboard: null,
    transactions: null,
    addresses: null,
    alerts: null
  }
};

// 定义 action 类型
const ActionTypes = {
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer 函数
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true
      };
    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false
      };
    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      };
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value
        }
      };
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload]: null
        }
      };
    default:
      return state;
  }
}

// 创建上下文
const AppContext = createContext();

// 应用提供者组件
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 用户登录
  const login = (userData) => {
    dispatch({
      type: ActionTypes.SET_USER,
      payload: userData
    });
  };

  // 用户登出
  const logout = () => {
    dispatch({ type: ActionTypes.LOGOUT });
  };

  // 添加通知
  const addNotification = (notification) => {
    const id = Date.now().toString();
    dispatch({
      type: ActionTypes.ADD_NOTIFICATION,
      payload: { id, ...notification }
    });
    
    // 自动移除通知
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 5000);
    
    return id;
  };

  // 移除通知
  const removeNotification = (id) => {
    dispatch({
      type: ActionTypes.REMOVE_NOTIFICATION,
      payload: id
    });
  };

  // 设置加载状态
  const setLoading = (key, value) => {
    dispatch({
      type: ActionTypes.SET_LOADING,
      payload: { key, value }
    });
  };

  // 设置错误状态
  const setError = (key, value) => {
    dispatch({
      type: ActionTypes.SET_ERROR,
      payload: { key, value }
    });
  };

  // 清除错误状态
  const clearError = (key) => {
    dispatch({
      type: ActionTypes.CLEAR_ERROR,
      payload: key
    });
  };

  // 提供的值
  const value = {
    ...state,
    login,
    logout,
    addNotification,
    removeNotification,
    setLoading,
    setError,
    clearError
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// 自定义 Hook 用于访问应用上下文
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp 必须在 AppProvider 内部使用');
  }
  return context;
} 