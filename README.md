# WhyHire AI - Interview Simulator

WhyHire AI is a next-gen interview simulator that uses Google Gemini AI to analyze your resume and conduct deep, project-specific technical interviews.

## 🚀 Key Features

### 1. AI Resume Extraction
Upload your resume (PDF), and the AI will instantly extract your key projects, technologies, and core skills. No more manual entry.

### 2. Project-Specific Question Generation
Based **only** on your real-world projects, the AI generates 5 high-impact questions focused on your technical decisions, architecture, and implementation challenges.

### 3. Adaptive Interview Session
A chat-style interface where the AI dynamically adjusts its follow-up questions based on your answers, simulating a real senior-level technical interview.

## 🛠️ Technology Stack
- **Frontend**: React, Vite, Axios, Lucide Icons, Vanilla CSS (Glassmorphism)
- **Backend**: Node.js, Express, Multer, PDF-Parse
- **AI**: Google Generative AI (Gemini 1.5 Flash)

## 📡 API Endpoints

### Interview API
- `POST /api/interview/generate-questions`: Generates 5 project-focused questions.
- `POST /api/interview/chat`: Handles the adaptive follow-up dynamic conversation.

### Resume API
- `POST /api/resume/upload`: Parses PDF resumes and returns structured project/skill data.

## ⚙️ Setup Instructions

1. **Clone the repo**
   ```bash
   git clone https://github.com/bhavay009/whyAI.git
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the `server` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3001
   ```

3. **Install Dependencies**
   ```bash
   # Server
   cd server && npm install
   
   # Client
   cd client && npm install
   ```

4. **Run Locally**
   ```bash
   # Start Server
   cd server && node server.js
   
   # Start Client
   cd client && npm run dev
   ```

## 🎨 Aesthetic Design
The application features a modern "Dark Glassmorphism" UI with:
- HSL-tailored color palettes.
- Fluid micro-animations.
- Responsive chat-style layouts.
- Dynamic "Loading" states for AI responses.
