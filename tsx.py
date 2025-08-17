import os
import json
import random
import uuid
from datetime import datetime, timedelta
import time
import asyncio

# NOTE: You need to install these libraries:
# pip install -q -U google-generativeai aiofiles
import google.generativeai as genai


# --- CONFIGURATION ---
# IMPORTANT: Add your Gemini API Key here
# You can get one from Google AI Studio: https://aistudio.google.com/
API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY_HERE")

# --- RATE LIMITING SETTINGS (ADJUST THESE IF NEEDED) ---
# Free tier: 15 requests per minute (RPM) = 1 request every 4 seconds
# Paid tier: 1500 requests per minute
API_DELAY_SECONDS = 5  # Delay between API calls (increase if you hit rate limits)
MAX_RETRIES = 3        # Number of retries on API failure
RETRY_DELAY = 10       # Seconds to wait before retrying on failure

# --- SAFETY SETTINGS ---
SAVE_INTERVAL = 5      # Save progress every N messages

# Configure the Gemini API client
try:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("Gemini API configured successfully.")
    print(f"Using {API_DELAY_SECONDS}s delay between API calls for rate limiting.")
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    print("Please ensure you have set a valid API_KEY.")
    model = None

# --- Define output paths in the Elyx project directory ---
output_dir = os.path.dirname(os.path.abspath(__file__))  # Current script directory
OUTPUT_FILENAME = os.path.join(output_dir, "journey_data.json")

SIMULATION_START_DATE = datetime(2025, 1, 15)
SIMULATION_MONTHS = 8



# --- AGENT PERSONAS ---
PERSONAS = {
    "Rohan Patel": {
        "role": "Member",
        "prompt": "You are Rohan Patel, a 46-year-old Regional Head of Sales. You are analytical, driven, and value efficiency. Your father had a heart attack in his early 50s, which is your core motivation. You are direct, concise, tech-savvy, and data-driven. You can be impatient. You travel 1 week/month and adhere to plans ~50% of the time. You are managing high blood pressure. Your responses must ONLY be the message content."
    },
    "Ruby": {
        "role": "Concierge",
        "prompt": "You are Ruby, the Elyx Concierge. You are the master of coordination, scheduling, and logistics. You are empathetic, incredibly organized, and proactive. Your tone is warm, professional, and reassuring. You confirm every action. Your responses must ONLY be the message content."
    },
    "Dr. Warren": {
        "role": "Medical Strategist",
        "prompt": "You are Dr. Warren, the team's physician. You are authoritative, precise, and scientific. You interpret lab results and set medical direction. Your communication is clinical and evidence-based. Your responses must ONLY be the message content."
    },
    "Advik": {
        "role": "Performance Scientist",
        "prompt": "You are Advik, the Performance Scientist. You are an expert in wearable data (Whoop, Garmin). You are analytical, curious, and pattern-oriented. You talk in terms of hypotheses, experiments, and data-driven insights. Your responses must ONLY be the message content."
    },
    "Carla": {
        "role": "Nutritionist",
        "prompt": "You are Carla, the Nutritionist. You design nutrition plans and analyze food logs/CGM data. You are practical, educational, and focused on behavioral change. You always explain the 'why'. Your responses must ONLY be the message content."
    },
    "Rachel": {
        "role": "PT / Physiotherapist",
        "prompt": "You are Rachel, the PT. You manage everything related to physical movement. You are direct, encouraging, and focused on form and function. Your communication is motivating and action-oriented. Your responses must ONLY be the message content."
    }
}

