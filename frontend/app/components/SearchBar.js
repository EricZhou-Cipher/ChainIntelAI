'use client';
import { useState } from 'react';

export default function SearchBar({ 
  placeholder = '输入搜索内容...', 
  label = '搜索', 
  onSearch 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    onSearch(searchQuery);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <form
        onSubmit={handleSearch}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="flex-grow">
          <label
            htmlFor="search"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            {label}
          </label>
          <input
            type="text"
            id="search"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
          >
            搜索
          </button>
        </div>
      </form>
    </div>
  );
} 