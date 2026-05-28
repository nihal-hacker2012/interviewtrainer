import { Moon, Sun, Smartphone, Monitor, Hexagon, Brain } from 'lucide-react';

export default function Header({ isDark, setIsDark, isMobileMode, setIsMobileMode }) {
  return (
    <header className="header glass-panel">
      <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Hexagon size={36} color="var(--primary)" strokeWidth={1.5} style={{ animation: 'spin 10s linear infinite' }} />
          <Brain size={18} color="var(--primary)" style={{ position: 'absolute' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '1px', background: 'linear-gradient(to right, #00f0ff, #a200ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NEXUS AI</span>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)' }}>Interview Intelligence</span>
        </div>
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
