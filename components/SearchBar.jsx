import React, { useState } from 'react';

/**
 * 搜索栏组件
 * @param {Object} props - 组件属性
 * @param {Function} props.onSearch - 搜索回调函数
 * @param {string} props.placeholder - 占位文本
 * @returns {JSX.Element} 搜索栏组件
 */
function SearchBar({ onSearch, placeholder = "搜索地址或交易" }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="search-input"
      />
      <button
        onClick={handleSearch}
        className="search-button"
        disabled={!searchTerm.trim()}
      >
        搜索
      </button>
    </div>
  );
}

export default SearchBar; 