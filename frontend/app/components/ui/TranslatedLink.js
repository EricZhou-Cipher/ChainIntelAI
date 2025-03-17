'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

/**
 * 支持翻译的链接组件
 * @param {Object} props - 组件属性
 * @param {string} props.href - 链接地址
 * @param {string} props.translationKey - 翻译键
 * @param {string} props.className - 额外的CSS类名
 * @param {React.ReactNode} props.children - 子组件（如果不使用翻译键）
 * @returns {JSX.Element} 链接组件
 */
export default function TranslatedLink({ href, translationKey, className, children, ...props }) {
  const { t } = useTranslation();
  
  return (
    <Link href={href} className={className} {...props}>
      {translationKey ? t(translationKey) : children}
    </Link>
  );
} 