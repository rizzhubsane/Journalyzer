import React, { useState, useEffect } from 'react';
import { EnhancedAnalyzer } from './enhancedAnalyzer';
import { CONFIG } from './config';

// --- ICONS ---
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>;
const WandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.71 0L11.58 9.42a1.21 1.21 0 0 0 0 1.71l5.29 5.29a1.21 1.21 0 0 0 1.71 0l7.08-7.08a1.21 1.21 0 0 0 0-1.71Z" /><path d="m11 13-8 8" /><path d="M14 6a3 3 0 0 0-3 3" /></svg>;
const BrainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.88 2.5 2.5 0 0 1-.54-3.06 2.5 2.5 0 0 1 1.46-1.46 2.5 2.5 0 0 1 3.06-.54 2.5 2.5 0 0 1 3.88-2.96A2.5 2.5 0 0 1 9.5 2Z" /></svg>;
const MapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.106 5.553a2 2 0 0 1 1.788 0l3.659 1.829A1 1 0 0 1 21 8.829v8.342a1 1 0 0 1-.553.894l-3.659 1.829a2 2 0 0 1-1.788 0l-3.659-1.829A1 1 0 0 1 9 17.171V8.829a1 1 0 0 1 .553-.894l3.659-1.829Z" /><path d="M3 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m22 21-2-2" /><path d="M16 16h6" /></svg>;

