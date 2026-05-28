import { useState, useEffect } from 'react';
import { BarChart, Activity, CheckCircle, AlertTriangle, Calendar as CalendarIcon, Clock, TrendingUp } from 'lucide-react';

export default function ATSDashboard() {
  const [interviewDate, setInterviewDate] = useState(() => localStorage.getItem('interviewDate') || '');
  const [trainingPlan, setTrainingPlan] = useState(() => {
    const saved = localStorage.getItem('trainingPlan');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const historyStr = localStorage.getItem('interviewHistory');
    if (historyStr) {
      setHistory(JSON.parse(historyStr));
    }
  }, []);

  const generateTrainingPlan = (targetDateStr) => {
    setInterviewDate(targetDateStr);
    localStorage.setItem('interviewDate', targetDateStr);
    
    if (!targetDateStr) {
      setTrainingPlan([]);
      localStorage.removeItem('trainingPlan');
      return;
    }

    const targetDate = new Date(targetDateStr);
    const today = new Date();
    const daysDiff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

    let plan = [];
    if (daysDiff <= 0) {
      plan = [
        { day: 'Today', topic: 'Final Review & Confidence Building', completed: false }
      ];
    } else if (daysDiff <= 3) {
      plan = [
        { day: 'Day 1', topic: 'Behavioral & Intro Mastery', completed: false },
        { day: 'Day 2', topic: 'Technical Deep Dive', completed: false },
        { day: 'Day 3', topic: 'Full Mock Interview Simulation', completed: false }
      ];
    } else if (daysDiff <= 7) {
      plan = [
        { day: 'Day 1-2', topic: 'Resume Review & Behavioral Fundamentals', completed: false },
        { day: 'Day 3-4', topic: 'Core Technical Scenarios', completed: false },
        { day: 'Day 5', topic: 'Handling Difficult/Edge Case Questions', completed: false },
        { day: 'Day 6-7', topic: 'Mock Interviews & Polish', completed: false }
      ];
    } else {
      plan = [
        { day: 'Week 1', topic: 'Foundational Knowledge & Soft Skills', completed: false },
        { day: 'Week 2', topic: 'Role-Specific Technical Training', completed: false },
        { day: 'Week 3', topic: 'Advanced Scenarios & Problem Solving', completed: false },
        { day: 'Week 4', topic: 'Daily Mock Interviews & Final Polish', completed: false }
      ];
    }
    
    setTrainingPlan(plan);
    localStorage.setItem('trainingPlan', JSON.stringify(plan));
  };

  const togglePlanTask = (index) => {
    const newPlan = [...trainingPlan];
    newPlan[index].completed = !newPlan[index].completed;
    setTrainingPlan(newPlan);
    localStorage.setItem('trainingPlan', JSON.stringify(newPlan));
  };

  const getLatestScore = () => {
    if (history.length === 0) return 0;
    return history[history.length - 1].score;
  };

  const latestScore = getLatestScore();
  const averageScore = history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / history.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Training Hub & Analytics</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Track your progress and schedule your prep.</p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{latestScore}%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Latest Score</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{averageScore}%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Average Score</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{history.length}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Mocks</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Calendar & Training Plan */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CalendarIcon size={20} color="var(--primary)" /> Smart Training Scheduler
          </h3>
          
          <div style={{ marginBottom: '24px', background: 'var(--surface-solid)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>When is your real interview?</label>
            <input 
              type="date" 
              value={interviewDate}
              onChange={(e) => generateTrainingPlan(e.target.value)}
              className="app-input"
              style={{ width: '100%' }}
            />
          </div>

          {trainingPlan.length > 0 ? (
            <div>
              <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Your Customized AI Plan</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {trainingPlan.map((task, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => togglePlanTask(idx)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                      background: task.completed ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-solid)', 
                      border: `1px solid ${task.completed ? 'var(--success)' : 'var(--border-color)'}`,
                      borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {task.completed ? <CheckCircle size={20} color="var(--success)" /> : <Clock size={20} color="var(--text-secondary)" />}
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: task.completed ? 'var(--success)' : 'var(--primary)' }}>{task.day}</div>
                      <div style={{ color: task.completed ? 'var(--text-primary)' : 'var(--text-secondary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.topic}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
              Select a date above to generate your training curriculum.
            </div>
          )}
        </div>

        {/* Right Column: Historical Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp size={20} color="var(--primary)" /> Progress History
            </h3>
            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {history.slice().reverse().map((entry, idx) => {
                  const date = new Date(entry.date).toLocaleDateString();
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--surface-solid)', borderRadius: '8px', borderLeft: `4px solid var(--primary)` }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{entry.role}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{date}</div>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: entry.score >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                        {entry.score}/100
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                No interview history found. Complete a mock interview to see your progress!
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Activity size={20} color="var(--primary)" /> AI Recommendations
            </h3>
            {latestScore < 70 && history.length > 0 ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: 'var(--warning)' }}>
                <AlertTriangle size={24} style={{ flexShrink: 0 }}/>
                <p>Your recent scores indicate a need for more technical review. Try using the "Try Again" feature during your next mock interview to perfect your answers.</p>
              </div>
            ) : history.length > 0 ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: 'var(--success)' }}>
                <CheckCircle size={24} style={{ flexShrink: 0 }}/>
                <p>Great job maintaining high scores! Focus on edge cases and challenging behavioral questions to reach 100% mastery.</p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Recommendations will appear here after your first simulation.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
