# 🤖 AgentOrchestrator V37

A powerful multi-agent AI orchestration system powered by Google Gemini. Create, configure, and run AI agent pipelines for complex tasks like grant writing, content creation, and more.

![Version](https://img.shields.io/badge/version-37.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **Multi-Agent Workflows**: Create pipelines with multiple specialized AI agents
- **Google Gemini Integration**: Powered by Google's latest AI models
- **Interactive Mode**: Choose agents dynamically as you work
- **Global Memory**: Agents share context across the entire session
- **Session History**: Save and resume your work anytime
- **File Attachments**: Upload documents for AI processing
- **Magic Agent Generator**: AI-powered agent creation
- **Local Storage**: All data persists in your browser

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** version 18 or higher ([Download here](https://nodejs.org/))
- A **Google AI Studio API Key** ([Get one free here](https://aistudio.google.com/apikey))

### Installation

```bash
# 1. Navigate to the project folder
cd agent-orchestrator

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will open at `http://localhost:5173`

---

## 📦 Deployment Guide (FREE Options)

### Option 1: Vercel (Recommended - Easiest)

**Vercel** is the easiest way to deploy. It's free and takes about 5 minutes.

#### Step-by-Step:

1. **Create a GitHub Account** (if you don't have one)
   - Go to [github.com](https://github.com)
   - Click "Sign up" and follow the steps

2. **Upload Your Project to GitHub**
   - Go to [github.com/new](https://github.com/new)
   - Name your repository: `agent-orchestrator`
   - Keep it **Public** (required for free tier)
   - Click "Create repository"
   - Follow the commands shown to upload your code (see detailed steps below)

3. **Deploy with Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up" → Choose "Continue with GitHub"
   - Authorize Vercel to access your GitHub
   - Click "Add New Project"
   - Find `agent-orchestrator` in the list and click "Import"
   - Leave all settings as default
   - Click "Deploy"
   - Wait 1-2 minutes for deployment
   - 🎉 Your app is now live at `https://agent-orchestrator-xxxxx.vercel.app`

---

### Option 2: Netlify (Also Very Easy)

1. **Create a Netlify Account**
   - Go to [netlify.com](https://www.netlify.com)
   - Click "Sign Up" → "Sign up with GitHub"

2. **Deploy from GitHub**
   - Click "Add new site" → "Import an existing project"
   - Select "GitHub"
   - Find and select `agent-orchestrator`
   - Build settings (should auto-detect):
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"
   - 🎉 Your app is live!

---

### Option 3: GitHub Pages (100% Free Forever)

This method requires a small config change but is completely free.

1. **Modify vite.config.js**
   
   Open `vite.config.js` and change it to:
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/agent-orchestrator/', // Add this line
     build: {
       outDir: 'dist',
       sourcemap: false
     }
   })
   ```

2. **Install gh-pages package**
   ```bash
   npm install gh-pages --save-dev
   ```

3. **Add deploy script to package.json**
   
   Add these lines to the `"scripts"` section:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**
   - Go to your repo on GitHub
   - Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `gh-pages` / `(root)`
   - Click Save
   - 🎉 Your app is live at `https://yourusername.github.io/agent-orchestrator`

---

## 📤 How to Upload Code to GitHub (Detailed Steps)

If you've never used GitHub before, here's exactly what to do:

### First Time Setup (One Time Only)

1. **Install Git** (if not installed)
   - Windows: Download from [git-scm.com](https://git-scm.com/download/win)
   - Mac: Open Terminal and run `xcode-select --install`
   - Linux: Run `sudo apt install git`

2. **Configure Git** (open Terminal/Command Prompt)
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your-email@example.com"
   ```

### Upload Your Project

1. **Open Terminal/Command Prompt**

2. **Navigate to your project folder**
   ```bash
   cd path/to/agent-orchestrator
   ```

3. **Initialize and upload**
   ```bash
   # Initialize git repository
   git init

   # Add all files
   git add .

   # Create your first commit
   git commit -m "Initial commit - AgentOrchestrator V37"

   # Connect to GitHub (replace YOUR-USERNAME)
   git remote add origin https://github.com/YOUR-USERNAME/agent-orchestrator.git

   # Upload to GitHub
   git branch -M main
   git push -u origin main
   ```

4. **If asked for password**: GitHub now requires a "Personal Access Token"
   - Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
   - Click "Generate new token"
   - Give it a name, select "repo" scope
   - Copy the token and use it as your password

---

## 🔑 Getting a Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Paste it into AgentOrchestrator when prompted

**Note**: The free tier gives you generous usage limits for personal projects.

---

## 🛠️ Project Structure

```
agent-orchestrator/
├── public/
│   └── favicon.svg          # App icon
├── src/
│   ├── AgentOrchestrator.jsx # Main application component
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles
├── index.html                # HTML template
├── package.json              # Dependencies & scripts
├── vite.config.js            # Build configuration
├── tailwind.config.js        # Tailwind CSS config
├── postcss.config.js         # PostCSS config
└── README.md                 # This file
```

---

## ❓ Troubleshooting

### "npm: command not found"
- You need to install Node.js first
- Download from [nodejs.org](https://nodejs.org/) (choose LTS version)

### "CORS Error" when calling Gemini API
- Enable the "CORS Proxy" toggle in the sidebar
- Try different proxy options from the dropdown

### App not loading after deployment
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check the deployment logs in Vercel/Netlify for errors

### API calls failing
- Make sure your API key is correct
- Check if you have quota remaining at [Google AI Studio](https://aistudio.google.com)

---

## 📝 License

MIT License - Feel free to use and modify!

---

## 🙏 Credits

Built with:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Google Gemini](https://ai.google.dev/)

---

**Made with ❤️ for the AI community**
