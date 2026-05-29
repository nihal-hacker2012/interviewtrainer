import { useState, useEffect, useRef } from 'react';
import { Play, Square, Mic, ShieldAlert, Key, Briefcase, Loader2, RotateCcw } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import WebcamView from './WebcamView';

export default function InterviewSimulator({ isMobileMode }) {
  const [targetRole, setTargetRole] = useState(() => localStorage.getItem('targetRole') || 'Software Engineer');
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [openAiKey, setOpenAiKey] = useState(() => localStorage.getItem('openAiApiKey') || '');
  const [modelString, setModelString] = useState(() => localStorage.getItem('geminiModelString') || '');
  const [isListening, setIsListening] = useState(false);
  
  // Advanced coaching state
  const [pastAttempt, setPastAttempt] = useState(null);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('targetRole', targetRole);
    localStorage.setItem('geminiApiKey', apiKey);
    localStorage.setItem('openAiApiKey', openAiKey);
    localStorage.setItem('geminiModelString', modelString);
  }, [targetRole, apiKey, openAiKey, modelString]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        setTranscript(fullTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  // Helper to dynamically find a working model for the provided API key
  const getValidModelName = async (key) => {
    if (modelString.trim() !== '') {
      return modelString.trim();
    }
    
    // Quick fallback for the specific preview key to avoid CORS block
    if (key.includes('DLZbvwEHTR5gvZqSm15xjQZcHd9U3p5gE')) {
      return 'deep-research-max-preview-04-2026'; // Defaulting to one we know the key has
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      const data = await res.json();
      const validModels = data.models.filter(m => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('gemini') && !m.name.includes('embedding') && !m.name.includes('audio') && !m.name.includes('vision'));
      if (validModels.length === 0) return 'gemini-pro';
      
      // Prefer fast models so generation doesn't take long
      const preferred = validModels.find(m => m.name.includes('flash')) || validModels.find(m => m.name.includes('pro')) || validModels[0];
      return preferred.name.replace('models/', '');
    } catch (e) {
      return 'gemini-pro'; // Usually hits here due to CORS on the /models endpoint
    }
  };

  const generateQuestions = async () => {
    if (!apiKey) {
      alert("Please provide a Gemini API Key to generate dynamic questions.");
      return;
    }
    
    setIsLoading(true);
    setFeedback('');
    setPastAttempt(null);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = await getValidModelName(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `You are an expert recruiter conducting an interview for the role of "${targetRole}". 
      Generate a realistic interview script with exactly 5 items. 
      Format exactly like this, one item per line, no extra text or numbering:
      1. [An introductory conversational question, like "Welcome! Tell me a bit about yourself and why you're interested in this role."]
      2. [A role-specific behavioral question]
      3. [A role-specific technical or situational question]
      4. [A challenging role-specific scenario question]
      5. [A concluding question, e.g. "We're wrapping up. Do you have any questions for me?"]
      Do not include numbering in the output, just the raw text of the question on each line.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const parsedQuestions = text.split('\n')
        .map(q => q.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(q => q.length > 5);

      if (parsedQuestions.length >= 4) {
        setQuestions(parsedQuestions.slice(0, 5));
        setQuestionIndex(0);
        setIsActive(true);
      } else {
        throw new Error("Failed to parse questions.");
      }
    } catch (err) {
      console.error(err);
      alert(`API Error: ${err.message || "Failed to generate questions. Check API key."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveScoreToHistory = (newScore) => {
    try {
      const historyStr = localStorage.getItem('interviewHistory');
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.push({
        date: new Date().toISOString(),
        role: targetRole,
        score: newScore
      });
      localStorage.setItem('interviewHistory', JSON.stringify(history));
    } catch (e) { console.error("Error saving score", e); }
  };

  const getAIFeedback = async (answer) => {
    if (!apiKey) return;
    
    try {
      setFeedback("AI is analyzing your response...");
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = await getValidModelName(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      let prompt = `You are an expert interviewer for the role of "${targetRole}". 
        The question was: "${questions[questionIndex]}". 
        The candidate answered: "${answer}". 
        Provide a very brief 2 sentence feedback, and a score out of 100. Format your response exactly like this:
        Score: [number]
        Feedback: [your feedback]`;

      if (pastAttempt) {
        prompt += `\n\nNote: The candidate attempted this previously and scored ${pastAttempt.score}. Their previous answer was "${pastAttempt.answer}". In your feedback, explicitly compare this new attempt to their old attempt and state if they improved and why.`;
      }

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const scoreMatch = text.match(/Score:\s*(\d+)/i);
      const feedbackMatch = text.match(/Feedback:\s*(.*)/is);
      
      const finalScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 80;
      setScore(finalScore);
      setFeedback(feedbackMatch ? feedbackMatch[1].trim() : text);

      // Save score to dashboard data
      saveScoreToHistory(finalScore);

    } catch (err) {
      console.error(err);
      setFeedback(`API Error: ${err.message || "Unknown error occurred"}`);
    }
  };

  const handleStartListening = () => {
    setTranscript('');
    setFeedback('');
    setIsListening(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Recognition already started");
      }
    } else {
      setTranscript('Speech recognition is not supported in this browser. Please type your answer or mock it.');
    }
  };

  const handleStopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (transcript.trim().length > 5) {
      getAIFeedback(transcript);
    } else {
      setFeedback("Answer was too short to evaluate. Try speaking clearly into the microphone.");
    }
  };

  const handleTryAgain = () => {
    setPastAttempt({ answer: transcript, score: score });
    setTranscript('');
    setFeedback('');
    setScore(0);
  };

  const handleNextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(prev => prev + 1);
      setTranscript('');
      setFeedback('');
      setPastAttempt(null);
    } else {
      setIsActive(false);
      setQuestionIndex(0);
      setQuestions([]);
      setPastAttempt(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Interview Simulator</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Live AI Coach & Dynamic Scenarios</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', background: 'var(--surface-solid)', padding: '8px', borderRadius: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', flex: '1 1 300px', gap: '8px' }}>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <Key size={16} style={{ marginRight: '8px', color: 'var(--primary)', flexShrink: 0 }} />
              <input 
                type="password" 
                placeholder="Gemini API Key" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }}
              />
            </div>
            
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <Key size={16} style={{ marginRight: '8px', color: '#10a37f', flexShrink: 0 }} />
              <input 
                type="password" 
                placeholder="OpenAI API Key" 
                value={openAiKey} 
                onChange={e => setOpenAiKey(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flex: '1 1 200px', alignItems: 'center', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <input 
              type="text" 
              placeholder="Model Override (Optional)" 
              value={modelString} 
              onChange={e => setModelString(e.target.value)}
              title="Leave blank for auto-detect. Type model name if you get 404 errors."
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', flex: '1 1 200px', alignItems: 'center', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <Briefcase size={16} style={{ marginRight: '8px', color: 'var(--primary)', flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="Target Role (e.g. Banker)" 
              value={targetRole} 
              onChange={e => setTargetRole(e.target.value)}
              disabled={isActive || isLoading}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%' }}
            />
          </div>

          <button 
            className="btn-primary"
            onClick={generateQuestions}
            disabled={(!apiKey && !openAiKey) || !targetRole || isActive || isLoading}
            style={{ marginLeft: 'auto', flex: '1 1 auto', whiteSpace: 'nowrap' }}
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            {isLoading ? 'Connecting...' : 'Launch Simulation'}
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Video and Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <WebcamView isActive={isActive} />
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            {isActive && (
              <button className="btn-secondary" onClick={() => { setIsActive(false); if(isListening) handleStopListening(); }} style={{ width: '100%', maxWidth: '300px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                <Square size={20} style={{ marginRight: '8px' }}/> End Simulation
              </button>
            )}
          </div>
        </div>

        {/* Right Column: AI Interaction */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isActive && questions.length > 0 ? (
            <>
              <div style={{ background: 'var(--surface-solid)', padding: '16px', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>
                    {questionIndex === 0 ? "Introduction" : questionIndex === questions.length - 1 ? "Conclusion" : `Question ${questionIndex} of ${questions.length - 2}`}
                  </span>
                  {isListening && <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Recording...</span>}
                </div>
                <h3 style={{ fontSize: '1.2rem', lineHeight: '1.4' }}>{questions[questionIndex]}</h3>
              </div>

              <div style={{ background: 'var(--surface-solid)', padding: '16px', borderRadius: '12px', minHeight: '100px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  <Mic size={16} /> Live Transcript
                </h4>
                <div style={{ flex: 1, marginBottom: '16px', color: isListening ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: transcript ? 'normal' : 'italic', maxHeight: '150px', overflowY: 'auto' }}>
                  {transcript || "Click 'Start Speaking' to answer..."}
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  {!isListening ? (
                     <button className="btn-primary" style={{ flex: 1 }} onClick={handleStartListening}>Start Speaking</button>
                  ) : (
                     <button className="btn-secondary" style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={handleStopListening}>Stop & Evaluate</button>
                  )}
                </div>
              </div>

              {feedback && (
                <div style={{ background: feedback.startsWith("API Error") ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: `1px solid ${feedback.startsWith("API Error") ? 'var(--danger)' : 'var(--success)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 style={{ color: feedback.startsWith("API Error") ? 'var(--danger)' : 'var(--success)', margin: 0 }}>
                      {feedback.startsWith("API Error") ? "Error" : `AI Feedback (Score: ${score}/100)`}
                    </h4>
                    {!feedback.startsWith("API Error") && (
                      <button onClick={handleTryAgain} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RotateCcw size={14} /> Try Again
                      </button>
                    )}
                  </div>
                  <p style={{ lineHeight: '1.5' }}>{feedback}</p>
                  
                  {!feedback.startsWith("API Error") && (
                    <button className="btn-primary" onClick={handleNextQuestion} style={{ marginTop: '16px', width: '100%' }}>
                      {questionIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
              <ShieldAlert size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3>Simulation Ready</h3>
              <p style={{ marginTop: '8px' }}>Enter your API key and Target Role, then click "Launch Simulation" to generate your custom interview.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
