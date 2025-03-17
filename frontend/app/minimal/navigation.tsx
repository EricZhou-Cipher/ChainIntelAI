"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  const links = [
    { href: '/minimal', label: '最小化页面' },
    { href: '/minimal/client', label: '客户端组件' },
    { href: '/minimal/api-test', label: 'API测试' },
  ];

  return (
    <nav className="mb-6">
      <ul className="flex space-x-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          
          return (
            <li key={link.href}>
              <Link 
                href={link.href}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
} 