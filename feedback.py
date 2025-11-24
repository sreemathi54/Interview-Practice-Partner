from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
import os

def generate_feedback(transcript_text):
    # Let's update the function signature to accept role and topic if needed, 
    # but for now let's just rely on the transcript content or pass placeholders if strictly needed by the prompt.
    # Actually, the prompt expects {role} and {topic}. Let's update the signature.
    return "Error: Missing role and topic in function signature. Please update."

def generate_feedback_v2(transcript_text, role, topic):
    api_key = os.getenv("GROQ_API_KEY")
    llm = ChatGroq(
        temperature=0.5, 
        model_name="llama-3.3-70b-versatile", 
        groq_api_key=api_key
    )
    
    prompt_template = open("prompts/feedback_prompt.txt", "r").read()
    system_prompt = prompt_template.format(
        role=role,
        topic=topic,
        transcript=transcript_text
    )
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content="Generate the feedback report.")
    ]
    
    response = llm.invoke(messages)
    return response.content
