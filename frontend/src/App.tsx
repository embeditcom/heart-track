import React, { useState } from 'react';
import MainContent from './components/layout/main-content';
import Sidebar from './components/layout/sidebar';
import UploadForm from './components/upload/upload-form';
import FileList from './components/list/file-list';


function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('upload');

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <MainContent>
        {activeTab === 'upload' ? <UploadForm /> : <FileList />}
      </MainContent>
    </div>
  );
}

export default App;