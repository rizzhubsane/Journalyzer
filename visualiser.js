import React, { useState } from 'react';

// --- ICONS ---
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>;
const WandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.71 0L11.58 9.42a1.21 1.21 0 0 0 0 1.71l5.29 5.29a1.21 1.21 0 0 0 1.71 0l7.08-7.08a1.21 1.21 0 0 0 0-1.71Z" /><path d="m11 13-8 8" /><path d="M14 6a3 3 0 0 0-3 3" /></svg>;
const DecisionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>;
const EventIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-500"><circle cx="12" cy="12" r="10" /></svg>;


// --- THE RAG ANALYSIS MODAL ---
function DecisionAnalysisModal({ decisionEvent, fullChatLog, onClose }) {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (decisionEvent && fullChatLog) {
      setIsLoading(true);
      setAnalysis("");
      
      const conversationText = fullChatLog.map(msg => `[${msg.timestamp}] ${msg.author}: ${msg.content}`).join('\n');

      const prompt = `
        You are a medical analyst. Based on the complete conversation history provided, explain in detail why the following event occurred.

        **Conversation History:**
        ${conversationText}

        **Event to Analyze:**
        Title: "${decisionEvent.title}"
        Summary: "${decisionEvent.summary}"
        Timestamp: ${decisionEvent.timestamp}

        **Your Task:**
        Provide a clear, evidence-based explanation for this event. Quote or reference specific messages from the history that led to this decision. Structure your answer with a summary followed by bullet points of the key evidence.
      `;

      const fetchAnalysis = async () => {
        const apiKey = ""; // Leave blank
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        try {
          const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!response.ok) throw new Error(`API Error: ${response.status}`);
          const data = await response.json();
          setAnalysis(data.candidates[0].content.parts[0].text);
        } catch (error) {
          setAnalysis(`Error analyzing decision: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAnalysis();
    }
  }, [decisionEvent, fullChatLog]);

  if (!decisionEvent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900">Decision Analysis: "{decisionEvent.title}"</h2>
        <div className="prose mt-4">
          {isLoading ? <p>Analyzing history...</p> : analysis.split('\n').map((line, i) => <p key={i}>{line}</p>)}
        </div>
      </div>
    </div>
  );
}

// --- THE DYNAMIC TIMELINE COMPONENT ---
function DynamicTimeline({ timelineData, fullChatLog }) {
  const [selectedDecision, setSelectedDecision] = useState(null);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">AI-Generated Member Journey</h2>
      <div className="relative pl-4">
        <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200"></div>
        {timelineData.map((event, index) => (
          <div key={index} className="mb-8 relative">
            <div className="absolute -left-1.5 top-1 flex items-center justify-center">
              <div className={`h-4 w-4 rounded-full border-4 border-white ${event.type === 'decision' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            </div>
            <div className="ml-8">
              <p className="text-sm text-gray-500">{new Date(event.timestamp).toLocaleDateString()}</p>
              <h3 className="font-bold text-lg text-gray-800">{event.title}</h3>
              <p className="text-gray-600 mt-1">{event.summary}</p>
              {event.type === 'decision' && (
                <button 
                  onClick={() => setSelectedDecision(event)}
                  className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-md mt-2 hover:bg-red-200"
                >
                  Analyze "Why?"
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <DecisionAnalysisModal
        decisionEvent={selectedDecision}
        fullChatLog={fullChatLog}
        onClose={() => setSelectedDecision(null)}
      />
    </div>
  );
}


// --- MAIN APP COMPONENT ---
export default function App() {
  const [rawChatLog, setRawChatLog] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsedJson = JSON.parse(e.target.result);
          setRawChatLog(parsedJson);
          setTimelineData(null); // Reset timeline when new file is uploaded
          setError(null);
        } catch (err) {
          setError("Invalid JSON file. Please upload the chat log generated by the script.");
        }
      };
      reader.readAsText(file);
    }
  };

  const generateTimeline = async () => {
    if (!rawChatLog) {
      setError("Please upload the chat log file first.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const conversationText = rawChatLog.map(msg => `[${msg.timestamp}] ${msg.author}: ${msg.content}`).join('\n');

    const prompt = `
      You are a health journey analyst. Your task is to read a long conversation log between a member and a health team and extract the key milestones and decisions to build a visual timeline.

      **Conversation History:**
      ${conversationText}

      **Your Task:**
      Analyze the entire conversation and identify 5-10 of the most important events. For each event, provide a timestamp, a short title, a one-sentence summary, and classify it as either a "milestone" or a "decision". A "decision" is a specific action taken by the team (e.g., prescribing medication), while a "milestone" is a key event or finding (e.g., receiving test results).

      Return your response as a valid JSON array of objects. Do not include any other text or markdown formatting. Each object in the array must have the following structure:
      {
        "timestamp": "ISO_8601_DATE_STRING",
        "title": "Short, catchy title",
        "summary": "A one-sentence summary of the event.",
        "type": "milestone" or "decision"
      }
    `;

    const apiKey = ""; // Leave blank
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      let responseText = data.candidates[0].content.parts[0].text;
      
      // Clean up the response to ensure it's valid JSON
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedTimeline = JSON.parse(responseText);
      setTimelineData(parsedTimeline);

    } catch (err) {
      setError(`Failed to generate timeline: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 font-sans min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">AI-Driven Health Journey</h1>
        <p className="text-lg text-gray-600 mt-1">Upload a chat log and let AI build the visualization.</p>
      </header>

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Upload Your Chat Log</h2>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadIcon />
              <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-gray-500">JSON file generated by the script</p>
            </div>
            <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
          </label>
        </div>
        {rawChatLog && <p className="text-center text-green-600 mt-4 font-semibold">File loaded successfully! ({rawChatLog.length} messages)</p>}

        <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">2. Generate Visualization</h2>
        <button 
          onClick={generateTimeline}
          disabled={!rawChatLog || isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <WandIcon />
              <span>Let AI Build the Timeline</span>
            </>
          )}
        </button>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
      
      {timelineData && <DynamicTimeline timelineData={timelineData} fullChatLog={rawChatLog} />}
    </div>
  );
}
