'use client';

import { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '../hooks/useLocalStorage';

// 创建语言上下文
const LanguageContext = createContext();

/**
 * 语言提供者组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @returns {JSX.Element} 语言提供者组件
 */
export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useLocalStorage('language', 'zh-CN');

  // 支持的语言列表
  const supportedLanguages = [
    { code: 'zh-CN', name: '中文' },
    { code: 'en-US', name: 'English' }
  ];

  // 切换语言
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setLanguage(langCode);
  };

  // 初始化语言
  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * 使用语言上下文的Hook
 * @returns {Object} 语言上下文
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage 必须在 LanguageProvider 内部使用');
  }
  return context;
} 