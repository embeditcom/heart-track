import React from 'react';

type SidebarProps = {
  activeTab: 'upload' | 'list';
  onTabChange: (tab: 'upload' | 'list') => void;
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-64 bg-gray-800 min-h-screen p-4">
      <h1 className="text-white text-xl font-bold mb-8">Heart Track</h1>
      <nav>
        <button
          onClick={() => onTabChange('upload')}
          className={`w-full text-left px-4 py-2 rounded-lg mb-2 ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          Upload Video
        </button>
        <button
          onClick={() => onTabChange('list')}
          className={`w-full text-left px-4 py-2 rounded-lg mb-2 ${
            activeTab === 'list'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          Video List
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;