class ConversationSimulator:
    """Manages the conversation history and agent interactions with audio generation."""
    def __init__(self):
        self.history = []

    async def add_entry(self, entry_type, author, content, timestamp, **kwargs):
        """Adds a message or decision to the history."""
        entry_id_prefix = ''.join(filter(str.isalnum, author)).lower()
        entry = {
            "id": f"{entry_id_prefix}_{uuid.uuid4().hex[:6]}",
            "type": entry_type,
            "timestamp": timestamp.isoformat() + "Z",
            "author": author,
            "authorRole": PERSONAS.get(author, {}).get("role", "System"),
        }

        if entry_type == 'decision':
            entry['title'] = content
            entry.update(kwargs)
        else: # Regular message
            entry['content'] = content
            entry.update(kwargs)

        self.history.append(entry)
        await self.save_to_json()
        return entry



    def get_formatted_history(self):
        """Formats the history for the AI prompt."""
        formatted_string = "--- Conversation History ---\n"
        for entry in self.history:
            content_key = 'title' if entry['type'] == 'decision' else 'content'
            formatted_string += f"[{entry['timestamp']}] {entry['author']}: {entry.get(content_key, '')}\n"
        return formatted_string

    async def save_to_json(self):
        """Saves the conversation history to a JSON file asynchronously."""
        try:
            # Using async file writing just for consistency in an async script
            import aiofiles
            async with aiofiles.open(OUTPUT_FILENAME, 'w') as f:
                await f.write(json.dumps(self.history, indent=2))
        except Exception as e:
            print(f"\n--- ERROR SAVING FILE: {e} ---\n")

    async def generate_response(self, agent_name, instruction):
        """Generates a response from a specific agent using the Gemini API."""
        if not model or API_KEY == "YOUR_API_KEY_HERE":
            return f"Placeholder response for {agent_name}: {instruction}"

        prompt = f"{PERSONAS[agent_name]['prompt']}\n\n{self.get_formatted_history()}\n\n--- Your Task ---\nYour instruction is: \"{instruction}\"\nYour response must ONLY be the message content."
        
        for attempt in range(MAX_RETRIES):
            try:
                print(f"🤖 Generating response for {agent_name} (attempt {attempt + 1}/{MAX_RETRIES})...")
                response = await model.generate_content_async(prompt)
                if response.text:
                    print(f"✅ Success: {agent_name}")
                    return response.text.strip()
                else:
                    print(f"⚠️  API returned empty response for {agent_name}")
                    if attempt < MAX_RETRIES - 1:
                        print(f"⏳ Waiting {RETRY_DELAY}s before retry...")
                        await asyncio.sleep(RETRY_DELAY)
            except Exception as e:
                print(f"❌ Error calling Gemini API for {agent_name}: {e}")
                if attempt < MAX_RETRIES - 1:
                    print(f"⏳ Waiting {RETRY_DELAY}s before retry...")
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    return f"Error calling Gemini API after {MAX_RETRIES} attempts: {e}"
        
        return f"Error: API returned no text for: {instruction}"

