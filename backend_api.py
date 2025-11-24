"""
Flask API backend for the Interview Practice Partner frontend.
Integrated with the existing interview logic.
"""

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Get the Dheenath-demo14 directory path
demo_dir = os.path.join(os.path.dirname(__file__), 'Dheenath-demo14')
demo_dir = os.path.abspath(demo_dir)

# Add the Dheenath-demo14 directory to the path
sys.path.insert(0, demo_dir)

# Store the demo directory for later use
DEMO_DIR = demo_dir

from interview import InterviewManager
from feedback import generate_feedback_v2

# Load environment variables (try both locations)
env_path = os.path.join(demo_dir, '.env')
if not os.path.exists(env_path):
    # Try parent directory
    env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def handle_rate_limit_error(error_str):
    """
    Parse rate limit error and return user-friendly message
    Returns: (message, wait_time_seconds) or (message, None)
    """
    import re
    
    # Check if it's a rate limit error
    if 'rate_limit' not in error_str.lower() and '429' not in error_str and 'Rate limit' not in error_str:
        return error_str, None
    
    # Try to extract wait time
    wait_match = re.search(r'try again in (\d+)m(\d+\.?\d*)s', error_str)
    if wait_match:
        minutes = int(wait_match.group(1))
        seconds = int(float(wait_match.group(2)))
        total_seconds = minutes * 60 + seconds
        wait_time = f"{minutes} minutes and {seconds} seconds"
        message = f"⚠️ Rate Limit Reached\n\nThe Groq API has reached its daily token limit. Please wait approximately {wait_time} before continuing.\n\nYou can:\n1. Wait for the rate limit to reset\n2. Upgrade your Groq API tier at https://console.groq.com/settings/billing\n3. Try again later"
        return message, total_seconds
    else:
        # Try to extract limit info
        limit_match = re.search(r'Limit (\d+), Used (\d+)', error_str)
        if limit_match:
            limit = limit_match.group(1)
            used = limit_match.group(2)
            message = f"⚠️ Rate Limit Reached\n\nThe Groq API has reached its daily token limit (Used: {used}/{limit}). Please wait or upgrade your API tier at https://console.groq.com/settings/billing"
        else:
            message = "⚠️ Rate Limit Reached\n\nThe Groq API has reached its daily token limit. Please wait a few minutes or upgrade your Groq API tier at https://console.groq.com/settings/billing"
        return message, None

# Store interview sessions (in production, use a database)
# Format: { session_id: { manager: InterviewManager, state: str, role: str, topic: str, question_number: int, current_question: str } }
interview_sessions = {}

def get_or_create_session(session_id):
    """Get existing session or create a new one"""
    if session_id not in interview_sessions:
        try:
            # Note: Working directory should be set to DEMO_DIR before calling this
            manager = InterviewManager()
            
            interview_sessions[session_id] = {
                'manager': manager,
                'state': 'initializing',  # initializing, role_set, interviewing, completed
                'role': None,
                'topic': None,
                'question_number': 0,
                'current_question': None,
                'difficulty_levels': ["Easy", "Easy", "Medium", "Medium", "Medium", "Medium", "Hard", "Hard", "Hard", "Hard"],
                'current_difficulty_index': 0
            }
        except Exception as e:
            return None, f"Failed to initialize interview manager: {str(e)}"
    return interview_sessions[session_id], None

