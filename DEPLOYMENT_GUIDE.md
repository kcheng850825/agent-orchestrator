# 🚀 DEPLOYMENT GUIDE: Put Your AgentOrchestrator Online for FREE

**Time needed: About 10-15 minutes**

This guide will walk you through putting your AgentOrchestrator app online so anyone can use it. No coding experience needed!

---

## 📋 WHAT YOU'LL NEED

1. ✅ The project files (you have them!)
2. ✅ A computer with internet
3. ⬜ A GitHub account (free) - we'll create this
4. ⬜ A Vercel account (free) - we'll create this
5. ⬜ Node.js installed on your computer

---

## 🔧 STEP 1: Install Node.js (if you haven't already)

Node.js is a program that lets you run JavaScript on your computer.

### On Windows:
1. Go to https://nodejs.org
2. Click the big green button that says "LTS" (recommended)
3. Open the downloaded file
4. Click "Next" through all the steps
5. Click "Install"
6. Click "Finish"

### On Mac:
1. Go to https://nodejs.org
2. Click the big green button that says "LTS"
3. Open the downloaded file
4. Follow the installation steps

### ✅ Verify it worked:
1. Open Terminal (Mac) or Command Prompt (Windows)
2. Type: `node --version`
3. Press Enter
4. You should see a version number like `v20.10.0`

---

## 📁 STEP 2: Prepare Your Project Folder

1. **Download and unzip** the project files to a folder on your computer
2. Name the folder: `agent-orchestrator`
3. Remember where you saved it!

**Your folder should look like this:**
```
agent-orchestrator/
  ├── public/
  ├── src/
  ├── index.html
  ├── package.json
  ├── README.md
  └── ... other files
```

---

## 💻 STEP 3: Install Project Dependencies

1. **Open Terminal (Mac) or Command Prompt (Windows)**

2. **Navigate to your project folder**
   
   Type this command (replace with your actual path):
   
   **Windows:**
   ```
   cd C:\Users\YourName\Desktop\agent-orchestrator
   ```
   
   **Mac:**
   ```
   cd ~/Desktop/agent-orchestrator
   ```

3. **Install the dependencies**
   
   Type this and press Enter:
   ```
   npm install
   ```
   
   Wait 1-2 minutes. You'll see a lot of text scrolling - that's normal!

4. **Test that it works locally**
   
   Type:
   ```
   npm run dev
   ```
   
   You should see:
   ```
   VITE v6.0.3  ready in XXX ms

   ➜  Local:   http://localhost:5173/
   ```

5. **Open your browser** and go to: `http://localhost:5173`
   
   🎉 You should see your app running!

6. **Stop the server** by pressing `Ctrl + C` in the terminal

---

## 🐙 STEP 4: Create a GitHub Account

GitHub is like Google Drive but for code. We'll use it to store your project.

1. Go to https://github.com
2. Click **"Sign up"**
3. Enter your email
4. Create a password
5. Choose a username
6. Verify you're human
7. Click **"Create account"**
8. Check your email and verify your account

---

## 📤 STEP 5: Upload Your Project to GitHub

### Option A: Using GitHub's Website (Easiest for Beginners)

1. **Go to GitHub** and sign in
2. Click the **"+"** button in the top right corner
3. Click **"New repository"**
4. Name it: `agent-orchestrator`
5. Make sure **"Public"** is selected
6. Click **"Create repository"**
7. You'll see a page with instructions - keep this open!

8. **Install Git** (if you haven't)
   - Windows: Go to https://git-scm.com/download/win and install
   - Mac: Open Terminal and type: `xcode-select --install`

9. **Go back to Terminal/Command Prompt** (make sure you're in the project folder)

10. **Run these commands ONE BY ONE:**

    ```
    git init
    ```
    (Press Enter, wait for it to finish)

    ```
    git add .
    ```
    (Press Enter, wait for it to finish)

    ```
    git commit -m "First upload"
    ```
    (Press Enter, wait for it to finish)

    ```
    git branch -M main
    ```
    (Press Enter)

    ```
    git remote add origin https://github.com/YOUR-USERNAME/agent-orchestrator.git
    ```
    ⚠️ **IMPORTANT:** Replace `YOUR-USERNAME` with your actual GitHub username!
    
    (Press Enter)

    ```
    git push -u origin main
    ```
    (Press Enter)

11. **If asked for username/password:**
    - Username: Your GitHub username
    - Password: You need to create a "Personal Access Token" (see troubleshooting below)

12. **Refresh your GitHub page** - you should see all your files there!

---

## 🌐 STEP 6: Deploy with Vercel (The Magic Step!)

Vercel is a service that puts your website online for free.

1. **Go to** https://vercel.com
2. Click **"Sign Up"**
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub
5. Click **"Add New..."** → **"Project"**
6. Find **`agent-orchestrator`** in the list
7. Click **"Import"**
8. Leave all settings as they are (Vercel auto-detects everything!)
9. Click **"Deploy"**
10. **Wait 1-2 minutes** - you'll see a progress screen
11. 🎉 **DONE!** Vercel will show you your live URL!

**Your app is now at:** `https://agent-orchestrator-xxxx.vercel.app`

---

## 🔑 STEP 7: Get Your Google AI API Key

Your app needs an API key to talk to Google's AI.

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Click **"Copy"** to copy the key
5. **Go to your deployed app**
6. **Paste the API key** in the "API Key" field in the sidebar
7. 🎉 **You're all set!**

---

## 🎊 YOU DID IT!

Your AgentOrchestrator is now live on the internet! Share the URL with anyone!

**What you accomplished:**
- ✅ Installed Node.js
- ✅ Set up a GitHub account
- ✅ Uploaded your code to GitHub
- ✅ Deployed your app to Vercel
- ✅ Got your AI API key

---

## ❓ TROUBLESHOOTING

### "npm: command not found"
- Node.js isn't installed properly
- Try restarting your computer after installing Node.js
- Re-download and install from https://nodejs.org

### GitHub asks for a password but won't accept it
GitHub no longer accepts regular passwords. You need a "Personal Access Token":
1. Go to GitHub → Click your profile picture → Settings
2. Scroll down to "Developer settings" (left sidebar, at the bottom)
3. Click "Personal access tokens" → "Tokens (classic)"
4. Click "Generate new token" → "Generate new token (classic)"
5. Give it a name like "my computer"
6. Check the box next to "repo"
7. Click "Generate token"
8. **COPY THE TOKEN NOW** (you won't see it again!)
9. Use this token as your password when Git asks

### "Error: EACCES: permission denied"
- On Mac/Linux, try: `sudo npm install`
- On Windows, run Command Prompt as Administrator

### The app shows a blank page after deployment
- Wait 5 minutes and try again
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check Vercel dashboard for error messages

### CORS errors when using the AI
- Make sure "Enable CORS Proxy" is checked in the app sidebar
- Try a different CORS proxy from the dropdown

---

## 🔄 HOW TO UPDATE YOUR APP

Made changes? Here's how to update the live version:

1. Make your changes to the files
2. Open Terminal in the project folder
3. Run these commands:
   ```
   git add .
   git commit -m "Updated the app"
   git push
   ```
4. **Vercel automatically redeploys!** Wait 1-2 minutes.

---

## 📧 NEED HELP?

If you're stuck:
1. Read the error message carefully
2. Copy the error and search Google for it
3. Check the GitHub/Vercel documentation
4. Most problems have been solved by someone else before!

---

**Congratulations on deploying your first web app! 🎉**
