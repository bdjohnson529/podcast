'use client';

interface SidebarProps {
  activeTab: 'create' | 'episodes';
  onTabChange: (tab: 'create' | 'episodes') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Podcast Studio</h1>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'create'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => onTabChange('create')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-medium">Create New</span>
          </button>
          
          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'episodes'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => onTabChange('episodes')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="font-medium">Browse Episodes</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
