import time
from interview import InterviewManager
from voice import transcribe_audio, speak_text
from feedback import generate_feedback_v2
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')


def get_user_answer(question, manager, max_retries=2):
    """
    Gets user answer with retry logic and option to type if audio fails.
    Returns the answer text or empty string if all attempts fail.
    """
    for attempt in range(max_retries + 1):
        print("\n(Listening for your answer...)")
        answer = transcribe_audio()
        
        if answer and answer.strip():
            # Correct transcription
            print(f"(Raw transcription: {answer})")
            corrected = manager.correct_transcription(answer, f"Answer to interview question: {question}")
            return corrected
        else:
            if attempt < max_retries:
                retry_msg = "I couldn't catch that clearly. Could you please repeat your answer?"
                speak_text(retry_msg)
                print("⚠️  Audio not clear. Please try speaking again.")
            else:
                # After max retries, offer typing option
                fallback_msg = "I'm having trouble understanding your voice input. You can type your answer instead."
                speak_text(fallback_msg)
                print("\n⚠️  Voice input not detected clearly.")
                print("You can now type your answer, or press Enter to skip this question.")
                
                typed_answer = input("\nType your answer (or press Enter to skip): ")
                if typed_answer and typed_answer.strip():
                    return typed_answer.strip()
                else:
                    return ""
    
    return ""


def main():
    # Clear screen
    os.system('cls' if os.name == 'nt' else 'clear')
    
    print("==========================================")
    print("        AI INTERVIEW AGENT ")
    print("==========================================")
    
    # Check API Key
    if not os.getenv("GROQ_API_KEY"):
        print(" Error: GROQ_API_KEY not found in .env file.")
        print("Please add your API key to the .env file.")
        return

    manager = InterviewManager()
    
    # 1. Welcome & Role
    welcome_msg = "Hi! I'm Zyra, your AI interview coach. Welcome to your mock interview session. Can you tell me which job role you're applying for?"
    speak_text(welcome_msg)
    
    # Get role with improved input handling
    role = ""
    for attempt in range(2):
        print("\n(Listening for Role...)")
        role = transcribe_audio()
        if role and role.strip():
            print(f"(Raw transcription: {role})")
            role = manager.correct_transcription(role, "Job Role Selection")
            break
        else:
            if attempt == 0:
                retry_msg = "I couldn't catch that. Could you please repeat the job role?"
                speak_text(retry_msg)
            else:
                role = input("\n⚠️  Could not detect voice input. Please type the job role: ")
                break
    
    if not role or not role.strip():
        role = input("Please enter the job role: ")
    
    print(f"\n✓ Role: {role}")
    manager.set_role(role)
    
    # 2. Topic - Only ask about core concepts from the role
    topic_msg = f"Great! I'll focus on the core concepts and topics relevant to {role}. Let's begin the interview."
    speak_text(topic_msg)
    
    # Set topic to focus on core concepts of the role
    topic = f"core concepts and topics for {role}"
    manager.set_topic(topic)
    
    # 3. Questions Loop - At least 10 questions with follow-ups
    # Difficulty progression: Easy -> Medium -> Hard
    difficulty_levels = ["Easy", "Easy", "Medium", "Medium", "Medium", "Medium", "Hard", "Hard", "Hard", "Hard"]
    
    
    question_number = 0
    for i, difficulty in enumerate(difficulty_levels):
        question_number += 1
        print(f"\n\n--- Question {question_number} ({difficulty}) ---")
        
        # Generate Question
        try:
            question = manager.generate_question(difficulty)
        except Exception as e:
            print(f"Error generating question: {e}")
            break
            
        speak_text(question)
        
        # Get Answer with improved error handling
        answer = get_user_answer(question, manager)
        if not answer:
            print("⚠️  Skipping this question due to input issues.")
            continue
            
        print(f"\n You said: {answer}")
        
        # Record interaction
        manager.record_interaction(question, answer)
        
        # Generate and ask follow-up question to probe deeper into the answer
        # Ask follow-ups for comprehensive assessment (limit to reasonable total)
        if question_number < 20:  # Limit total questions to keep interview manageable
            try:
                followup_question = manager.generate_question(difficulty, is_followup=True, 
                                                             previous_question=question, 
                                                             previous_answer=answer)
                if followup_question and followup_question.strip():
                    question_number += 1
                    print(f"\n\n--- Follow-up Question {question_number} ({difficulty}) ---")
                    speak_text(followup_question)
                    
                    # Get follow-up answer
                    followup_answer = get_user_answer(followup_question, manager)
                    if followup_answer:
                        print(f"\n You said: {followup_answer}")
                        manager.record_interaction(followup_question, followup_answer)
            except Exception as e:
                print(f"(Error generating follow-up: {e})")
        
        # Brief acknowledgement before next question
        if i < len(difficulty_levels) - 1:
            speak_text("Thank you. Let's move to the next question.")
            
    # 4. Feedback
    print("\n\n==========================================")
    print("        GENERATING FEEDBACK ")
    print("==========================================")
    speak_text("That concludes the interview. I am now generating your feedback.")
    
    transcript = manager.get_transcript_text()
    feedback = generate_feedback_v2(transcript, role, topic)
    
    print(feedback)
    
    # Speak a summary or just the rating? 
    # Speaking the whole feedback might be too long. Let's just say it's ready.
    speak_text("I have printed the detailed feedback on your screen. Good luck with your real interview!")

if __name__ == "__main__":
    main()
