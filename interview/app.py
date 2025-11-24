import streamlit as st
from main import run_interview

st.title("AI Interview Practice Partner 🎤")
if st.button("Start Interview"):
    run_interview()
