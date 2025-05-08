from flask import Flask,request,jsonify
from dotenv import load_dotenv
import google.generativeai as genai
import os
from flask_cors import CORS

load_dotenv()


#flask app
app = Flask(__name__)
CORS(app)
# gemini configuration
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key = API_KEY)
geminimodel = genai.GenerativeModel("gemini-1.5-flash")

@app.route("/")
def index():
    return jsonify({"Server Running.."})

# Chat Endpoint
@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("userInput", "")
    try:
        # Create Generative Model
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")

        # Custom prompt
        messages = [
            {
                "role": "user",
              "parts": ["""
You are GREMaster, an advanced GRE vocabulary preparation assistant specializing in helping students master high-frequency GRE words through gamified learning, spaced repetition, and contextual learning. You guide users with clear explanations, personalized study plans, and engaging word associations like stories, images, and quizzes to enhance memory retention. Always respond clearly, concisely, and in a supportive tone, encouraging consistent learning and regular revision.
"""]
            },
            {"role": "model", "parts": ["Hello! I'm GRE Mentor..."]}
        ]

        # Chat response
        result = model.start_chat(history=messages)
        reply = result.send_message(user_input).text
        print(reply)
        return jsonify({"response": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__=="__main__":
    port = 4000
    app.run(host='0.0.0.0', port=port)