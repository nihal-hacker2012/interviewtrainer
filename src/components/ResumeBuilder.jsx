import { useState, useRef } from 'react';
import { Eye, Edit3, CheckCircle, ChevronRight, Download, Upload, Zap, Palette } from 'lucide-react';

export default function ResumeBuilder({ isMobileMode }) {
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [theme, setTheme] = useState('modern');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    linkedin: '',
    experience: '',
    education: '',
    projects: '',
    skills: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loadDemoData = () => {
    setFormData({
      name: 'Alex Johnson',
      role: 'Senior Full Stack Engineer',
      email: 'alex.j@example.com',
      linkedin: 'linkedin.com/in/alexj',
      experience: 'Tech Innovators Inc. (2020 - Present)\n- Led the migration of a legacy monolithic application to microservices.\n- Improved application load time by 40% using React and Next.js.\n\nGlobal Systems LLC (2017 - 2020)\n- Developed RESTful APIs using Node.js and Express.',
      education: 'B.S. in Computer Science\nUniversity of Technology (2013 - 2017)',
      projects: 'AI Resume Coach (2023)\n- Built an interactive resume tool with real-time AI feedback.\n\nE-commerce Platform (2021)\n- Scalable storefront handling 10k+ daily users.',
      skills: 'React, Node.js, TypeScript, Python, Docker, AWS, GraphQL'
    });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        setFormData(prev => ({ ...prev, ...importedData }));
        alert("Resume JSON imported successfully!");
      } catch (err) {
        alert("Error importing resume. Please ensure it is a valid JSON file containing resume fields.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "resume.json");
    dlAnchorElem.click();
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'minimal':
        return {
          wrapper: { background: '#fff', color: '#111', fontFamily: 'monospace' },
          header: { borderBottom: '1px solid #111', textTransform: 'uppercase' },
          accent: { color: '#111' },
          section: { textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px dashed #ccc' }
        };
      case 'professional':
        return {
          wrapper: { background: '#fdfbf7', color: '#2b2b2b', fontFamily: 'Georgia, serif' },
          header: { borderBottom: '2px solid #8b0000' },
          accent: { color: '#8b0000' },
          section: { color: '#8b0000', borderBottom: '1px solid #8b0000', fontStyle: 'italic' }
        };
      case 'modern':
      default:
        return {
          wrapper: { background: '#fff', color: '#333', fontFamily: 'Inter, sans-serif' },
          header: { borderBottom: 'none' },
          accent: { color: '#0ea5e9' },
          section: { color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px' }
        };
    }
  };

  const themeStyles = getThemeStyles();

  const ResumePreview = () => (
    <div id="resume-preview" style={{ ...themeStyles.wrapper, padding: '40px', borderRadius: '8px', minHeight: '600px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}>
      <div style={{ textAlign: theme === 'modern' ? 'left' : 'center', marginBottom: '32px', paddingBottom: '16px', ...themeStyles.header }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', fontWeight: 'bold' }}>
          {formData.name || 'Your Name'}
        </h1>
        <h3 style={{ fontSize: '1.2rem', ...themeStyles.accent, marginBottom: '12px' }}>
          {formData.role || 'Professional Title'}
        </h3>
        <div style={{ display: 'flex', gap: '16px', justifyContent: theme === 'modern' ? 'flex-start' : 'center', color: '#666', fontSize: '0.9rem' }}>
          <span>{formData.email || 'email@example.com'}</span>
          <span>•</span>
          <span>{formData.linkedin || 'linkedin.com/in/username'}</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h4 style={{ marginBottom: '12px', paddingBottom: '4px', fontWeight: 'bold', ...themeStyles.section }}>Experience</h4>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{formData.experience || 'Your experience will appear here...'}</p>
        </div>

        <div>
          <h4 style={{ marginBottom: '12px', paddingBottom: '4px', fontWeight: 'bold', ...themeStyles.section }}>Projects</h4>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{formData.projects || 'Your projects will appear here...'}</p>
        </div>

        <div>
          <h4 style={{ marginBottom: '12px', paddingBottom: '4px', fontWeight: 'bold', ...themeStyles.section }}>Education</h4>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{formData.education || 'Your education will appear here...'}</p>
        </div>

        <div>
          <h4 style={{ marginBottom: '12px', paddingBottom: '4px', fontWeight: 'bold', ...themeStyles.section }}>Skills</h4>
          <p style={{ lineHeight: '1.6' }}>{formData.skills || 'Your skills will appear here...'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid-2" style={{ position: 'relative', minHeight: '700px' }}>
      
      {/* Hidden file input for importing */}
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        onChange={handleImport} 
        style={{ display: 'none' }} 
      />

      {/* Left Column: Form/Wizard */}
      <div className="glass-panel" style={{ padding: '24px', display: isMobileMode && showPreview ? 'none' : 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Edit3 size={24} color="var(--primary)" />
            <h2 style={{ fontSize: '1.5rem' }}>Resume Builder</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={loadDemoData} className="btn-secondary" title="Load Demo Data" style={{ padding: '8px' }}>
              <Zap size={18} color="var(--warning)"/>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" title="Import Resume JSON" style={{ padding: '8px' }}>
              <Upload size={18} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--surface-solid)', padding: '8px', borderRadius: '8px' }}>
          <Palette size={20} style={{ margin: 'auto 8px', color: 'var(--text-secondary)' }} />
          {['modern', 'minimal', 'professional'].map(t => (
            <button 
              key={t}
              onClick={() => setTheme(t)}
              style={{ 
                flex: 1, padding: '8px', borderRadius: '6px', textTransform: 'capitalize',
                background: theme === t ? 'var(--primary)' : 'transparent',
                color: theme === t ? '#000' : 'var(--text-primary)',
                fontWeight: theme === t ? 'bold' : 'normal'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {step === 1 && (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Jane Doe" className="app-input" />
              </div>
              <div className="input-group">
                <label>Target Role</label>
                <input type="text" name="role" value={formData.role} onChange={handleChange} placeholder="e.g. Senior Frontend Engineer" className="app-input" />
              </div>
              <div className="grid-2" style={{ gap: '12px' }}>
                <div className="input-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className="app-input" />
                </div>
                <div className="input-group">
                  <label>LinkedIn</label>
                  <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="linkedin.com/in/..." className="app-input" />
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <div className="input-group">
              <label>Experience (Format: Company - Details)</label>
              <textarea name="experience" value={formData.experience} onChange={handleChange} rows={8} className="app-input" placeholder="I have 5 years of experience building..." />
            </div>
          )}
          {step === 3 && (
            <>
              <div className="input-group">
                <label>Projects</label>
                <textarea name="projects" value={formData.projects} onChange={handleChange} rows={4} className="app-input" placeholder="Describe key projects..." />
              </div>
              <div className="input-group">
                <label>Education</label>
                <textarea name="education" value={formData.education} onChange={handleChange} rows={3} className="app-input" placeholder="University, Degree, Year..." />
              </div>
            </>
          )}
          {step === 4 && (
            <div className="input-group">
              <label>Key Skills (comma separated)</label>
              <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="app-input" placeholder="React, Node.js, CSS..." />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              disabled={step === 1}
              style={{ opacity: step === 1 ? 0.5 : 1 }}
            >
              Back
            </button>
            <span style={{ margin: 'auto', color: 'var(--text-secondary)' }}>Step {step} of 4</span>
            {step < 4 ? (
              <button className="btn-primary" onClick={() => setStep(prev => Math.min(4, prev + 1))}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn-primary" onClick={() => isMobileMode && setShowPreview(true)}>
                <CheckCircle size={16} style={{ marginRight: '8px' }}/> View Resume
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column / Mobile Overlay: Preview */}
      <div 
        style={{ 
          display: isMobileMode && !showPreview ? 'none' : 'block',
          position: isMobileMode ? 'absolute' : 'relative',
          top: 0, left: 0, right: 0, bottom: 0,
          background: isMobileMode ? 'var(--bg-color)' : 'transparent',
          zIndex: isMobileMode ? 10 : 1,
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'var(--surface-color)', padding: '12px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={20} color="var(--primary)" /> Live Preview
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={exportJSON}>
              <Download size={16} style={{ display: 'inline', marginRight: '8px' }}/> Export JSON
            </button>
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => window.print()}>
              <Download size={16} style={{ display: 'inline', marginRight: '8px' }}/> Export PDF
            </button>
          </div>
        </div>
        
        <ResumePreview />

        {isMobileMode && (
          <button 
            className="btn-secondary" 
            onClick={() => setShowPreview(false)}
            style={{ width: '100%', marginTop: '16px' }}
          >
            Back to Edit
          </button>
        )}
      </div>

      {/* Mobile Floating Action Button for Preview */}
      {isMobileMode && !showPreview && (
        <button 
          className="btn-primary"
          onClick={() => setShowPreview(true)}
          style={{ position: 'absolute', bottom: '24px', right: '24px', borderRadius: '50%', width: '56px', height: '56px', padding: 0, boxShadow: 'var(--shadow-lg)', zIndex: 100 }}
          title="Show Preview"
        >
          <Eye size={24} />
        </button>
      )}
    </div>
  );
}
