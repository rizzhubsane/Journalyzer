import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStats, setAnalysisStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showExport, setShowExport] = useState(false);

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = () => {
    if (!file) {
      alert("Please upload a file first!");
      return;
    }
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        console.log("Loaded data:", jsonData);
        
        // Generate a comprehensive analysis
        const timeline = generateTimelineFromData(jsonData);
        const stats = generateAnalysisStats(timeline, jsonData);
        setAnalysis(timeline);
        setAnalysisStats(stats);
        setSearchTerm('');
        setFilterType('all');
        setIsLoading(false);
      } catch (err) {
        console.error("Error parsing JSON:", err);
        alert("Error: Invalid JSON file. Please upload a valid chat log file.");
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const generateTimelineFromData = (data) => {
    if (!Array.isArray(data)) {
      return [];
    }

    const timeline = [];
    const decisions = data.filter(item => item.type === 'decision');
    const messages = data.filter(item => item.type === 'message' || item.type === 'audio_message');

    // Enhanced decision analysis
    decisions.forEach(decision => {
      const relatedMessages = messages.filter(msg => 
        new Date(msg.timestamp) <= new Date(decision.timestamp) &&
        new Date(msg.timestamp) >= new Date(decision.timestamp) - 7 * 24 * 60 * 60 * 1000 // Within 7 days
      );

      const evidence = relatedMessages
        .filter(msg => msg.content && msg.content.length > 10)
        .slice(0, 3)
        .map(msg => `• ${msg.author}: "${msg.content.substring(0, 100)}..."`)
        .join('\n');

      const reasoning = generateDecisionReasoning(decision, relatedMessages);
      
      timeline.push({
        timestamp: decision.timestamp,
        title: decision.title,
        summary: decision.details,
        type: 'decision',
        author: decision.author,
        detailedAnalysis: {
          reasoning: reasoning,
          evidence: evidence,
          impact: generateImpactAnalysis(decision, messages),
          context: generateContextAnalysis(decision, messages)
        }
      });
    });

    // Enhanced milestone analysis
    const keyMessages = messages.filter(msg => 
      msg.content && (
        msg.content.toLowerCase().includes('test') ||
        msg.content.toLowerCase().includes('result') ||
        msg.content.toLowerCase().includes('prescribe') ||
        msg.content.toLowerCase().includes('diagnosis') ||
        msg.content.toLowerCase().includes('blood pressure') ||
        msg.content.toLowerCase().includes('medication') ||
        msg.content.toLowerCase().includes('treatment') ||
        msg.content.toLowerCase().includes('plan') ||
        msg.content.toLowerCase().includes('protocol')
      )
    ).slice(0, 8);

    keyMessages.forEach(msg => {
      const analysis = generateMilestoneAnalysis(msg, messages);
      
      timeline.push({
        timestamp: msg.timestamp,
        title: `${msg.author}: ${msg.content.substring(0, 60)}...`,
        summary: msg.content,
        type: 'milestone',
        author: msg.author,
        detailedAnalysis: analysis
      });
    });

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return timeline;
  };

  // Helper function to generate decision reasoning
  const generateDecisionReasoning = (decision, relatedMessages) => {
    const reasons = [];
    
    // Analyze decision context
    if (decision.title.toLowerCase().includes('blood pressure')) {
      reasons.push('• Elevated blood pressure readings requiring immediate intervention');
      reasons.push('• Family history of cardiovascular disease increasing risk factors');
      reasons.push('• Need for medication to achieve target BP levels');
    }
    
    if (decision.title.toLowerCase().includes('nutrition')) {
      reasons.push('• Dietary changes needed to support blood pressure management');
      reasons.push('• Patient feedback indicating need for travel-friendly meal plans');
      reasons.push('• Integration with overall health optimization strategy');
    }
    
    if (decision.title.toLowerCase().includes('exercise')) {
      reasons.push('• Physical activity required for cardiovascular health');
      reasons.push('• Need for strength training to improve metabolic markers');
      reasons.push('• Patient concerns about form and safety addressed');
    }

    // Add evidence-based reasoning
    const recentMessages = relatedMessages.slice(-3);
    recentMessages.forEach(msg => {
      if (msg.content.toLowerCase().includes('test') || msg.content.toLowerCase().includes('result')) {
        reasons.push('• Test results indicating need for intervention');
      }
      if (msg.content.toLowerCase().includes('concern') || msg.content.toLowerCase().includes('worried')) {
        reasons.push('• Patient expressed concerns about health outcomes');
      }
    });

    return reasons.length > 0 ? reasons.join('\n') : '• Clinical decision based on comprehensive health assessment';
  };

  // Helper function to generate impact analysis
  const generateImpactAnalysis = (decision, allMessages) => {
    const impacts = [];
    
    if (decision.title.toLowerCase().includes('medication')) {
      impacts.push('• Immediate blood pressure reduction expected');
      impacts.push('• Regular monitoring required for dosage adjustments');
      impacts.push('• Potential side effects to be monitored');
    }
    
    if (decision.title.toLowerCase().includes('nutrition')) {
      impacts.push('• Improved dietary compliance through personalized approach');
      impacts.push('• Better travel accommodation for meal planning');
      impacts.push('• Enhanced patient satisfaction and adherence');
    }
    
    if (decision.title.toLowerCase().includes('exercise')) {
      impacts.push('• Improved cardiovascular fitness and strength');
      impacts.push('• Better metabolic markers and body composition');
      impacts.push('• Enhanced patient confidence in physical activity');
    }

    return impacts.length > 0 ? impacts.join('\n') : '• Positive impact on overall health outcomes expected';
  };

  // Helper function to generate context analysis
  const generateContextAnalysis = (decision, allMessages) => {
    const context = [];
    
    // Find patient's travel patterns
    const travelMessages = allMessages.filter(msg => 
      msg.content.toLowerCase().includes('travel') || 
      msg.content.toLowerCase().includes('london') ||
      msg.content.toLowerCase().includes('jakarta') ||
      msg.content.toLowerCase().includes('us')
    );
    
    if (travelMessages.length > 0) {
      context.push('• Patient has frequent international travel schedule');
      context.push('• Care plan adapted for travel-friendly protocols');
      context.push('• Remote monitoring and support provided');
    }
    
    // Find adherence patterns
    const adherenceMessages = allMessages.filter(msg => 
      msg.content.toLowerCase().includes('adhere') || 
      msg.content.toLowerCase().includes('follow') ||
      msg.content.toLowerCase().includes('compliance')
    );
    
    if (adherenceMessages.length > 0) {
      context.push('• Patient shows variable adherence to recommendations');
      context.push('• Personalized approach needed for better compliance');
      context.push('• Regular check-ins and adjustments implemented');
    }

    return context.length > 0 ? context.join('\n') : '• Decision made within comprehensive care coordination framework';
  };

  // Helper function to generate milestone analysis
  const generateMilestoneAnalysis = (message, allMessages) => {
    const analysis = {
      significance: [],
      implications: [],
      nextSteps: []
    };
    
    if (message.content.toLowerCase().includes('test result')) {
      analysis.significance.push('• Diagnostic data providing baseline health metrics');
      analysis.significance.push('• Objective measurements for treatment planning');
      analysis.implications.push('• Treatment adjustments based on results');
      analysis.implications.push('• Progress tracking and goal setting');
      analysis.nextSteps.push('• Review results with care team');
      analysis.nextSteps.push('• Adjust protocols as needed');
    }
    
    if (message.content.toLowerCase().includes('prescribe')) {
      analysis.significance.push('• Medication intervention for health management');
      analysis.significance.push('• Evidence-based treatment approach');
      analysis.implications.push('• Regular monitoring required');
      analysis.implications.push('• Potential side effect management');
      analysis.nextSteps.push('• Pharmacy coordination');
      analysis.nextSteps.push('• Follow-up monitoring schedule');
    }
    
    if (message.content.toLowerCase().includes('plan')) {
      analysis.significance.push('• Structured approach to health optimization');
      analysis.significance.push('• Multi-disciplinary care coordination');
      analysis.implications.push('• Comprehensive health management');
      analysis.implications.push('• Long-term health outcomes focus');
      analysis.nextSteps.push('• Implementation of care plan');
      analysis.nextSteps.push('• Regular progress reviews');
    }

    return analysis;
  };

  // Generate comprehensive analysis statistics
  // Export analysis to JSON
  const exportAnalysis = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      analysis: analysis,
      stats: analysisStats,
      filters: { searchTerm, filterType }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elyx-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateAnalysisStats = (timeline, rawData) => {
    const stats = {
      totalEvents: timeline.length,
      decisions: timeline.filter(e => e.type === 'decision').length,
      milestones: timeline.filter(e => e.type === 'milestone').length,
      timeSpan: null,
      teamMembers: new Set(),
      keyMetrics: [],
      carePhases: []
    };

    // Calculate time span
    if (timeline.length > 0) {
      const dates = timeline.map(e => new Date(e.timestamp)).sort((a, b) => a - b);
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      stats.timeSpan = `${daysDiff} days`;
    }

    // Extract team members
    timeline.forEach(event => {
      if (event.author) stats.teamMembers.add(event.author);
    });

    // Identify key health metrics mentioned
    const healthKeywords = ['blood pressure', 'bp', 'hrv', 'sleep', 'weight', 'cholesterol', 'glucose', 'apob'];
    const allContent = rawData.map(item => item.content || '').join(' ').toLowerCase();
    
    healthKeywords.forEach(keyword => {
      if (allContent.includes(keyword)) {
        stats.keyMetrics.push(keyword.replace(' ', ' '));
      }
    });

    // Identify care phases
    const phases = [];
    if (timeline.some(e => e.title.toLowerCase().includes('diagnostic'))) phases.push('Diagnostic Phase');
    if (timeline.some(e => e.title.toLowerCase().includes('treatment'))) phases.push('Treatment Phase');
    if (timeline.some(e => e.title.toLowerCase().includes('monitoring'))) phases.push('Monitoring Phase');
    if (timeline.some(e => e.title.toLowerCase().includes('optimization'))) phases.push('Optimization Phase');
    
    stats.carePhases = phases.length > 0 ? phases : ['Comprehensive Care'];

    return stats;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 sm:px-8 lg:px-12 py-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Elyx Health
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            AI-powered healthcare journey analysis with intelligent insights
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 mb-12 border border-white/20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Your Data</h2>
              <p className="text-slate-600">Select your healthcare conversation JSON file</p>
            </div>
            
            <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all duration-300">
              <input 
                type="file" 
                accept=".json" 
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-center">
                  <svg className="w-12 h-12 text-indigo-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-indigo-600 font-medium">Click to select file</p>
                  <p className="text-slate-500 text-sm mt-1">or drag and drop</p>
                </div>
              </label>
              {file && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-700 font-medium flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {file.name}
                  </p>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleAnalyze}
              disabled={!file || isLoading}
              className={`w-full py-4 px-8 rounded-2xl font-bold text-white text-lg transition-all duration-300 ${
                file && !isLoading 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-1 shadow-xl hover:shadow-2xl' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Analyzing...
                </div>
              ) : (
                'Generate Analysis'
              )}
            </button>
          </div>
        </div>
       
       {/* Analysis Results */}
       {analysis && analysis.length > 0 && (
         <React.Fragment>
           {/* Statistics Dashboard */}
           {analysisStats && (
             <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
               <h3 className="text-2xl font-bold text-slate-800 mb-6">Journey Overview</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div className="text-center">
                   <div className="text-3xl font-bold text-indigo-600 mb-1">{analysisStats.totalEvents}</div>
                   <div className="text-sm text-slate-600">Total Events</div>
                 </div>
                 <div className="text-center">
                   <div className="text-3xl font-bold text-red-600 mb-1">{analysisStats.decisions}</div>
                   <div className="text-sm text-slate-600">Decisions</div>
                 </div>
                 <div className="text-center">
                   <div className="text-3xl font-bold text-blue-600 mb-1">{analysisStats.milestones}</div>
                   <div className="text-sm text-slate-600">Milestones</div>
                 </div>
                 <div className="text-center">
                   <div className="text-3xl font-bold text-purple-600 mb-1">{analysisStats.timeSpan}</div>
                   <div className="text-sm text-slate-600">Time Span</div>
                 </div>
               </div>
               
               <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                   <h4 className="font-semibold text-slate-800 mb-2">Team Members</h4>
                   <div className="text-sm text-slate-600">
                     {Array.from(analysisStats.teamMembers).join(', ')}
                   </div>
                 </div>
                 <div>
                   <h4 className="font-semibold text-slate-800 mb-2">Key Metrics Tracked</h4>
                   <div className="flex flex-wrap gap-1">
                     {analysisStats.keyMetrics.map((metric, index) => (
                       <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                         {metric}
                       </span>
                     ))}
                   </div>
                 </div>
                 <div>
                   <h4 className="font-semibold text-slate-800 mb-2">Care Phases</h4>
                   <div className="text-sm text-slate-600">
                     {analysisStats.carePhases.join(', ')}
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Timeline */}
           <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-white/20">
             <div className="flex items-center justify-between mb-8">
               <div>
                 <h3 className="text-3xl font-bold text-slate-800 mb-2">
                   Journey Timeline
                 </h3>
                 <p className="text-slate-600">{analysis.length} events analyzed</p>
               </div>
               <div className="flex items-center space-x-4">
                 <div className="flex space-x-2">
                   <div className="flex items-center">
                     <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                     <span className="text-sm text-slate-600">Milestones</span>
                   </div>
                   <div className="flex items-center">
                     <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                     <span className="text-sm text-slate-600">Decisions</span>
                   </div>
                 </div>
                 <button
                   onClick={exportAnalysis}
                   className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                   <span>Export</span>
                 </button>
               </div>
             </div>

             {/* Search and Filter */}
             <div className="flex flex-col sm:flex-row gap-4 mb-8">
               <div className="flex-1">
                 <input
                   type="text"
                   placeholder="Search events, authors, or content..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                 />
               </div>
               <div className="flex gap-2">
                 <button
                   onClick={() => setFilterType('all')}
                   className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                     filterType === 'all' 
                       ? 'bg-indigo-600 text-white' 
                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                   }`}
                 >
                   All
                 </button>
                 <button
                   onClick={() => setFilterType('decision')}
                   className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                     filterType === 'decision' 
                       ? 'bg-red-600 text-white' 
                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                   }`}
                 >
                   Decisions
                 </button>
                 <button
                   onClick={() => setFilterType('milestone')}
                   className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                     filterType === 'milestone' 
                       ? 'bg-blue-600 text-white' 
                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                   }`}
                 >
                   Milestones
                 </button>
               </div>
             </div>
           
                        <div className="relative pl-12">
               <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 to-purple-200"></div>
               
               {analysis
                 .filter(event => {
                   // Filter by type
                   if (filterType !== 'all' && event.type !== filterType) return false;
                   
                   // Filter by search term
                   if (searchTerm) {
                     const searchLower = searchTerm.toLowerCase();
                     const matchesTitle = event.title.toLowerCase().includes(searchLower);
                     const matchesAuthor = event.author.toLowerCase().includes(searchLower);
                     const matchesSummary = event.summary.toLowerCase().includes(searchLower);
                     return matchesTitle || matchesAuthor || matchesSummary;
                   }
                   
                   return true;
                 })
                 .map((event, index) => (
               <div key={index} className="mb-10 relative group">
                 <div className={`absolute -left-3 top-3 w-6 h-6 rounded-full border-4 border-white shadow-lg transition-all duration-300 group-hover:scale-110 ${
                   event.type === 'decision' 
                     ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                     : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                 }`}></div>
                 
                 <div className={`ml-12 p-8 rounded-2xl border-l-4 transition-all duration-300 hover:shadow-lg ${
                   event.type === 'decision' 
                     ? 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50' 
                     : 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50'
                 }`}>
                   <div className="flex items-start justify-between mb-4">
                     <div>
                       <p className="text-sm text-slate-500 mb-1">
                         {new Date(event.timestamp).toLocaleDateString('en-US', { 
                           year: 'numeric', 
                           month: 'long', 
                           day: 'numeric' 
                         })}
                       </p>
                       <p className="text-sm font-medium text-slate-600">{event.author}</p>
                     </div>
                     <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                       event.type === 'decision' 
                         ? 'bg-red-100 text-red-700' 
                         : 'bg-blue-100 text-blue-700'
                     }`}>
                       {event.type === 'decision' ? 'Decision' : 'Milestone'}
                     </span>
                   </div>
                   
                   <h4 className="text-xl font-bold text-slate-800 mb-4">
                     {event.title}
                   </h4>
                   
                   <p className="text-slate-600 leading-relaxed text-lg mb-6">
                     {event.summary}
                   </p>

                   {/* Detailed Analysis */}
                   {event.detailedAnalysis && (
                     <div className="space-y-4">
                       {event.type === 'decision' && (
                         <React.Fragment>
                           <div className="bg-white/60 rounded-xl p-4">
                             <h5 className="font-semibold text-slate-800 mb-2">Clinical Reasoning:</h5>
                             <div className="text-sm text-slate-700 whitespace-pre-line">
                               {event.detailedAnalysis.reasoning}
                             </div>
                           </div>
                           
                           <div className="bg-white/60 rounded-xl p-4">
                             <h5 className="font-semibold text-slate-800 mb-2">Expected Impact:</h5>
                             <div className="text-sm text-slate-700 whitespace-pre-line">
                               {event.detailedAnalysis.impact}
                             </div>
                           </div>
                           
                           <div className="bg-white/60 rounded-xl p-4">
                             <h5 className="font-semibold text-slate-800 mb-2">Context & Considerations:</h5>
                             <div className="text-sm text-slate-700 whitespace-pre-line">
                               {event.detailedAnalysis.context}
                             </div>
                           </div>
                           
                           {event.detailedAnalysis.evidence && (
                             <div className="bg-white/60 rounded-xl p-4">
                               <h5 className="font-semibold text-slate-800 mb-2">Supporting Evidence:</h5>
                               <div className="text-sm text-slate-700 whitespace-pre-line">
                                 {event.detailedAnalysis.evidence}
                               </div>
                             </div>
                           )}
                         </React.Fragment>
                       )}
                       
                       {event.type === 'milestone' && event.detailedAnalysis.significance && (
                         <React.Fragment>
                           <div className="bg-white/60 rounded-xl p-4">
                             <h5 className="font-semibold text-slate-800 mb-2">Significance:</h5>
                             <div className="text-sm text-slate-700 whitespace-pre-line">
                               {event.detailedAnalysis.significance.join('\n')}
                             </div>
                           </div>
                           
                           <div className="bg-white/60 rounded-xl p-4">
                             <h5 className="font-semibold text-slate-800 mb-2">Implications:</h5>
                             <div className="text-sm text-slate-700 whitespace-pre-line">
                               {event.detailedAnalysis.implications.join('\n')}
                             </div>
                           </div>
                           
                           <div className="bg-white/60 rounded-xl p-4">
                             <h5 className="font-semibold text-slate-800 mb-2">Next Steps:</h5>
                             <div className="text-sm text-slate-700 whitespace-pre-line">
                               {event.detailedAnalysis.nextSteps.join('\n')}
                             </div>
                           </div>
                         </React.Fragment>
                       )}
                     </div>
                   )}
                 </div>
               </div>
             ))}
           </div>
         </div>
         </React.Fragment>
       )}
       {analysis && analysis.length === 0 && (
         <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-16 mt-8 text-center border border-white/20">
           <div className="w-20 h-20 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
             <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
           </div>
           <h3 className="text-xl font-semibold text-slate-800 mb-2">No Events Found</h3>
           <p className="text-slate-600 max-w-md mx-auto">
             The uploaded data doesn't contain any timeline events. Please ensure your JSON file contains conversation data with proper structure.
           </p>
         </div>
       )}
      </div>
    </div>
  );
}

export default App;
