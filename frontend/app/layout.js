import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ChainIntelAI - 区块链智能分析平台",
  description: "实时监控区块链交易，智能识别风险",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed w-full z-50">
          <div className="flex flex-wrap justify-between items-center mx-auto max-w-7xl">
            <Link href="/" className="flex items-center">
              <span className="self-center text-xl font-semibold whitespace-nowrap text-blue-800">
                ChainIntelAI
              </span>
            </Link>
            <div className="flex items-center lg:order-2">
              <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-4 py-2 mr-2"
              >
                登录
              </button>
              <button
                data-collapse-toggle="mobile-menu-2"
                type="button"
                className="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                aria-controls="mobile-menu-2"
                aria-expanded="false"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <svg
                  className="hidden w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
            <div
              className="hidden justify-between items-center w-full lg:flex lg:w-auto lg:order-1"
              id="mobile-menu-2"
            >
              <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
                <li>
                  <Link
                    href="/"
                    className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-blue-700 lg:p-0"
                  >
                    首页
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-blue-700 lg:p-0"
                  >
                    仪表盘
                  </Link>
                </li>
                <li>
                  <Link
                    href="/transactions"
                    className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-blue-700 lg:p-0"
                  >
                    交易分析
                  </Link>
                </li>
                <li>
                  <Link
                    href="/addresses"
                    className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-blue-700 lg:p-0"
                  >
                    地址画像
                  </Link>
                </li>
                <li>
                  <Link
                    href="/alerts"
                    className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-blue-700 lg:p-0"
                  >
                    风险告警
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}
