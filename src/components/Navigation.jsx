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
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Icon size={18} />
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
