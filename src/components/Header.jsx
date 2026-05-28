import { Moon, Sun, Smartphone, Monitor, BrainCircuit } from 'lucide-react';

export default function Header({ isDark, setIsDark, isMobileMode, setIsMobileMode }) {
  return (
    <header className="header glass-panel">
      <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <BrainCircuit size={28} color="var(--primary)" />
        NextGen AI Coach
      </div>
      <div className="header-controls">
        <button 
          className="icon-btn" 
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button 
          className="icon-btn"
          onClick={() => setIsMobileMode(!isMobileMode)}
          title={isMobileMode ? "Switch to Laptop Mode" : "Switch to Mobile Mode"}
        >
          {isMobileMode ? <Monitor size={20} /> : <Smartphone size={20} />}
        </button>
      </div>
    </header>
  );
}
