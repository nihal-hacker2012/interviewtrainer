import { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ResumeBuilder from './components/ResumeBuilder';
import InterviewSimulator from './components/InterviewSimulator';
import ATSDashboard from './components/ATSDashboard';

function App() {
  const [isDark, setIsDark] = useState(true);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [activeTab, setActiveTab] = useState('interview');

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className={`app-container ${isMobileMode ? 'mobile-mode' : ''}`}>
      <Header 
        isDark={isDark} setIsDark={setIsDark}
        isMobileMode={isMobileMode} setIsMobileMode={setIsMobileMode}
      />
      <main className="main-content">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {activeTab === 'resume' && <ResumeBuilder isMobileMode={isMobileMode} />}
        {activeTab === 'interview' && <InterviewSimulator isMobileMode={isMobileMode} />}
        {activeTab === 'dashboard' && <ATSDashboard isMobileMode={isMobileMode} />}
      </main>
    </div>
  );
}

export default App;