@app.route('/api', methods=['POST', 'OPTIONS'])
def handle_message():
    """
    Handle incoming messages from the frontend.
    Expected request: { "message": "user message", "session_id": "optional" }
    Returns: { "response": "backend response", "session_id": "session_id" }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    # Set working directory to DEMO_DIR for file operations
    original_cwd = os.getcwd()
    try:
        os.chdir(DEMO_DIR)
    except:
        pass  # If directory change fails, continue anyway
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No JSON data received',
                'status': 'error'
            }), 400
        
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id', 'default')
        role_from_request = data.get('role', None)  # Role can come from frontend
        
        if not user_message:
            return jsonify({
                'error': 'No message provided',
                'status': 'error'
            }), 400
        
        # Get or create session
        session, error = get_or_create_session(session_id)
        if error:
            return jsonify({
                'error': error,
                'status': 'error'
            }), 500
        
        manager = session['manager']
        state = session['state']
        
        # Check if role is provided in request (from role selection)
        is_developer = False
        if role_from_request:
            session['role'] = role_from_request
            manager.set_role(role_from_request)
            is_developer = role_from_request.lower() in ['engineer', 'developer', 'software engineer']
            session['is_developer'] = is_developer
            session['state'] = 'role_set'
            
            # Set topic based on role
            if is_developer:
                topic = "coding problems, algorithms, data structures, and system design"
            else:
                topic = f"core concepts and topics for {role_from_request}"
            session['topic'] = topic
            manager.set_topic(topic)
        
        # Handle different states of the interview
        response_text = ""
        
        if state == 'initializing':
            # First message should be the job role
            if not session['role']:
                # Correct transcription if needed
                corrected_role = manager.correct_transcription(user_message, "Job Role Selection")
                session['role'] = corrected_role
                manager.set_role(corrected_role)
                is_developer = corrected_role.lower() in ['engineer', 'developer', 'software engineer']
                session['is_developer'] = is_developer
                session['state'] = 'role_set'
                
                # Set topic based on role
                if is_developer:
                    topic = "coding problems, algorithms, data structures, and system design"
                else:
                    topic = f"core concepts and topics for {corrected_role}"
                session['topic'] = topic
                manager.set_topic(topic)
                
                response_text = f"Great! I'll focus on the core concepts and topics relevant to {corrected_role}. Let's begin the interview.\n\nI'll ask you questions of varying difficulty levels. Please answer them to the best of your ability."
            else:
                response_text = "Please provide your job role to start the interview."
        
        elif state == 'role_set' or state == 'interviewing':
            # Check if this is an answer to a question
            if session['current_question']:
                # This is an answer
                corrected_answer = manager.correct_transcription(user_message, f"Answer to interview question: {session['current_question']}")
                
                # Record the interaction
                manager.record_interaction(session['current_question'], corrected_answer)
                
                # Generate follow-up question
                try:
                    difficulty = session['difficulty_levels'][session['current_difficulty_index']]
                    is_developer = session.get('is_developer', False)
                    followup_question = manager.generate_question(
                        difficulty,
                        is_followup=True,
                        previous_question=session['current_question'],
                        previous_answer=corrected_answer,
                        is_developer=is_developer
                    )
                    
                    if followup_question and followup_question.strip():
                        session['current_question'] = followup_question
                        response_text = followup_question
                    else:
                        # Move to next main question
                        session['current_question'] = None
                        response_text = "Thank you for your answer. Let me ask you another question."
                except Exception as e:
                    error_str = str(e)
                    rate_limit_msg, wait_time = handle_rate_limit_error(error_str)
                    
                    if wait_time is not None:
                        # It's a rate limit error
                        response_text = f"Thank you for your answer!\n\n{rate_limit_msg}\n\nFor now, let's continue with the next question."
                    else:
                        # Regular error
                        response_text = f"Thank you for your answer. Let me ask you another question.\n\n(Error generating follow-up: {error_str})"
                    session['current_question'] = None
            else:
                # Generate a new question
                session['state'] = 'interviewing'
                session['current_difficulty_index'] = min(session['current_difficulty_index'], len(session['difficulty_levels']) - 1)
                difficulty = session['difficulty_levels'][session['current_difficulty_index']]
                is_developer = session.get('is_developer', False)
                
                try:
                    question = manager.generate_question(difficulty, is_developer=is_developer)
                    session['current_question'] = question
                    session['question_number'] += 1
                    response_text = question
                except Exception as e:
                    error_str = str(e)
                    rate_limit_msg, wait_time = handle_rate_limit_error(error_str)
                    
                    if wait_time is not None:
                        # It's a rate limit error
                        response_text = rate_limit_msg
                        return jsonify({
                            'response': response_text,
                            'status': 'error',
                            'session_id': session_id,
                            'rate_limit_error': True,
                            'wait_time_seconds': wait_time
                        }), 429  # HTTP 429 Too Many Requests
                    else:
                        # Regular error
                        response_text = f"Error generating question: {error_str}"
                        return jsonify({
                            'response': response_text,
                            'status': 'error',
                            'session_id': session_id
                        }), 500
            
            # Check if we should move to next difficulty level
            if session['current_question'] is None:
                session['current_difficulty_index'] += 1
                
                # Check if interview is complete
                if session['current_difficulty_index'] >= len(session['difficulty_levels']):
                    # Generate feedback
                    try:
                        transcript = manager.get_transcript_text()
                        # Note: Working directory is already set to DEMO_DIR
                        feedback = generate_feedback_v2(transcript, session['role'], session['topic'])
                        session['state'] = 'completed'
                        response_text = f"Interview completed! Here's your feedback:\n\n{feedback}"
                    except Exception as e:
                        error_str = str(e)
                        rate_limit_msg, wait_time = handle_rate_limit_error(error_str)
                        
                        if wait_time is not None:
                            # It's a rate limit error
                            response_text = f"Interview completed! However, I cannot generate feedback right now due to a rate limit.\n\n{rate_limit_msg}\n\nYou can request feedback later using the feedback endpoint."
                        else:
                            # Regular error
                            response_text = f"Interview completed! However, there was an error generating feedback: {error_str}"
                        session['state'] = 'completed'
        
        elif state == 'completed':
            response_text = "The interview has been completed. Would you like to start a new interview? If so, please provide a new job role."
            # Reset session
            session['state'] = 'initializing'
            session['role'] = None
            session['topic'] = None
            session['question_number'] = 0
            session['current_question'] = None
            session['current_difficulty_index'] = 0
            manager = InterviewManager()
            session['manager'] = manager
        
        return jsonify({
            'response': response_text,
            'status': 'success',
            'session_id': session_id,
            'state': session['state']
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500
    finally:
        # Restore original working directory
        try:
            os.chdir(original_cwd)
        except:
            pass

@app.route('/api/start', methods=['POST', 'OPTIONS'])
def start_interview():
    """Start a new interview session"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Set working directory to DEMO_DIR for file operations
    original_cwd = os.getcwd()
    try:
        os.chdir(DEMO_DIR)
    except:
        pass
    
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        role = data.get('role', None)  # Optional role from frontend
        
        # Create or reset session
        session, error = get_or_create_session(session_id)
        if error:
            return jsonify({
                'error': error,
                'status': 'error'
            }), 500
        
        # Reset session
        session['state'] = 'initializing'
        session['role'] = role if role else None
        session['topic'] = None
        session['question_number'] = 0
        session['current_question'] = None
        session['current_difficulty_index'] = 0
        session['is_developer'] = False
        try:
            # Note: Working directory should be set to DEMO_DIR before calling this
            session['manager'] = InterviewManager()
        except Exception as e:
            return jsonify({
                'error': f"Failed to initialize interview: {str(e)}",
                'status': 'error'
            }), 500
        
        if role:
            # Role already selected, welcome with role-specific message
            is_developer = role.lower() in ['engineer', 'developer', 'software engineer']
            if is_developer:
                welcome_msg = "Hi! I'm Zyra, your AI interview coach. Welcome to your coding interview! I'll ask you coding problems with varying difficulty levels. You'll see the problem statement with input/output examples on the left, and you can write your solution in the code editor on the right. Let's begin!"
            else:
                welcome_msg = f"Hi! I'm Zyra, your AI interview coach. Welcome to your {role} interview! I'll ask you questions relevant to this role. Let's begin!"
        else:
            welcome_msg = "Hi! I'm Zyra, your AI interview coach. Welcome to your mock interview session. Please select a job role to begin."
        
        return jsonify({
            'response': welcome_msg,
            'status': 'success',
            'session_id': session_id
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500
    finally:
        # Restore original working directory
        try:
            os.chdir(original_cwd)
        except:
            pass

@app.route('/api/feedback', methods=['POST', 'OPTIONS'])
def get_feedback():
    """Get feedback for completed interview"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Set working directory to DEMO_DIR for file operations
    original_cwd = os.getcwd()
    try:
        os.chdir(DEMO_DIR)
    except:
        pass
    
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        if session_id not in interview_sessions:
            return jsonify({
                'error': 'Session not found',
                'status': 'error'
            }), 404
        
        session = interview_sessions[session_id]
        manager = session['manager']
        
        if session['state'] != 'completed' and len(manager.transcript) == 0:
            return jsonify({
                'error': 'No interview data available for feedback',
                'status': 'error'
            }), 400
        
        transcript = manager.get_transcript_text()
        # Note: Working directory should be set to DEMO_DIR before calling this
        feedback = generate_feedback_v2(transcript, session['role'], session['topic'])
        
        return jsonify({
            'response': feedback,
            'status': 'success',
            'session_id': session_id
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    # Check if GROQ_API_KEY is set
    api_key_set = bool(os.getenv("GROQ_API_KEY"))
    
    return jsonify({
        'status': 'online',
        'message': 'Backend API is running',
        'api_key_configured': api_key_set
    }), 200

if __name__ == '__main__':
    # Check for API key
    if not os.getenv("GROQ_API_KEY"):
        print("⚠️  WARNING: GROQ_API_KEY not found in environment variables.")
        print("Please set it in Dheenath-demo14/.env file")
        print("Continuing anyway, but interview features will not work...")
    
    print("Starting backend API server on http://localhost:5000")
    print("API endpoint: http://localhost:5000/api")
    print("Start interview: POST /api/start")
    print("Get feedback: POST /api/feedback")
    app.run(host='0.0.0.0', port=5000, debug=True)
