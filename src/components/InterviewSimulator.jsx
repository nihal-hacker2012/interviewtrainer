import { useState, useEffect, useRef } from 'react';
import { Play, Square, Mic, ShieldAlert, Key, Briefcase, Loader2, RotateCcw, Building, TrendingUp, Code } from 'lucide-react';
import Editor from '@monaco-editor/react';
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
  const [isGrillMeMode, setIsGrillMeMode] = useState(false);
  const [companyPersona, setCompanyPersona] = useState('Generic');
  const [interviewType, setInterviewType] = useState('standard');
  const [code, setCode] = useState('// Write your code here...\n');
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState('transcript');
  
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
    if (!apiKey && !openAiKey) {
      alert("Please provide either a Gemini or OpenAI API Key.");
      return;
    }
    
    setIsLoading(true);
    setFeedback('');
    setPastAttempt(null);
    try {
      let personaInstruction = "";
      if (companyPersona === "Amazon") personaInstruction = "You are an Amazon interviewer. Focus heavily on the 14 Leadership Principles and STAR method. ";
      else if (companyPersona === "Google") personaInstruction = "You are a Google interviewer. Focus heavily on Googleyness, scalable systems, and analytical thinking. ";
      else if (companyPersona === "Meta") personaInstruction = "You are a Meta interviewer. Focus heavily on moving fast, impact, and engineering efficiency. ";
      else if (companyPersona === "Startup") personaInstruction = "You are a demanding founder of an early-stage startup. Focus heavily on hustle, wearing multiple hats, and long hours. ";

      let basePrompt = "";
      let prompt = "";
      
      if (interviewType === "salary") {
        basePrompt = isGrillMeMode 
          ? `You are an aggressive, ruthless HR recruiter negotiating a lowball salary for the role of "${targetRole}". ${personaInstruction}`
          : `You are a professional HR recruiter negotiating salary for the role of "${targetRole}". ${personaInstruction}`;
          
        prompt = `${basePrompt} 
        Generate a realistic salary negotiation script with exactly 5 items for the candidate.
        Format exactly like this, one item per line, no extra text or numbering:
        1. [The initial lowball salary offer to the candidate]
        2. [Pushback and hesitation if the candidate counters]
        3. [Offering some equity/bonus instead of base salary]
        4. [Final firm offer - take it or leave it]
        5. [Concluding the negotiation]
        Do not include numbering in the output, just the raw text of the question on each line.`;
      } else {
        basePrompt = isGrillMeMode 
          ? `You are an aggressive, impatient, highly technical Manager conducting a brutal stress interview for the role of "${targetRole}". ${personaInstruction}`
          : `You are an expert recruiter conducting a friendly, professional interview for the role of "${targetRole}". ${personaInstruction}`;

        prompt = `${basePrompt} 
        Generate a realistic interview script with exactly 5 items. 
        Format exactly like this, one item per line, no extra text or numbering:
        1. [An introductory conversational question, like "Welcome! Tell me a bit about yourself and why you're interested in this role."]
        2. [A role-specific behavioral question]
        3. [A role-specific technical or situational question]
        4. [A challenging role-specific scenario question]
        5. [A concluding question, e.g. "We're wrapping up. Do you have any questions for me?"]
        Do not include numbering in the output, just the raw text of the question on each line.`;
      }

      let text = "";

      if (openAiKey) {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: modelString || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          })
        });
        if (!res.ok) throw new Error("OpenAI Error: " + res.statusText);
        const data = await res.json();
        text = data.choices[0].message.content;
      } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = await getValidModelName(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        text = result.response.text();
      }
      
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
    if (!apiKey && !openAiKey) return;
    
    try {
      setFeedback("AI is analyzing your response...");
      
      let personaInstruction = "";
      if (companyPersona === "Amazon") personaInstruction = "You are an Amazon interviewer. Focus heavily on the 14 Leadership Principles and STAR method. ";
      else if (companyPersona === "Google") personaInstruction = "You are a Google interviewer. Focus heavily on Googleyness, scalable systems, and analytical thinking. ";
      else if (companyPersona === "Meta") personaInstruction = "You are a Meta interviewer. Focus heavily on moving fast, impact, and engineering efficiency. ";
      else if (companyPersona === "Startup") personaInstruction = "You are a demanding founder of an early-stage startup. Focus heavily on hustle, wearing multiple hats, and long hours. ";

      let basePrompt = "";
      if (interviewType === "salary") {
         basePrompt = isGrillMeMode
           ? `You are a harsh HR recruiter negotiating a lowball salary for the role of "${targetRole}". The current negotiation phase: "${questions[questionIndex]}". The candidate said: "${answer}". Deduct points aggressively for weak leverage, lack of confidence, or giving in too early. Be ruthless in your feedback. ${personaInstruction}`
           : `You are an HR recruiter negotiating salary for the role of "${targetRole}". The current negotiation phase: "${questions[questionIndex]}". The candidate said: "${answer}". Evaluate their negotiation tactics, leverage, and confidence. ${personaInstruction}`;
      } else {
         basePrompt = isGrillMeMode
           ? `You are a harsh, highly-critical stress interviewer for the role of "${targetRole}". The question was: "${questions[questionIndex]}". The candidate answered: "${answer}". Deduct points aggressively for any hesitation, lack of deep technical detail, or rambling. Be blunt and ruthless in your feedback. ${personaInstruction}`
           : `You are an expert interviewer for the role of "${targetRole}". The question was: "${questions[questionIndex]}". The candidate answered: "${answer}". ${personaInstruction}`;
      }
        
      let prompt = `${basePrompt} 
        Provide a very brief 2 sentence feedback, and a score out of 100. Format your response exactly like this:
        Score: [number]
        Feedback: [your feedback]`;

      if (activeTab === 'editor' && code.trim().length > 10) {
        prompt += `\n\nAdditionally, the candidate wrote the following ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\nPlease evaluate their code logic, point out bugs, and factor this into your score.`;
      }

      if (pastAttempt) {
        prompt += `\n\nNote: The candidate attempted this previously and scored ${pastAttempt.score}. Their previous answer was "${pastAttempt.answer}". In your feedback, explicitly compare this new attempt to their old attempt and state if they improved and why.`;
      }

      let text = "";
      if (openAiKey) {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: modelString || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          })
        });
        if (!res.ok) throw new Error("OpenAI Error: " + res.statusText);
        const data = await res.json();
        text = data.choices[0].message.content;
      } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = await getValidModelName(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        text = result.response.text();
      }
      
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
    if (transcript.trim().length > 5 || code.trim().length > 25) {
      getAIFeedback(transcript);
    } else {
      setFeedback("Answer was too short to evaluate. Try speaking clearly into the microphone.");
    }
  };

  const handleEvaluateCode = () => {
    if (code.trim().length > 10) {
      getAIFeedback(transcript || "The candidate submitted code without a verbal explanation.");
    } else {
      setFeedback("Code is too short to evaluate.");
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

          <div style={{ display: 'flex', flex: '1 1 200px', alignItems: 'center', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <Building size={16} style={{ marginRight: '8px', color: 'var(--primary)', flexShrink: 0 }} />
            <select 
              value={companyPersona} 
              onChange={e => setCompanyPersona(e.target.value)}
              disabled={isActive || isLoading}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }}
            >
              <option value="Generic">Generic Company</option>
              <option value="Amazon">Amazon (Leadership)</option>
              <option value="Google">Google (Scale/Logic)</option>
              <option value="Meta">Meta (Move Fast)</option>
              <option value="Startup">Strict Startup</option>
            </select>
          </div>

          <div style={{ display: 'flex', flex: '1 1 200px', alignItems: 'center', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <TrendingUp size={16} style={{ marginRight: '8px', color: 'var(--primary)', flexShrink: 0 }} />
            <select 
              value={interviewType} 
              onChange={e => setInterviewType(e.target.value)}
              disabled={isActive || isLoading}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }}
            >
              <option value="standard">Standard Interview</option>
              <option value="salary">Salary Negotiation</option>
            </select>
          </div>

          <button 
            className="btn-secondary"
            onClick={() => setIsGrillMeMode(!isGrillMeMode)}
            disabled={isActive || isLoading}
            style={{ 
              borderColor: isGrillMeMode ? 'var(--danger)' : 'var(--primary)',
              color: isGrillMeMode ? 'var(--danger)' : 'var(--primary)',
              whiteSpace: 'nowrap'
            }}
            title={isGrillMeMode ? "Stress Mode Active" : "Friendly Mode Active"}
          >
            {isGrillMeMode ? '🔥 Grill Me Mode' : '😊 Friendly Mode'}
          </button>

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

              <div style={{ background: 'var(--surface-solid)', padding: '16px', borderRadius: '12px', minHeight: '300px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <button 
                    onClick={() => setActiveTab('transcript')}
                    style={{ background: 'none', border: 'none', color: activeTab === 'transcript' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'transcript' ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Mic size={16} /> Live Transcript
                  </button>
                  <button 
                    onClick={() => setActiveTab('editor')}
                    style={{ background: 'none', border: 'none', color: activeTab === 'editor' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'editor' ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Code size={16} /> Code Editor
                  </button>
                  {activeTab === 'editor' && (
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      style={{ marginLeft: 'auto', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem' }}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  )}
                </div>

                {activeTab === 'transcript' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1, marginBottom: '16px', minHeight: '200px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <Editor
                        height="100%"
                        language={language}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{ minimap: { enabled: false }, fontSize: 14 }}
                      />
                    </div>
                    <button className="btn-primary" style={{ width: '100%' }} onClick={handleEvaluateCode}>
                      Submit Code for Evaluation
                    </button>
                  </>
                )}
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
