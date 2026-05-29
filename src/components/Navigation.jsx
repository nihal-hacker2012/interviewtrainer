import { FileText, Video, BarChart2 } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'resume', label: 'Resume Builder', icon: FileText },
    { id: 'interview', label: 'Interview Simulator', icon: Video },
    { id: 'dashboard', label: 'ATS Dashboard', icon: BarChart2 }
  ];

  return (
    <nav className="nav-tabs glass-panel">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              background: activeTab === tab.id ? 'linear-gradient(135deg, var(--primary), #a200ff)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.id ? '0 4px 15px rgba(0, 240, 255, 0.3)' : 'none',
            }}
          >
            <Icon size={18} />
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
