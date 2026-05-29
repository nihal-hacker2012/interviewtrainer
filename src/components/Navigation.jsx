import { FileText, Video, BarChart2 } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'resume', label: 'Resume Builder', icon: FileText },
    { id: 'interview', label: 'Interview Simulator', icon: Video },
    { id: 'dashboard', label: 'ATS Dashboard', icon: BarChart2 }
  ];

  return (
    <nav className="glass-panel" style={{ padding: '8px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', margin: '24px auto', borderRadius: '12px', width: 'fit-content', maxWidth: '100%' }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              whiteSpace: 'nowrap',
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
