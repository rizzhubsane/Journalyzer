// Enhanced Healthcare Journey Analyzer
// Uses structured data preparation and multi-stage analysis

import { CONFIG } from './config';

export class EnhancedAnalyzer {
  constructor(apiKey = null) {
    this.apiKey = apiKey || CONFIG.GEMINI_API_KEY;
    this.apiUrl = `${CONFIG.GEMINI_API_URL}?key=${this.apiKey}`;
  }

  // Step 1: Structure the raw conversation data
  structureConversationData(rawChatLog) {
    const structured = {
      messages: [],
      decisions: [],
      characters: new Set(),
      timeline: [],
      healthMetrics: [],
      characterInteractions: []
    };

    rawChatLog.forEach(entry => {
      // Extract basic message data
      if (entry.type === 'message' || entry.type === 'audio_message') {
        structured.messages.push({
          id: entry.id,
          timestamp: entry.timestamp,
          author: entry.author,
          authorRole: entry.authorRole,
          content: entry.content,
          type: entry.type
        });
        structured.characters.add(entry.author);
      }

      // Extract decisions
      if (entry.type === 'decision') {
        structured.decisions.push({
          id: entry.id,
          timestamp: entry.timestamp,
          author: entry.author,
          title: entry.title,
          details: entry.details,
          referencedMessageIds: entry.referencedMessageIds || []
        });
      }

      // Extract timeline events
      structured.timeline.push({
        id: entry.id,
        timestamp: entry.timestamp,
        type: entry.type,
        author: entry.author,
        title: entry.type === 'decision' ? entry.title : null,
        content: entry.type === 'decision' ? entry.details : entry.content
      });
    });

    // Sort by timestamp
    structured.timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    structured.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    structured.decisions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return structured;
  }

  // Step 2: Generate comprehensive analysis
  async generateComprehensiveAnalysis(structuredData) {
    const prompt = `
You are an expert healthcare journey analyst. Analyze this structured healthcare conversation data and provide a comprehensive analysis.

STRUCTURED DATA:
${JSON.stringify(structuredData, null, 2)}

ANALYSIS REQUIREMENTS:

1. TIMELINE ANALYSIS:
   - Extract 8-12 key chronological events
   - Include both milestones and decisions
   - Provide clear timestamps and descriptions

2. DECISION TREES:
   - For each decision, identify the causal factors
   - Map the "why" behind each decision
   - Show the evidence that led to each choice

3. CAUSAL CHAINS:
   - Identify "A → B → C" relationships
   - Show how events influenced subsequent decisions
   - Map the progression of health interventions

4. CHARACTER INFLUENCE:
   - Analyze how each team member contributed
   - Show decision-making patterns by role
   - Identify key moments of collaboration

5. BIOMARKER TRACKING:
   - Extract health metrics mentioned
   - Show trends over time
   - Connect metrics to decisions

6. RISK ASSESSMENTS:
   - Identify factors that influenced decisions
   - Show risk mitigation strategies
   - Map decision rationale

Return your analysis as a structured JSON object with these sections:
{
  "timeline": [{"timestamp": "...", "title": "...", "summary": "...", "type": "milestone|decision", "evidence": "..."}],
  "decisionTrees": [{"decision": "...", "causes": ["..."], "effects": ["..."], "evidence": "..."}],
  "causalChains": [{"chain": "A → B → C", "explanation": "..."}],
  "characterInfluence": [{"character": "...", "contributions": ["..."], "keyMoments": ["..."]}],
  "biomarkers": [{"metric": "...", "trend": "...", "decisions": ["..."]}],
  "riskFactors": [{"factor": "...", "impact": "...", "mitigation": "..."}]
}

Ensure all timestamps are in ISO format and all evidence is directly traceable to the conversation data.
`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      let responseText = data.candidates[0].content.parts[0].text;
      
      // Clean up the response to ensure it's valid JSON
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Analysis generation failed:', error);
      throw error;
    }
  }

  // Step 3: Generate focused decision analysis
  async generateDecisionAnalysis(decision, comprehensiveAnalysis) {
    const prompt = `
You are a medical analyst for Elyx Health. Your task is to explain the reasoning behind a clinical decision based on a provided conversation history.

**Conversation History:**
${JSON.stringify(comprehensiveAnalysis, null, 2)}

**Decision to Analyze:**
Title: "${decision.title}"
Summary: "${decision.details || decision.summary || ''}"
Timestamp: ${decision.timestamp}

**Your Task:**
Your response must be structured in the following way:

1.  **Summary:** Start with a single, concise sentence that summarizes the primary reason for this decision.
2.  **Evidence:** Provide a bulleted list of the key messages or data points from the chat history that serve as direct evidence. Quote the original messages where possible to support your analysis.
`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Decision analysis failed:', error);
      throw error;
    }
  }

  // Step 4: Generate causal roadmap
  async generateCausalRoadmap(comprehensiveAnalysis) {
    const prompt = `
Based on this comprehensive healthcare journey analysis:

${JSON.stringify(comprehensiveAnalysis, null, 2)}

Create a detailed causal roadmap showing how decisions and events influenced each other.

Structure this as a visual roadmap with:

1. INITIAL CONDITIONS: What started the journey?
2. DECISION POINTS: Each major decision with its rationale
3. CAUSAL LINKS: How each decision led to the next
4. OUTCOMES: The results of each decision
5. FEEDBACK LOOPS: How outcomes influenced subsequent decisions

Format as a structured roadmap with clear progression and evidence for each connection.
`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Roadmap generation failed:', error);
      throw error;
    }
  }

  // Step 5: Answer specific questions
  async answerSpecificQuestion(question, comprehensiveAnalysis) {
    const prompt = `
Based on this comprehensive healthcare journey analysis:

${JSON.stringify(comprehensiveAnalysis, null, 2)}

Answer this specific question: "${question}"

Provide a detailed answer that includes:
- Direct evidence from the analysis
- Causal reasoning
- Timeline context
- Character involvement
- Supporting data points

Structure your response with clear sections and cite specific evidence from the analysis.
`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Question answering failed:', error);
      throw error;
    }
  }

  // Main analysis pipeline
  async analyzeHealthcareJourney(rawChatLog) {
    try {
      console.log('Step 1: Structuring conversation data...');
      const structuredData = this.structureConversationData(rawChatLog);
      
      console.log('Step 2: Generating comprehensive analysis...');
      const comprehensiveAnalysis = await this.generateComprehensiveAnalysis(structuredData);
      
      console.log('Step 3: Generating causal roadmap...');
      const causalRoadmap = await this.generateCausalRoadmap(comprehensiveAnalysis);
      
      return {
        structuredData,
        comprehensiveAnalysis,
        causalRoadmap,
        rawChatLog
      };
    } catch (error) {
      console.error('Analysis pipeline failed:', error);
      throw error;
    }
  }
}
