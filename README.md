

# Elyx Health Journey Visualizer (Hackathon Submission)

## Codebase Overview
This repository contains a complete solution for visualizing and analyzing an 8-month health journey for a client, Rohan Patel, as required by the hackathon problem statement. The project is divided into two main parts:

- **Data Generation (Python):** Simulates a realistic chat log using `tsx.py`.
- **Web Application (React):** Analyzes and visualizes the journey, with interactive features and decision explanations.

### Main Files & Structure
- `tsx.py`: Python script to generate the chat log (`journey_data.json`).
- `journey_data.json`: Output data file containing the simulated health journey.
- `src/`: Contains all frontend React code for the web app.
- `src/enhancedAnalyzer.js`: Core analysis engine for structuring data and generating explanations.
- `.env`: Store your Gemini API key here (if needed for local testing).



## Approach & Solution
### Problem Statement
**Project Goal:** Build a web application that visualizes an 8-month health journey for a client named Rohan Patel. The primary feature is to explain "Why" any key decision (like a new medication or therapy) was made by tracing it back to the specific chat messages or data points that caused it.

### My Approach
1. **Data Simulation:** Used Generative AI to create a rich, constraint-driven chat log for Rohan and his health team, covering all required events and behaviors.
2. **Analysis Engine:** Built a multi-stage analyzer to extract key decisions, milestones, and causal relationships from the chat log.
3. **Interactive Visualization:** Developed a React web app to display the journey, allow users to click decisions, and see clear "Why" explanations with supporting evidence.
4. **Metrics Tracking:** Automatically calculates and displays internal metrics (consults per doctor, adherence, biomarker trends, etc.).



## How to Use This Codebase

### 1. Generate the Data
Run the Python script to simulate the health journey:
```bash
python tsx.py
```
This will create `journey_data.json` containing the full 8-month chat log.

### 2. Start the Web App
Install dependencies and run the development server:
```bash
npm install
npm run dev
```

### 3. Analyze & Visualize
Open the web app in your browser, upload `journey_data.json`, and explore:
- The interactive timeline of events and decisions
- Clickable "Why" explanations for every key decision
- Internal metrics and team analysis

### 4. Environment Variables
If you need to use the Gemini API, add your key to a `.env` file:
```env
GEMINI_API_KEY=YOUR_API_KEY_HERE
```



## How This Submission Meets the Hackathon Requirements
- **Generate Data:** `tsx.py` creates a comprehensive, constraint-driven chat log for Rohan Patel and his health team.
- **Build a Web App:** The React-based app (see `src/`) ingests the JSON log and provides rich, interactive visualizations.
- **Visualize the Journey:** Timeline, causal chains, and decision trees make the journey easy to explore.
- **Implement the "Why" Feature:** Every key decision is clickable, showing the reasoning and supporting evidence from the chat.
- **Track Internal Metrics:** The app automatically calculates and displays metrics derived from the chat log.


---



## Key Features

- **Realistic Data Simulation:** 8-month chat log with all required constraints and events.
- **Interactive Timeline:** Visualizes the journey, milestones, and decisions.
- **"Why" Explanations:** Clickable decisions show the reasoning and evidence from the chat.
- **Internal Metrics:** Tracks consults per doctor, adherence, biomarker trends, and more.
- **Team & Event Analysis:** Drill-down into team contributions and event impacts.





## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd elyx
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Generate the chat log**
   ```bash
   python tsx.py
   ```
4. **Run the development server**
   ```bash
   npm run dev
   ```
5. **Upload and analyze**
   - Open the web app in your browser
   - Upload `journey_data.json`
   - Explore the journey, decisions, and metrics




## How It Works

### Data Generation
- `tsx.py` uses Generative AI to simulate a full 8-month health journey, including all required constraints and events.

### Analysis Pipeline
1. **Data Structuring:** Raw chat log is parsed and organized into messages, decisions, milestones, and metrics.
2. **Comprehensive Analysis:** Key decisions and events are extracted, with causal relationships mapped.
3. **Causal Roadmap:** Visualizes how decisions and events influence each other over time.
4. **Interactive Exploration:** Users can click on decisions to see "Why" explanations, evidence, and context.




## Usage Summary

1. **Generate Data:**
   - Run `python tsx.py` to create the 8-month chat log for Rohan Patel and his health team.
2. **Analyze & Visualize:**
   - Start the web app (`npm run dev`), upload the generated JSON, and explore the journey.
3. **Explore Features:**
   - Click decisions for "Why" explanations, view metrics, and drill down into team and event details.




## Technical Architecture

- **Data Generation:** `tsx.py` (Python) simulates the full journey and outputs `journey_data.json`.
- **Frontend:** React app (`src/`) for uploading, analyzing, and visualizing the journey.
- **Analysis Engine:** `src/enhancedAnalyzer.js` structures data, generates explanations, and links decisions to evidence.
- **Visualization:** Timeline, decision trees, causal chains, and metrics dashboard.



## Example Outputs

### Timeline Event
```json
{
   "timestamp": "2025-01-15T10:00:00Z",
   "title": "Blood Pressure Management Initiated",
   "summary": "Lisinopril prescribed due to elevated readings",
   "type": "decision",
   "evidence": "BP readings 145/95, family history of heart disease"
}
```

### Decision Tree
```json
{
   "decision": "Prescribe Lisinopril",
   "causes": ["Elevated BP readings", "Family history", "Risk assessment"],
   "effects": ["BP reduction", "Cardiovascular risk mitigation"],
   "evidence": "Clinical guidelines, patient history"
}
```

### Causal Chain
```
Initial Consultation → Diagnostic Tests → Elevated BP Detection → Medication Prescription → Lifestyle Changes → BP Improvement
```



## UI Features

- Responsive design for desktop and mobile
- Interactive timeline and decision drill-downs
- Tabbed interface for analysis types
- Real-time loading and error handling
- Clean, modern styling



## Example Analysis

**Clicking a decision reveals:**
- Context and rationale
- Evidence from chat history
- Alternatives considered
- Impact on the journey
- Team member contributions
- Timeline placement

**Causal Roadmap:**
- Initial conditions
- Decision points and rationale
- Causal links and outcomes
- Feedback loops and adaptations



## Performance

- Handles large conversations (up to 2M tokens)
- Efficient, structured data processing
- Caching for repeated analysis
- Progressive loading for user feedback



## Customization

- Extend `EnhancedAnalyzer` for new analysis types
- Add new UI components and tabs
- Modify prompt templates for custom reasoning



## Troubleshooting

- **API Key:** Set `GEMINI_API_KEY` in `.env` if needed
- **Large Files:** Handles up to 2M tokens; chunk if needed
- **Timeouts:** Analysis may take 30-60 seconds



## Future Enhancements

- RAG integration for multi-patient analysis
- Domain-specific model fine-tuning
- Real-time updates and live analysis
- Advanced graph-based visualizations
- Export capabilities (PDF, data)



## License

MIT License



## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Note:** This submission is designed to fully address the hackathon problem statement, with clear data generation, journey visualization, and "Why" explanations for every key decision.
