import React, { useMemo } from 'react';

const Pagination = ({ 
  currentPage = 1, 
  totalItems = 0, 
  pageSize = 10, 
  onPageChange,
  siblingCount = 1,
  className = "" 
}) => {
  // 计算总页数
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  // 生成页码数组
  const generatePaginationItems = () => {
    // 如果总页数少于 7，显示所有页码
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // 如果当前页接近开始
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    // 如果当前页接近结束
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    // 当前页在中间位置
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages
    ];
  };

  const pages = generatePaginationItems();

  // 处理页码点击
  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page);
    }
  };

  // 处理上一页/下一页按钮点击
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // 如果没有数据，不显示分页
  if (totalItems <= 0) {
    return null;
  }

  return (
    <nav
      className={`flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 ${className}`}
      aria-label="分页"
    >
      <div className="hidden md:-mt-px md:flex">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`inline-flex items-center border-t-2 ${
            currentPage === 1
              ? 'border-transparent text-gray-400 cursor-not-allowed'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          } px-4 pt-4 text-sm font-medium`}
          aria-label="上一页"
        >
          <svg
            className="mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          上一页
        </button>
        
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => handlePageClick(page)}
            disabled={page === '...'}
            className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
              page === currentPage
                ? 'border-blue-500 text-blue-600'
                : page === '...'
                ? 'border-transparent text-gray-500 cursor-default'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={page === '...' ? `省略页码` : `第 ${page} 页`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`inline-flex items-center border-t-2 ${
            currentPage === totalPages
              ? 'border-transparent text-gray-400 cursor-not-allowed'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          } px-4 pt-4 text-sm font-medium`}
          aria-label="下一页"
        >
          下一页
          <svg
            className="ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      
      {/* 移动设备显示简化版分页 */}
      <div className="flex w-full flex-1 justify-between md:hidden">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          aria-label="上一页"
        >
          上一页
        </button>
        <span className="text-sm text-gray-700">
          第 {currentPage} 页，共 {totalPages} 页
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          aria-label="下一页"
        >
          下一页
        </button>
      </div>
    </nav>
  );
};

export default Pagination; 