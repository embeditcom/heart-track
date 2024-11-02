import React, { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className="flex-1 py-12 px-8 bg-gray-100">
      <div className="max-w-3xl mx-auto">
        {children}
      </div>
    </main>
  );
};

export default MainContent;