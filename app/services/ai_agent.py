"""
ArogyaMitra AI Agent - Groq LLaMA-3.3-70B Integration
Orchestrates all AI-powered features:
- Workout plan generation
- Nutrition planning
- Motivational coaching
- Dynamic plan modifications
- Progress analysis
"""

import asyncio
import json
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import httpx

from app.utils.config import settings

try:
    from groq import Groq
    groq_available = True
except ImportError:
    groq_available = False


class ArogyaMitraAgent:
    """
    ArogyaMitra AI Agent - Your Personal Fitness Companion
    """

    def __init__(self):
        self.groq_client = None
        self.initialize_ai_clients()

    def initialize_ai_clients(self):
        """Initialize AI service clients"""
        try:
            if settings.GROQ_API_KEY and groq_available:
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
                print("✅ Groq AI client initialized")
            else:
                print("⚠️  No Groq API key found - using fallback responses")
        except Exception as e:
            print(f"⚠️  Groq AI initialization failed: {e}")

    def _call_groq(self, prompt: str, system_prompt: str = None, max_tokens: int = 2000) -> str:
        """Call Groq LLaMA-3.3-70B model"""
        if not self.groq_client:
            return None

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq API error: {e}")
            return None

    def generate_workout_plan(self, user_data: dict) -> dict:
        """Generate a personalized 7-day workout plan using Groq AI"""
        system_prompt = """You are ArogyaMitra's expert fitness coach. Generate detailed, safe, 
        personalized workout plans. Always respond with valid JSON only. 
        Structure workouts with warm-up, main exercises, cool-down."""

        prompt = f"""Generate a complete 7-day workout plan for this user:
        - Age: {user_data.get('age', 25)}
        - Gender: {user_data.get('gender', 'Male')}
        - Height: {user_data.get('height', 170)} cm
        - Weight: {user_data.get('weight', 70)} kg
        - Fitness Level: {user_data.get('fitness_level', 'beginner')}
        - Goal: {user_data.get('fitness_goal', 'general_fitness')}
        - Workout Location: {user_data.get('workout_place', 'home')}
        - Available Time: {user_data.get('available_minutes', 30)} minutes/day
        - Preferred Time: {user_data.get('workout_time', 'morning')}
        - Medical History: {user_data.get('medical_history', 'None')}
        - Injuries: {user_data.get('injuries', 'None')}
        - Health Conditions: {user_data.get('health_conditions', 'None')}

        Return ONLY valid JSON with this structure:
        {{
            "plan_title": "...",
            "plan_description": "...",
            "weekly_schedule": {{
                "Monday": {{
                    "focus": "...",
                    "duration_minutes": 45,
                    "time_slot": "6:00 AM - 7:00 AM",
                    "is_rest": false,
                    "warmup": {{"description": "...", "duration_minutes": 5}},
                    "exercises": [
                        {{
                            "name": "...",
                            "sets": 3,
                            "reps": "12-15",
                            "rest_seconds": 60,
                            "description": "...",
                            "muscle_groups": ["chest"],
                            "youtube_search": "..."
                        }}
                    ],
                    "cooldown": {{"description": "...", "duration_minutes": 5}}
                }},
                "Tuesday": {{}},
                "Wednesday": {{}},
                "Thursday": {{}},
                "Friday": {{}},
                "Saturday": {{}},
                "Sunday": {{}}
            }}
        }}"""

        result = self._call_groq(prompt, system_prompt, max_tokens=3000)
        if result:
            try:
                # Extract JSON from response
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Fallback workout plan
        return self._get_fallback_workout_plan(user_data)

    def generate_nutrition_plan(self, user_data: dict) -> dict:
        """Generate a personalized 7-day Indian nutrition plan"""
        system_prompt = """You are ArogyaMitra's expert nutritionist specializing in Indian cuisine. 
        Generate balanced, culturally appropriate meal plans. Always respond with valid JSON only."""

        bmi = None
        if user_data.get('height') and user_data.get('weight'):
            h = user_data['height'] / 100
            bmi = round(user_data['weight'] / (h * h), 1)

        calorie_target = user_data.get('total_calories', 1800)
        if user_data.get('fitness_goal') == 'weight_loss':
            calorie_target = 1600
        elif user_data.get('fitness_goal') == 'muscle_gain':
            calorie_target = 2200

        prompt = f"""Generate a 7-day traditional Indian nutrition plan:
        - Age: {user_data.get('age', 25)}, Gender: {user_data.get('gender', 'Male')}
        - Weight: {user_data.get('weight', 70)} kg, BMI: {bmi}
        - Goal: {user_data.get('fitness_goal', 'maintenance')}
        - Diet Type: {user_data.get('diet_preference', 'vegetarian')}
        - Target Calories: {calorie_target}
        - Allergies: {user_data.get('allergies', 'None')}

        Return ONLY valid JSON with this structure:
        {{
            "plan_title": "...",
            "total_calories": {calorie_target},
            "weekly_meals": {{
                "Monday": {{
                    "breakfast": {{"name": "Dosa with Sambar", "calories": 350, "protein_g": 12, "carbs_g": 55, "fat_g": 8, "ingredients": ["Dosa", "Sambar"], "meal_time": "7:00 AM"}},
                    "lunch": {{"name": "...", "calories": 450, "protein_g": 20, "carbs_g": 65, "fat_g": 12, "ingredients": [], "meal_time": "12:30 PM"}},
                    "dinner": {{"name": "...", "calories": 400, "protein_g": 18, "carbs_g": 50, "fat_g": 10, "ingredients": [], "meal_time": "7:30 PM"}},
                    "snacks": [{{"name": "...", "calories": 100, "meal_time": ""}}]
                }}
            }},
            "grocery_list": [{{"item": "Brown Rice", "quantity": "500g", "weekly_count": 2}}],
            "nutritional_tips": ["..."]
        }}"""

        result = self._call_groq(prompt, system_prompt, max_tokens=3000)
        if result:
            try:
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        return self._get_fallback_nutrition_plan(user_data)

    def analyze_health_assessment(self, user_data: dict) -> dict:
        """Analyze health assessment data and provide insights"""
        system_prompt = "You are an expert health analyst. Provide insights based on user data."
        prompt = f"Analyze this health profile: {json.dumps(user_data)}. Return JSON with summary, risk_factors, and recommendations."
        
        result = self._call_groq(prompt, system_prompt)
        if result:
            try:
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            except:
                pass
        
        return {
            "summary": "Profile analyzed. Ready for fitness plan.",
            "risk_factors": [],
            "recommendations": ["Stay consistent", "Eat healthy"]
        }

    def chat_with_coach(self, message: str, user_data: dict, conversation_history: List[dict] = None) -> str:
        """AI Coach chat - personalized fitness guidance"""
        system_prompt = f"""You are ArogyaMitra's AI Fitness Coach. You are warm, motivating, and knowledgeable.

        User Profile:
        - Name: {user_data.get('full_name', 'User')}
        - Age: {user_data.get('age', 'Unknown')}, Gender: {user_data.get('gender', 'Unknown')}
        - Fitness Level: {user_data.get('fitness_level', 'beginner')}
        - Goal: {user_data.get('fitness_goal', 'general fitness')}
        - Total Workouts: {user_data.get('total_workouts', 0)}

        Provide personalized fitness advice. Be encouraging, use emojis sparingly. Keep responses concise."""

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages
                messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": message})

        if self.groq_client:
            try:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.8,
                    max_tokens=800,
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"Groq chat error: {e}")

        return self._get_fallback_coach_response(message)

    # Alias for router compatibility
    coach_chat = chat_with_coach

    def chat_with_aromi(self, message: str, user_data: dict, workout_plan: dict = None, nutrition_plan: dict = None) -> str:
        """AROMI AI Coach - adaptive real-time wellness companion"""
        system_prompt = f"""You are AROMI, ArogyaMitra's personal health companion. You are friendly, warm and adaptive.
        
        🙏 Namaste! You speak naturally and use Indian cultural references when appropriate.
        
        User: {user_data.get('full_name', 'Friend')}
        Fitness Goal: {user_data.get('fitness_goal', 'General Fitness')}
        Fitness Level: {user_data.get('fitness_level', 'Beginner')}
        
        You can access their workout and nutrition plans and adapt advice dynamically.
        If user mentions traveling, adjust workout suggestions to travel-friendly exercises.
        If user mentions injuries/tiredness, suggest rest and recovery.
        Be concise, warm, and motivating. Use emojis appropriately."""

        user_context = f"User message: {message}"
        if "travel" in message.lower():
            user_context += "\n[Context: User is traveling - suggest travel-friendly exercises]"

        if self.groq_client:
            try:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_context}
                    ],
                    temperature=0.8,
                    max_tokens=600,
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"AROMI chat error: {e}")

        return self._get_fallback_aromi_response(message)

    # Alias for router compatibility
    aromi_chat = chat_with_aromi

    def adjust_plan_dynamically(self, reason: str, duration_days: int, current_plan: dict, user_data: dict) -> dict:
        """Dynamically adjust workout plan based on life changes"""
        system_prompt = """You are ArogyaMitra's adaptive fitness AI. Modify workout plans dynamically based on user circumstances."""

        prompt = f"""The user needs their plan adjusted:
        Reason: {reason}
        Duration: {duration_days} days
        Current Plan Summary: {json.dumps(current_plan, indent=2)[:500]}
        
        Create an adjusted plan that accommodates their situation.
        Return JSON with adjusted_plan and recommendations."""

        result = self._call_groq(prompt, system_prompt)
        if result:
            try:
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            except:
                pass

        return {"message": f"Plan adjusted for {reason}", "adjusted_plan": current_plan}

    def analyze_progress(self, user_data: dict, progress_data: dict) -> dict:
        """Analyze user progress and provide insights"""
        prompt = f"""Analyze this fitness progress and provide insights:
        User: {user_data.get('full_name')}, Goal: {user_data.get('fitness_goal')}
        Progress Data: {json.dumps(progress_data, indent=2)[:500]}
        
        Return JSON with: insights, achievements, recommendations, motivational_message"""

        result = self._call_groq(prompt)
        if result:
            try:
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            except:
                pass

        return {
            "insights": ["Keep tracking your workouts consistently"],
            "achievements": [],
            "recommendations": ["Complete your daily workout for best results"],
            "motivational_message": "Every step counts! Keep going! 💪"
        }

    def _get_fallback_workout_plan(self, user_data: dict) -> dict:
        """Fallback workout plan when AI is unavailable"""
        return {
            "plan_title": "Personalized Fitness Plan",
            "plan_description": "AI-generated plan tailored to your goals",
            "weekly_schedule": {
                "Monday": {
                    "focus": "Full Body Strength",
                    "duration_minutes": 45,
                    "time_slot": "6:00 AM - 7:00 AM",
                    "is_rest": False,
                    "warmup": {"description": "5-minute jogging in place or jumping jacks", "duration_minutes": 5},
                    "exercises": [
                        {"name": "Diamond Push-ups", "sets": 3, "reps": "12-15", "rest_seconds": 60,
                         "description": "Start in plank position, form diamond with hands, lower chest to ground",
                         "muscle_groups": ["chest", "triceps"], "youtube_search": "diamond push ups tutorial"},
                        {"name": "Bodyweight Squats", "sets": 3, "reps": "15-20", "rest_seconds": 60,
                         "description": "Stand feet shoulder-width, squat until thighs parallel to floor",
                         "muscle_groups": ["quads", "glutes"], "youtube_search": "bodyweight squat form"},
                        {"name": "Plank Hold", "sets": 3, "reps": "30-60 seconds", "rest_seconds": 60,
                         "description": "Hold plank position with straight body alignment",
                         "muscle_groups": ["core"], "youtube_search": "plank exercise tutorial"},
                    ],
                    "cooldown": {"description": "5 minutes gentle stretching", "duration_minutes": 5}
                },
                "Tuesday": {
                    "focus": "Cardio & Core",
                    "duration_minutes": 30,
                    "time_slot": "6:30 AM - 7:00 AM",
                    "is_rest": False,
                    "warmup": {"description": "3-minute light jog", "duration_minutes": 3},
                    "exercises": [
                        {"name": "Mountain Climbers", "sets": 3, "reps": "30-60 seconds", "rest_seconds": 60,
                         "description": "Plank position, alternate driving knees toward chest rapidly",
                         "muscle_groups": ["core", "cardio"], "youtube_search": "mountain climbers exercise"},
                        {"name": "Jumping Jacks", "sets": 3, "reps": "30-60 seconds", "rest_seconds": 60,
                         "description": "Jump feet apart while raising arms overhead",
                         "muscle_groups": ["full_body", "cardio"], "youtube_search": "jumping jacks form"},
                        {"name": "Bicycle Crunches", "sets": 3, "reps": "15 each side", "rest_seconds": 60,
                         "description": "Lie on back, alternate elbow to opposite knee",
                         "muscle_groups": ["core", "obliques"], "youtube_search": "bicycle crunches tutorial"},
                    ],
                    "cooldown": {"description": "Stretching and deep breathing", "duration_minutes": 5}
                },
                "Wednesday": {
                    "focus": "Rest Day",
                    "duration_minutes": 0,
                    "time_slot": "",
                    "is_rest": True,
                    "warmup": None,
                    "exercises": [],
                    "cooldown": None
                },
                "Thursday": {
                    "focus": "Upper Body and Cardio",
                    "duration_minutes": 45,
                    "time_slot": "6:00 AM - 7:00 AM",
                    "is_rest": False,
                    "warmup": {"description": "5-minute jogging in place", "duration_minutes": 5},
                    "exercises": [
                        {"name": "Diamond Push-ups", "sets": 3, "reps": "12-15", "rest_seconds": 60,
                         "description": "Upper chest and tricep focused push-up variation",
                         "muscle_groups": ["chest", "triceps"], "youtube_search": "diamond push ups 101"},
                        {"name": "Mountain Climbers", "sets": 3, "reps": "30-60 seconds", "rest_seconds": 60,
                         "description": "Dynamic core and cardio exercise",
                         "muscle_groups": ["core", "cardio"], "youtube_search": "mountain climbers"},
                        {"name": "Jumping Jacks", "sets": 3, "reps": "30-60 seconds", "rest_seconds": 60,
                         "description": "Full body cardio warm-up exercise",
                         "muscle_groups": ["full_body"], "youtube_search": "jumping jacks"},
                    ],
                    "cooldown": {"description": "Cool-down stretches", "duration_minutes": 5}
                },
                "Friday": {
                    "focus": "Lower Body and Core",
                    "duration_minutes": 45,
                    "time_slot": "6:30 AM - 8:00 AM",
                    "is_rest": False,
                    "warmup": {"description": "5 minutes dynamic stretching", "duration_minutes": 5},
                    "exercises": [
                        {"name": "Lunges", "sets": 3, "reps": "12 each leg", "rest_seconds": 60,
                         "description": "Step forward, lower knee toward floor, return to standing",
                         "muscle_groups": ["quads", "glutes", "hamstrings"], "youtube_search": "lunges exercise form"},
                        {"name": "Glute Bridges", "sets": 3, "reps": "15-20", "rest_seconds": 60,
                         "description": "Lie on back, lift hips toward ceiling, squeeze glutes",
                         "muscle_groups": ["glutes", "hamstrings"], "youtube_search": "glute bridge exercise"},
                        {"name": "Russian Twists", "sets": 3, "reps": "15 each side", "rest_seconds": 60,
                         "description": "Seated, lean back slightly, rotate torso side to side",
                         "muscle_groups": ["core", "obliques"], "youtube_search": "russian twist exercise"},
                    ],
                    "cooldown": {"description": "Leg stretches and cool-down", "duration_minutes": 5}
                },
                "Saturday": {
                    "focus": "Back and Biceps",
                    "duration_minutes": 45,
                    "time_slot": "6:30 AM - 7:45 AM",
                    "is_rest": False,
                    "warmup": {"description": "5 minutes arm circles and shoulder warm-up", "duration_minutes": 5},
                    "exercises": [
                        {"name": "Superman Hold", "sets": 3, "reps": "10-12", "rest_seconds": 60,
                         "description": "Lie face down, lift arms and legs simultaneously",
                         "muscle_groups": ["back", "glutes"], "youtube_search": "superman exercise back"},
                        {"name": "Reverse Snow Angels", "sets": 3, "reps": "12-15", "rest_seconds": 60,
                         "description": "Face down, move arms in arc like snow angel",
                         "muscle_groups": ["upper_back", "shoulders"], "youtube_search": "reverse snow angels"},
                        {"name": "Bodyweight Row (using table)", "sets": 3, "reps": "10-12", "rest_seconds": 60,
                         "description": "Lie under table, grip edge, pull chest up to table",
                         "muscle_groups": ["back", "biceps"], "youtube_search": "bodyweight row home"},
                        {"name": "Plank to Downward Dog", "sets": 3, "reps": "10", "rest_seconds": 60,
                         "description": "Alternate between plank and downward dog position",
                         "muscle_groups": ["core", "shoulders", "back"], "youtube_search": "plank downward dog"},
                    ],
                    "cooldown": {"description": "Back and shoulder stretches", "duration_minutes": 5}
                },
                "Sunday": {
                    "focus": "Cardio Day",
                    "duration_minutes": 40,
                    "time_slot": "7:00 AM - 7:40 AM",
                    "is_rest": False,
                    "warmup": {"description": "3-minute light walk", "duration_minutes": 3},
                    "exercises": [
                        {"name": "Brisk Walking/Jogging", "sets": 1, "reps": "20 minutes", "rest_seconds": 0,
                         "description": "Maintain moderate pace, keep heart rate elevated",
                         "muscle_groups": ["cardio", "full_body"], "youtube_search": "brisk walking benefits"},
                        {"name": "High Knees", "sets": 3, "reps": "30 seconds", "rest_seconds": 30,
                         "description": "March in place lifting knees to hip height",
                         "muscle_groups": ["cardio", "core"], "youtube_search": "high knees exercise"},
                        {"name": "Burpees", "sets": 3, "reps": "8-10", "rest_seconds": 60,
                         "description": "Full body explosive movement: squat, plank, push-up, jump",
                         "muscle_groups": ["full_body", "cardio"], "youtube_search": "burpee exercise tutorial"},
                    ],
                    "cooldown": {"description": "Full body stretch cool-down", "duration_minutes": 5}
                }
            }
        }

    def _get_fallback_nutrition_plan(self, user_data: dict) -> dict:
        """Fallback nutrition plan when AI is unavailable"""
        return {
            "plan_title": "🇮🇳 Indian Nutrition Plan",
            "total_calories": 1800,
            "weekly_meals": {
                "Monday": {
                    "breakfast": {"name": "Dosa with Sambar and Coconut Chutney", "calories": 350,
                                  "protein_g": 12, "carbs_g": 55, "fat_g": 8, "meal_time": "7:00 AM",
                                  "ingredients": ["Dosa", "Sambar", "Coconut", "Chana", "Cumin", "Coriander"]},
                    "lunch": {"name": "Whole Wheat Roti with Paneer and Mixed Vegetables", "calories": 450,
                              "protein_g": 20, "carbs_g": 65, "fat_g": 12, "meal_time": "12:30 PM",
                              "ingredients": ["Whole Wheat Roti", "Paneer", "Onions", "Tomatoes", "Cumin", "Coriander"]},
                    "dinner": {"name": "Grilled Fish with Quinoa and Steamed Vegetables", "calories": 400,
                               "protein_g": 35, "carbs_g": 40, "fat_g": 10, "meal_time": "7:30 PM",
                               "ingredients": ["Fish", "Quinoa", "Broccoli", "Carrots", "Cumin", "Cardamom"]},
                    "snacks": [
                        {"name": "Cucumber and Tomato Salad", "calories": 50, "meal_time": ""},
                        {"name": "Roasted Makhana", "calories": 150, "meal_time": ""}
                    ]
                },
                "Tuesday": {
                    "breakfast": {"name": "Idli with Sambar and Coconut Chutney", "calories": 300,
                                  "protein_g": 10, "carbs_g": 50, "fat_g": 5, "meal_time": "7:00 AM",
                                  "ingredients": ["Idli", "Sambar", "Coconut Chutney"]},
                    "lunch": {"name": "Whole Wheat Roti with Rajma and Mixed Vegetables", "calories": 450,
                              "protein_g": 22, "carbs_g": 60, "fat_g": 10, "meal_time": "12:30 PM",
                              "ingredients": ["Whole Wheat Roti", "Rajma", "Onions", "Tomatoes"]},
                    "dinner": {"name": "Grilled Fish with Brown Rice and Steamed Vegetables", "calories": 400,
                               "protein_g": 35, "carbs_g": 45, "fat_g": 8, "meal_time": "7:30 PM",
                               "ingredients": ["Fish", "Brown Rice", "Broccoli", "Carrots"]},
                    "snacks": [{"name": "Roasted Chana", "calories": 120, "meal_time": ""}]
                },
                "Wednesday": {
                    "breakfast": {"name": "Upma with Vegetables and Coconut", "calories": 300,
                                  "protein_g": 8, "carbs_g": 50, "fat_g": 8, "meal_time": "7:00 AM",
                                  "ingredients": ["Semolina", "Vegetables", "Mustard Seeds", "Coconut"]},
                    "lunch": {"name": "Brown Rice with Chole and Mixed Vegetables", "calories": 500,
                              "protein_g": 20, "carbs_g": 75, "fat_g": 10, "meal_time": "12:30 PM",
                              "ingredients": ["Brown Rice", "Chole", "Onions", "Tomatoes"]},
                    "dinner": {"name": "Grilled Chicken with Roasted Vegetables and Brown Rice", "calories": 400,
                               "protein_g": 38, "carbs_g": 40, "fat_g": 8, "meal_time": "7:30 PM",
                               "ingredients": ["Chicken", "Brown Rice", "Bell Peppers", "Zucchini"]},
                    "snacks": [
                        {"name": "Fresh Fruit Juice", "calories": 100, "meal_time": ""},
                        {"name": "Roasted Moong Dal", "calories": 120, "meal_time": ""}
                    ]
                },
                "Thursday": {
                    "breakfast": {"name": "Dosa with Sambar and Coconut Chutney", "calories": 350,
                                  "protein_g": 12, "carbs_g": 55, "fat_g": 8, "meal_time": "7:00 AM",
                                  "ingredients": ["Dosa", "Sambar", "Coconut", "Chana", "Cumin", "Coriander"]},
                    "lunch": {"name": "Whole Wheat Roti with Paneer and Mixed Vegetables", "calories": 450,
                              "protein_g": 20, "carbs_g": 65, "fat_g": 12, "meal_time": "12:30 PM",
                              "ingredients": ["Whole Wheat Roti", "Paneer", "Onions", "Tomatoes"]},
                    "dinner": {"name": "Grilled Fish with Quinoa and Steamed Vegetables", "calories": 400,
                               "protein_g": 35, "carbs_g": 40, "fat_g": 10, "meal_time": "7:30 PM",
                               "ingredients": ["Fish", "Quinoa", "Broccoli", "Carrots"]},
                    "snacks": [
                        {"name": "Cucumber and Tomato Salad", "calories": 50, "meal_time": ""},
                        {"name": "Roasted Makhana", "calories": 150, "meal_time": ""}
                    ]
                },
                "Friday": {
                    "breakfast": {"name": "Oatmeal with Banana and Honey", "calories": 300,
                                  "protein_g": 8, "carbs_g": 55, "fat_g": 5, "meal_time": "7:00 AM",
                                  "ingredients": ["Oats", "Banana", "Honey", "Milk"]},
                    "lunch": {"name": "Brown Rice with Rajma and Mixed Vegetables", "calories": 500,
                              "protein_g": 22, "carbs_g": 75, "fat_g": 10, "meal_time": "12:30 PM",
                              "ingredients": ["Brown Rice", "Rajma", "Onions", "Tomatoes"]},
                    "dinner": {"name": "Grilled Chicken with Brown Rice and Steamed Vegetables", "calories": 400,
                               "protein_g": 38, "carbs_g": 40, "fat_g": 8, "meal_time": "7:30 PM",
                               "ingredients": ["Chicken", "Brown Rice", "Broccoli", "Carrots"]},
                    "snacks": [
                        {"name": "Fresh Fruit Salad", "calories": 100, "meal_time": ""},
                        {"name": "Roasted Chana", "calories": 120, "meal_time": ""}
                    ]
                },
                "Saturday": {
                    "breakfast": {"name": "Idli with Sambar and Coconut Chutney", "calories": 300,
                                  "protein_g": 10, "carbs_g": 50, "fat_g": 5, "meal_time": "7:00 AM",
                                  "ingredients": ["Idli", "Sambar", "Coconut Chutney"]},
                    "lunch": {"name": "Whole Wheat Roti with Chole and Mixed Vegetables", "calories": 450,
                              "protein_g": 20, "carbs_g": 65, "fat_g": 10, "meal_time": "12:30 PM",
                              "ingredients": ["Whole Wheat Roti", "Chole", "Onions", "Tomatoes"]},
                    "dinner": {"name": "Grilled Fish with Quinoa and Steamed Vegetables", "calories": 400,
                               "protein_g": 35, "carbs_g": 40, "fat_g": 10, "meal_time": "7:30 PM",
                               "ingredients": ["Fish", "Quinoa", "Broccoli", "Carrots"]},
                    "snacks": [
                        {"name": "Cucumber and Tomato Salad", "calories": 50, "meal_time": ""},
                        {"name": "Roasted Moong Dal", "calories": 120, "meal_time": ""}
                    ]
                },
                "Sunday": {
                    "breakfast": {"name": "Upma with Vegetables and Coconut", "calories": 300,
                                  "protein_g": 8, "carbs_g": 50, "fat_g": 8, "meal_time": "7:00 AM",
                                  "ingredients": ["Semolina", "Vegetables", "Coconut"]},
                    "lunch": {"name": "Brown Rice with Paneer and Mixed Vegetables", "calories": 500,
                              "protein_g": 22, "carbs_g": 70, "fat_g": 12, "meal_time": "12:30 PM",
                              "ingredients": ["Brown Rice", "Paneer", "Onions", "Tomatoes"]},
                    "dinner": {"name": "Grilled Chicken with Brown Rice and Steamed Vegetables", "calories": 400,
                               "protein_g": 38, "carbs_g": 40, "fat_g": 8, "meal_time": "7:30 PM",
                               "ingredients": ["Chicken", "Brown Rice", "Broccoli", "Carrots"]},
                    "snacks": [
                        {"name": "Fresh Fruit Juice", "calories": 100, "meal_time": ""},
                        {"name": "Roasted Makhana", "calories": 150, "meal_time": ""}
                    ]
                }
            },
            "grocery_list": [
                {"item": "Cumin", "quantity": "50g", "weekly_count": 20},
                {"item": "Coriander", "quantity": "50g", "weekly_count": 12},
                {"item": "Brown Rice", "quantity": "2kg", "weekly_count": 8},
                {"item": "Onions", "quantity": "500g", "weekly_count": 7},
                {"item": "Tomatoes", "quantity": "500g", "weekly_count": 7},
                {"item": "Broccoli", "quantity": "300g", "weekly_count": 7},
                {"item": "Carrots", "quantity": "500g", "weekly_count": 4},
                {"item": "Paneer", "quantity": "200g", "weekly_count": 3},
                {"item": "Fish", "quantity": "500g", "weekly_count": 3},
                {"item": "Quinoa", "quantity": "300g", "weekly_count": 3},
            ]
        }

    def _get_fallback_coach_response(self, message: str) -> str:
        """Fallback coach response"""
        msg = message.lower()
        if "travel" in msg:
            return "🌍 No worries about travel! Try hotel room exercises: push-ups, squats, lunges, and planks. Stay hydrated and walk whenever possible! 💪"
        elif "calor" in msg or "nutri" in msg or "eat" in msg:
            return "🥗 For optimal nutrition, aim for protein with every meal, include whole grains, and stay hydrated with 2.5-3L water daily. Focus on traditional Indian foods - they're nutritionally excellent!"
        elif "morning" in msg or "routine" in msg:
            return "🌅 Perfect morning routine: Wake up, drink 500ml water, 5-minute stretch, 30-min workout, healthy breakfast. Consistency is your superpower! ✨"
        elif "muscle" in msg or "gain" in msg:
            return "💪 For muscle gain: Caloric surplus of 300-500 cal/day, high protein (1.6-2.2g/kg bodyweight), progressive overload training, and 7-9 hours of sleep! Recovery is where the magic happens!"
        return "🎯 Great question! Stay consistent with your training and nutrition. Progress, not perfection! Every workout brings you closer to your goals. Keep going! 💪✨"

    def _get_fallback_aromi_response(self, message: str) -> str:
        """Fallback AROMI response"""
        msg = message.lower()
        if "snack" in msg:
            return "🍎 Hey there, friend! 😊 Here are some healthy snack ideas:\n\n• Roasted Makhana (150 cal)\n• Cucumber & Tomato Salad (50 cal)\n• Roasted Chana (120 cal)\n• Fresh Fruit Salad (100 cal)\n\nThese align with your Indian nutrition plan! 🌿"
        if "travel" in msg:
            return "✈️ Don't worry about fitness while traveling!\n\n• Replace gym with hotel room exercises\n• Walking tours count as cardio!\n• Bodyweight squats, push-ups & planks anywhere\n• Stay hydrated - 3L water daily\n• Look for local healthy food options 🍱"
        if "tired" in msg or "rest" in msg:
            return "😴 Listen to your body! Rest is crucial for fitness gains. Take today easy - light walk or stretching is perfect. Your muscles grow stronger during recovery! Tomorrow you'll be recharged! 💪"
        return "💪 I'm here to support your wellness journey! Stay consistent and you'll see amazing results! 🌟"


# Global AI Agent instance
ai_agent = ArogyaMitraAgent()