// --- DECISION ANALYSIS MODAL ---
function DecisionAnalysisModal({ decision, analysis, onClose }) {
  const [detailedAnalysis, setDetailedAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (decision && analysis) {
      setIsLoading(true);
      setDetailedAnalysis("");
      
      const analyzer = new EnhancedAnalyzer(); // Uses API key from config
      analyzer.generateDecisionAnalysis(decision, analysis.comprehensiveAnalysis)
        .then(result => {
          setDetailedAnalysis(result);
        })
        .catch(error => {
          setDetailedAnalysis(`Error analyzing decision: ${error.message}`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [decision, analysis]);

  // Helper function to render text with bullet points as proper lists
  const renderAnalysisText = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    let inList = false;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if line starts with bullet point indicators
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        if (!inList) {
          // Start new list
          inList = true;
          currentList = [];
        }
        // Add item to current list (remove bullet and trim)
        const listItem = trimmedLine.replace(/^[*\-•]\s*/, '');
        currentList.push(listItem);
      } else {
        // If we were in a list, render it and start new paragraph
        if (inList && currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 ml-4">
              {currentList.map((item, i) => (
                <li key={i} className="text-gray-700 mb-1">{item}</li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        
        // Add regular paragraph
        if (trimmedLine) {
          elements.push(
            <p key={`p-${index}`} className="mb-4 text-gray-700 leading-relaxed">
              {trimmedLine}
            </p>
          );
        } else if (index < lines.length - 1) {
          // Add spacing for empty lines
          elements.push(<div key={`spacer-${index}`} className="mb-2"></div>);
        }
      }
    });
    
    // Handle any remaining list items
    if (inList && currentList.length > 0) {
      elements.push(
        <ul key="final-list" className="list-disc list-inside mb-4 ml-4">
          {currentList.map((item, i) => (
            <li key={i} className="text-gray-700 mb-1">{item}</li>
          ))}
        </ul>
      );
    }
    
    return elements;
  };

  if (!decision) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Decision Analysis: "{decision.title}"</h2>
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600"><strong>Author:</strong> {decision.author}</p>
          <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(decision.timestamp).toLocaleDateString()}</p>
        </div>
        <div className="prose max-w-none">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Analyzing decision...</span>
            </div>
          ) : (
            <div className="analysis-content">
              {renderAnalysisText(detailedAnalysis)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- CAUSAL ROADMAP COMPONENT ---
function CausalRoadmap({ roadmap }) {
  if (!roadmap) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <MapIcon />
        <span className="ml-2">Causal Decision Roadmap</span>
      </h2>
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap bg-gray-50 p-6 rounded-lg">{roadmap}</div>
      </div>
    </div>
  );
}

// --- CHARACTER INFLUENCE COMPONENT ---
function CharacterInfluence({ characterInfluence }) {
  if (!characterInfluence || characterInfluence.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <UsersIcon />
        <span className="ml-2">Team Member Contributions</span>
      </h2>
      <div className="grid gap-4">
        {characterInfluence.map((character, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">{character.character}</h3>
            <div className="mb-3">
              <h4 className="font-medium text-gray-700 mb-1">Key Contributions:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {character.contributions.map((contribution, i) => (
                  <li key={i}>{contribution}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Key Moments:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {character.keyMoments.map((moment, i) => (
                  <li key={i}>{moment}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- BIOMARKER TRACKING COMPONENT ---
function BiomarkerTracking({ biomarkers }) {
  if (!biomarkers || biomarkers.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Health Metrics Tracking</h2>
      <div className="grid gap-4">
        {biomarkers.map((biomarker, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">{biomarker.metric}</h3>
            <p className="text-gray-600 mb-2"><strong>Trend:</strong> {biomarker.trend}</p>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Related Decisions:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {biomarker.decisions.map((decision, i) => (
                  <li key={i}>{decision}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- ENHANCED TIMELINE COMPONENT ---
function EnhancedTimeline({ timeline, onDecisionClick }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Healthcare Journey Timeline</h2>
      <div className="relative pl-4">
        <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200"></div>
        {timeline.map((event, index) => (
          <div key={index} className="mb-8 relative">
            <div className="absolute -left-1.5 top-1 flex items-center justify-center">
              <div className={`h-4 w-4 rounded-full border-4 border-white ${event.type === 'decision' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            </div>
            <div className="ml-8">
              <p className="text-sm text-gray-500">{new Date(event.timestamp).toLocaleDateString()}</p>
              <h3 className="font-bold text-lg text-gray-800">{event.title}</h3>
              <p className="text-gray-600 mt-1">{event.summary}</p>
              {event.evidence && (
                <p className="text-sm text-gray-500 mt-2"><strong>Evidence:</strong> {event.evidence}</p>
              )}
              {event.type === 'decision' && (
                <button 
                  onClick={() => onDecisionClick(event)}
                  className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-md mt-2 hover:bg-red-200"
                >
                  Analyze Decision
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN ENHANCED APP COMPONENT ---
export default function EnhancedVisualizer() {
  const [rawChatLog, setRawChatLog] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsedJson = JSON.parse(e.target.result);
          setRawChatLog(parsedJson);
          setAnalysis(null);
          setError(null);
        } catch (err) {
          setError("Invalid JSON file. Please upload the chat log generated by the script.");
        }
      };
      reader.readAsText(file);
    }
  };

  const generateAnalysis = async () => {
    if (!rawChatLog) {
      setError("Please upload the chat log file first.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const analyzer = new EnhancedAnalyzer(); // Uses API key from config
      const result = await analyzer.analyzeHealthcareJourney(rawChatLog);
      setAnalysis(result);
    } catch (err) {
      setError(`Failed to generate analysis: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecisionClick = (decision) => {
    setSelectedDecision(decision);
  };

  return (
    <div className="bg-gray-100 font-sans min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Enhanced Healthcare Journey Analyzer</h1>
        <p className="text-lg text-gray-600 mt-1">AI-powered structured analysis with causal reasoning</p>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Upload Section */}
        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
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

          <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">2. Generate Comprehensive Analysis</h2>
          <button 
            onClick={generateAnalysis}
            disabled={!rawChatLog || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyzing with AI...</span>
              </>
            ) : (
              <>
                <BrainIcon />
                <span>Generate Structured Analysis</span>
              </>
            )}
          </button>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="mb-8">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex space-x-4 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`py-2 px-4 font-medium ${activeTab === 'timeline' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveTab('roadmap')}
                  className={`py-2 px-4 font-medium ${activeTab === 'roadmap' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Causal Roadmap
                </button>
                <button
                  onClick={() => setActiveTab('characters')}
                  className={`py-2 px-4 font-medium ${activeTab === 'characters' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Team Contributions
                </button>
                <button
                  onClick={() => setActiveTab('biomarkers')}
                  className={`py-2 px-4 font-medium ${activeTab === 'biomarkers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Health Metrics
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'timeline' && (
              <EnhancedTimeline 
                timeline={analysis.comprehensiveAnalysis.timeline} 
                onDecisionClick={handleDecisionClick}
              />
            )}
            
            {activeTab === 'roadmap' && (
              <CausalRoadmap roadmap={analysis.causalRoadmap} />
            )}
            
            {activeTab === 'characters' && (
              <CharacterInfluence characterInfluence={analysis.comprehensiveAnalysis.characterInfluence} />
            )}
            
            {activeTab === 'biomarkers' && (
              <BiomarkerTracking biomarkers={analysis.comprehensiveAnalysis.biomarkers} />
            )}
          </div>
        )}

        {/* Decision Analysis Modal */}
        <DecisionAnalysisModal
          decision={selectedDecision}
          analysis={analysis}
          onClose={() => setSelectedDecision(null)}
        />
      </div>
    </div>
  );
}
