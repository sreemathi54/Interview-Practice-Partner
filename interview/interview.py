import os
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

load_dotenv()

class InterviewManager:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in .env file")
            
        self.llm = ChatGroq(
            temperature=0.7, 
            model_name="llama-3.3-70b-versatile", 
            groq_api_key=api_key
        )
        self.role = None
        self.topic = None
        self.transcript = [] # List of (Question, Answer) tuples

    def set_role(self, role):
        self.role = role

    def set_topic(self, topic):
        self.topic = topic

    def generate_question(self, difficulty, is_followup=False, previous_question=None, previous_answer=None, is_developer=False):
        """
        Generates a question based on role, topic, and difficulty.
        If is_followup is True, generates a follow-up question based on the previous answer.
        If is_developer is True, uses developer-specific prompt with coding questions.
        """
        # Use developer prompt for coding interviews
        prompt_file = "prompts/developer_interviewer_prompt.txt" if is_developer else "prompts/interviewer_prompt.txt"
        prompt_template = open(prompt_file, "r").read()
        system_prompt = prompt_template.format(
            role=self.role,
            topic=self.topic,
            difficulty=difficulty
        )

        # Build a richer history containing both previous questions and answers
        if self.transcript:
            history_lines = ["\nPrevious Q&A history (most recent last):"]
            for q, a in self.transcript:
                history_lines.append(f"Q: {q}")
                history_lines.append(f"A: {a}")
            history = "\n" + "\n".join(history_lines)
            system_prompt += history

            # Explicit instruction to avoid repeating any previous questions
            no_repeat = "\n\nImportant constraints:\n- Do NOT repeat any previous question listed above.\n- For a new (non-follow-up) question: use the candidate's prior answers to move to a different but related core concept or to probe another key technical area; do not re-ask the same concept.\n- Questions must be conceptual and technical: request explanations, reasoning, design trade-offs, or code-level details when appropriate.\n- Keep questions unique across the session unless a direct clarification is required.\n"
            system_prompt += no_repeat

        # If this is a follow-up question, include the immediate context so the LLM can reference it
        if is_followup and previous_question and previous_answer:
            followup_context = (
                f"\n\nThis is a FOLLOW-UP question. The candidate just answered:\nQ: {previous_question}\nA: {previous_answer}\n\n"
                "Generate a relevant follow-up that probes deeper into the candidate's answer, asks for clarification, requests an example, or explores related technical trade-offs."
            )
            system_prompt += followup_context

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=("Generate the next question." if not is_followup else "Generate a follow-up question based on the candidate's answer."))
        ]

        # Try to generate a sufficiently technical, non-generic question.
        # If the returned question looks too general, retry once with stronger constraints.
        technical_keywords = [
            "explain", "design", "architecture", "complexity", "algorithm", "trade-off",
            "pseudocode", "implement", "code", "diagnose", "optimi", "memory", "latency",
            "scalab", "throughput", "consistency", "availability", "sql", "index", "concurrency"
        ]

        attempts = 0
        max_attempts = 2
        while attempts < max_attempts:
            try:
                response = self.llm.invoke(messages)
            except Exception as e:
                # On an invocation failure, raise so the caller can handle it
                raise

            question = response.content.strip()

            # Simple heuristic: consider question technical if it contains any technical keyword
            q_lower = question.lower()
            is_technical = any(k in q_lower for k in technical_keywords)

            # For follow-ups, also prefer explicit reference to the candidate's prior answer
            if is_followup and previous_answer:
                if previous_answer.lower().split()[:3][0] if previous_answer.strip() else False:
                    # no-op; presence of previous_answer will be used in the system prompt already
                    pass

            if is_technical or attempts == max_attempts - 1:
                return question

            # If not technical enough, strengthen the system instructions and retry
            attempts += 1
            system_prompt += (
                "\n\nThe previous question was too general. Now produce a highly technical, specific question. "
                "Ask for explanation, design details, code/pseudocode, complexity analysis, or concrete debugging steps. "
                "Do NOT ask vague or high-level survey questions."
            )

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=("Generate the next question." if not is_followup else "Generate a follow-up question based on the candidate's answer."))
            ]

        return question

    def record_interaction(self, question, answer):
        self.transcript.append((question, answer))

    def get_transcript_text(self):
        text = ""
        for q, a in self.transcript:
            text += f"Q: {q}\nA: {a}\n\n"
        return text

    def correct_transcription(self, text, context):
        """
        Uses the LLM to correct potential transcription errors based on context.
        """
        system_prompt = f"""You are a helpful assistant correcting speech-to-text errors for an interview context.
Context: {context}
Input: "{text}"
Task: Correct any obvious phonetic or transcription errors to make sense in the context. 
If the input seems completely unrelated or gibberish, return it as is or try to make the best guess.
Output: Only the corrected text, nothing else."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content="Correct this text.")
        ]
        
        try:
            response = self.llm.invoke(messages)
            corrected = response.content.strip()
            # Remove quotes if added
            if corrected.startswith('"') and corrected.endswith('"'):
                corrected = corrected[1:-1]
            return corrected
        except Exception as e:
            print(f"(Correction failed: {e})")
            return text
