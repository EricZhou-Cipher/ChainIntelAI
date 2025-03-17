'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * 语言选择器组件
 * @returns {JSX.Element} 语言选择器组件
 */
export default function LanguageSelector() {
  const { t } = useTranslation();
  const { language, changeLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // 切换下拉菜单
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // 选择语言
  const selectLanguage = langCode => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  // 获取当前语言名称
  const getCurrentLanguageName = () => {
    const currentLang = supportedLanguages.find(lang => lang.code === language);
    return currentLang ? currentLang.name : '';
  };

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-1 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <GlobeAltIcon className="h-5 w-5" />
        <span className="text-sm font-medium">{getCurrentLanguageName()}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="py-1" role="menu" aria-orientation="vertical">
              {supportedLanguages.map(lang => (
                <button
                  key={lang.code}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    language === lang.code
                      ? 'bg-gray-100 dark:bg-gray-700 text-primary dark:text-secondary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } transition-colors flex items-center justify-between`}
                  onClick={() => selectLanguage(lang.code)}
                  role="menuitem"
                >
                  <span>{lang.name}</span>
                  {language === lang.code && <CheckIcon className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
