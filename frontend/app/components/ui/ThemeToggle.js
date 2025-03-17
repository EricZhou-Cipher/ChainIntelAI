'use client';

import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

/**
 * 主题切换按钮组件
 * @returns {JSX.Element} 主题切换按钮组件
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  
  // 动画变体
  const variants = {
    light: { rotate: 0 },
    dark: { rotate: 180 }
  };
  
  return (
    <motion.button
      aria-label={t('theme.toggle')}
      title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={theme === 'dark' ? 'dark' : 'light'}
      variants={variants}
      transition={{ duration: 0.3 }}
    >
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </motion.button>
  );
} 