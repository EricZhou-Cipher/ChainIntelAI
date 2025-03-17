'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译文件
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

// 初始化i18next
const initI18n = () => {
  // 避免在服务器端初始化
  if (typeof window === 'undefined') return;

  i18n
    // 检测用户语言
    .use(LanguageDetector)
    // 将i18n实例传递给react-i18next
    .use(initReactI18next)
    // 初始化i18next
    .init({
      // 默认语言
      fallbackLng: 'zh-CN',
      // 调试模式
      debug: process.env.NODE_ENV === 'development',
      // 翻译资源
      resources: {
        'zh-CN': {
          translation: zhCN
        },
        'en-US': {
          translation: enUS
        }
      },
      // 检测语言的选项
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      // 插值选项
      interpolation: {
        escapeValue: false, // 不转义HTML
      },
      // 命名空间
      ns: ['translation'],
      defaultNS: 'translation',
    });
};

// 在客户端环境中初始化
if (typeof window !== 'undefined') {
  initI18n();
}

export default i18n; 