class SimulationSupervisor:
    """Directs the narrative flow of the simulation."""
    def __init__(self, simulator):
        self.sim = simulator
        self.current_date = SIMULATION_START_DATE
        self.total_messages = 0
        self.completed_messages = 0

    async def run(self):
        """Starts and runs the entire 8-month simulation."""
        print("--- Starting 8-Month Data-Rich Simulation ---")
        print(f"Output will be saved to: {OUTPUT_FILENAME}")
        print(f"API Delay: {API_DELAY_SECONDS}s between calls")
        print(f"Max Retries: {MAX_RETRIES}")
        print("="*60)
        
        # Count total messages for progress tracking
        self._count_total_messages()
        
        try:
            await self.run_month_1()
            await self.run_month_2()
            await self.run_month_3()
            await self.run_month_4()
            await self.run_month_5()
            await self.run_month_6()
            await self.run_month_7()
            await self.run_month_8()
            
            print(f"\n--- Simulation Complete ---")
            print(f"Generated {len(self.sim.history)} entries.")
            print(f"Data saved to {OUTPUT_FILENAME}")
        except KeyboardInterrupt:
            print(f"\n⚠️  Simulation interrupted by user.")
            print(f"Progress saved: {len(self.sim.history)} entries generated.")
            print(f"Data saved to {OUTPUT_FILENAME}")
        except Exception as e:
            print(f"\n❌ Simulation failed with error: {e}")
            print(f"Progress saved: {len(self.sim.history)} entries generated.")
            print(f"Data saved to {OUTPUT_FILENAME}")
            raise

    async def _get_response(self, agent, instruction, delay_hours=0, delay_days=0):
        """Helper to generate response and advance time."""
        self.current_date += timedelta(days=delay_days, hours=random.uniform(1, delay_hours if delay_hours > 1 else 2))
        response_text = await self.sim.generate_response(agent, instruction)
        print(f"[{self.current_date.strftime('%Y-%m-%d %H:%M')}] {agent}: {response_text}")
        await self.sim.add_entry('message', agent, response_text, self.current_date)
        
        # Update progress
        self.completed_messages += 1
        progress = (self.completed_messages / self.total_messages) * 100
        print(f"📊 Progress: {self.completed_messages}/{self.total_messages} ({progress:.1f}%)")
        
        # Auto-save every few messages
        if self.completed_messages % SAVE_INTERVAL == 0:
            print("💾 Auto-saving progress...")
            await self.sim.save_to_json()
        
        # Rate limiting delay between API calls
        print(f"⏳ Waiting {API_DELAY_SECONDS}s for rate limiting...")
        await asyncio.sleep(API_DELAY_SECONDS)

    def _count_total_messages(self):
        """Count total messages to be generated for progress tracking."""
        # This is a rough estimate based on the script structure
        # Month 1: ~3 messages
        # Month 2: ~4 messages  
        # Month 3: ~6 messages
        # Month 4: ~3 messages
        # Month 5: ~4 messages
        # Month 6: ~4 messages
        # Month 7: ~3 messages
        # Month 8: ~4 messages
        # Total: ~31 messages
        self.total_messages = 31
        print(f"📋 Total messages to generate: {self.total_messages}")

    async def _add_decision(self, author, title, details, referenced_ids):
        """Helper to add a structured decision."""
        self.current_date += timedelta(days=1)
        print(f"\n>>> DECISION by {author}: {title}\n")
        await self.sim.add_entry(
            'decision', author, title, self.current_date,
            details=details, referencedMessageIds=referenced_ids
        )
    
    # --- DATA-RICH NARRATIVE SCRIPT ---
    
    async def run_month_1(self):
        print("\n--- Month 1: Onboarding & Initial Concerns ---")
        await self._get_response("Rohan Patel", "Send your first message. Express your core concerns about your Garmin data and family history.", delay_hours=1)
        await self._get_response("Ruby", "Provide an empathetic and organized response. Acknowledge his concern and tell him the immediate next step is getting Dr. Warren to review.", delay_hours=1)
        await self._get_response("Dr. Warren", "Reviewing the initial data, state the need for a full diagnostic panel to get a clear baseline.", delay_days=1)

    async def run_month_2(self):
        print("\n--- Month 2: First Diagnostic Results ---")
        await self._get_response("Ruby", "Inform Rohan that the results from his first diagnostic panel are in and Dr. Warren will share a summary.", delay_days=25)
        msg1 = self.sim.history[-1]['id']
        await self._get_response("Dr. Warren", "Share the key findings with specific numbers: His blood pressure is high at 145/95. His ApoB is elevated at 115 mg/dL, and his hs-CRP (inflammation marker) is 3.2 mg/L.", delay_hours=2)
        msg2 = self.sim.history[-1]['id']
        await self._get_response("Rohan Patel", "Those numbers are concerning. What's the immediate plan to address this?", delay_hours=1)
        msg3 = self.sim.history[-1]['id']
        await self._add_decision(
            "Dr. Warren", "Initiate Hypertension & Lipid Protocol",
            "Prescribed Lisinopril 5mg for BP. Initiating nutrition plan with Carla to target ApoB and hs-CRP.",
            [msg1, msg2, msg3]
        )

    async def run_month_3(self):
        print("\n--- Month 3: Adherence, Travel & First Updates ---")
        await self._get_response("Carla", "Hi Rohan, here is the initial nutrition plan. It's a Mediterranean-style diet to lower ApoB and inflammation.", delay_days=10)
        await self._get_response("Rohan Patel", "This looks difficult to follow with my travel to London next week. I can't commit to this 100%. This is an example of the 50% adherence issue.", delay_days=2)
        await self._get_response("Carla", "Understood. Let's adapt. I'll create a 'Travel Appendix' with simple rules and go-to meal options you can find in any city, focusing on lean protein and fiber.", delay_hours=3)
        await self._get_response("Rachel", "Rohan, it's been two weeks. I'm updating your foundational workout plan to include some light dumbbell work now. The new plan is in your app.", delay_days=1)
        await self._get_response("Advik", "Weekly Report: Great consistency this week, Rohan. You hit 3/3 planned workouts. Your resting heart rate is already trending down by an average of 2bpm.", delay_days=4)
        await self._get_response("Rohan Patel", "Heads up, I'm traveling to London for 8 days starting next week.", delay_days=3)
        await self._get_response("Rachel", "Thanks for the heads up, Rohan. I'll create a hotel-gym friendly version of your workout plan. It will focus on bodyweight and dumbbell exercises.", delay_hours=4)

    async def run_month_4(self):
        print("\n--- Month 4: Second Diagnostic & Progress Check ---")
        await self._get_response("Ruby", "Hi Rohan, it's time for your 3-month follow-up diagnostic panel to check our progress.", delay_days=25)
        await self._get_response("Dr. Warren", "Rohan, the results are in. Excellent progress. Your blood pressure is down to 130/85, ApoB has improved to 98 mg/dL, and hs-CRP is down to 1.5 mg/L. The plan is working.", delay_days=15)
        msg1 = self.sim.history[-1]['id']
        await self._add_decision(
            "Dr. Warren", "Continue Protocol & Introduce VO2 Max Testing",
            "Lifestyle changes and medication are effective. Continue current plan. Next, we will establish a VO2 Max baseline to optimize cardiovascular fitness.",
            [msg1]
        )

    async def run_month_5(self):
        print("\n--- Month 5: VO2 Max & Fitness Focus ---")
        await self._get_response("Ruby", "Rohan, Advik would like you to do a VO2 Max test to get a baseline for your cardiovascular fitness. I can schedule it at a top sports lab.", delay_days=10)
        await self._get_response("Rohan Patel", "Book it.", delay_hours=1)
        await self._get_response("Rachel", "It's been another two weeks. I'm updating your strength plan to increase the reps on your main lifts. We're building endurance now.", delay_days=4)
        await self._get_response("Advik", "The VO2 Max results are in. Your score is 35 ml/kg/min, which is average for your age. Our goal for the next 6 months is to get this into the 'excellent' category, above 42. I'm updating your cardio plan to include targeted interval training.", delay_days=7)
        msg1 = self.sim.history[-1]['id']
        await self._add_decision(
            "Advik", "Implement VO2 Max Improvement Plan",
            "Based on a VO2 Max score of 35, the cardio regimen will now include one weekly session of high-intensity interval training (HIIT) to drive improvement.",
            [msg1]
        )

    async def run_month_6(self):
        print("\n--- Month 6: CGM Implementation & Insights ---")
        await self._get_response("Dr. Warren", "To further refine your nutrition plan for ApoB, I recommend a Continuous Glucose Monitor (CGM) for two weeks. It will give us invaluable data.", delay_days=20)
        await self._get_response("Rohan Patel", "I'm interested. Let's do it.", delay_hours=2)
        await self._get_response("Advik", "Weekly Report: Your first week with the CGM has been insightful. We've also seen your sleep consistency improve by 10% this week. Keep it up.", delay_days=5)
        await self._get_response("Rohan Patel", "This CGM is fascinating. I had sushi for lunch and my glucose shot up to 180 mg/dL. I thought that was healthy.", delay_days=10)
        msg1 = self.sim.history[-1]['id']
        await self._get_response("Carla", "A very common finding! Let's run an experiment: next time, start the meal with edamame first to blunt the glucose spike. We'll compare the data.", delay_hours=3)
        msg2 = self.sim.history[-1]['id']
        await self._add_decision(
            "Carla", "Modify Meal Sequencing Based on CGM Data",
            "CGM data revealed a significant glucose spike after eating sushi. The new protocol is to preface carbohydrate-heavy meals with a fiber/protein source (like edamame) to manage glycemic response.",
            [msg1, msg2]
        )

    async def run_month_7(self):
        print("\n--- Month 7: Data-Driven Wearable Insights ---")
        await self._get_response("Rachel", "Two weeks have passed. Time for a plan update. I'm swapping your dumbbell lunges for barbell squats to increase the load. Check the app for a form tutorial video.", delay_days=10)
        await self._get_response("Advik", "Rohan, I was analyzing your wearable data. Your average HRV has increased from a baseline of 42ms to 55ms this month. This is a fantastic sign of improved resilience.", delay_days=15)
        await self._get_response("Rohan Patel", "That's great to see quantified. I do feel less stressed overall.", delay_hours=2)

    async def run_month_8(self):
        print("\n--- Month 8: Long-Term Outlook ---")
        await self._get_response("Advik", "Final Weekly Report for this period: Your consistency with the new HIIT sessions has been 100%. This is directly contributing to the positive trend in your HRV. Excellent work.", delay_days=20)
        await self._get_response("Dr. Warren", "Rohan, as we close out these 8 months, your key biomarkers are all trending strongly in the right direction. Your blood pressure is well-managed, and your cardiovascular risk profile has significantly improved.", delay_days=5)
        await self._get_response("Rohan Patel", "Excellent. I feel the difference. I'm ready to discuss the long-term longevity strategy.", delay_hours=3)
        await self._get_response("Ruby", "That's wonderful to hear. I'm scheduling the comprehensive progress review to outline the strategy for the next year.", delay_hours=1)


# --- MAIN EXECUTION ---
if __name__ == "__main__":
    if API_KEY == "YOUR_API_KEY_HERE" or not model:
        print("="*50)
        print("!!! WARNING: Gemini API Key is not set. !!!")
        print("The script will run in offline mode with placeholder text.")
        print("Please edit the script and add your API key to generate real conversations.")
        print("="*50)
    
    simulator = ConversationSimulator()
    supervisor = SimulationSupervisor(simulator)
    asyncio.run(supervisor.run())
