# Kairos | Hiring Intelligence for Modern Teams

Kairos is a premium, AI-powered resume screening platform designed for modern recruitment teams. It allows you to analyze job descriptions, screen resumes, and gain deep insights into your candidate pool—all within your browser.

## 🚀 Features

- **Automated Scoring**: Weighted analysis across Technical, Leadership, and Soft Skills.
- **Blind Recruitment Mode**: Redact candidate identities to eliminate unconscious bias.
- **JD Optimizer**: Detects exclusionary language and suggests inclusive alternatives.
- **Interview Intelligence**: Automatically generates tailored interview probes based on candidate skill gaps.
- **Pool Analytics**: Visualizes seniority distribution and top skills across your entire candidate set.
- **Workspace Persistence**: Automatically saves your progress to browser storage.
- **PDF Support**: Extract text directly from PDF resumes using client-side parsing.

---

## 📦 How to Deploy

Since Kairos is a static web application (HTML/CSS/JS), it can be deployed for free on several platforms in seconds.

### 1. GitHub Pages (Easiest)
1. Push this repository to GitHub.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, select the `main` branch and `/root` folder.
4. Click **Save**. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

### 2. Vercel
1. Install the Vercel CLI or connect your GitHub account at [vercel.com](https://vercel.com).
2. Import the project.
3. Vercel will automatically detect it as a static site.
4. Click **Deploy**.

### 3. Netlify
1. Log in to [netlify.com](https://netlify.com).
2. Drag and drop the project folder into the Netlify dashboard.
3. Or, connect your GitHub repository for continuous deployment.

---

## 🛠️ Local Development

To run Kairos locally with real-time sourcing:

1. **Clone the repository.**
2. **Install Sourcing Backend Dependencies:**
   ```bash
   pip install flask flask-cors playwright
   playwright install chromium
   ```
3. **Start the Frontend & Backend:**
   ```bash
   # Start the Frontend
   python3 -m http.server 3000 &

   # Start the Sourcing Service
   python3 scraper_service.py
   ```
4. Open your browser to `http://localhost:3000`.

---

## ⚖️ Ethics & Privacy
- **Client-Side Only**: All PDF parsing and analysis happen in your browser. No resume data is sent to external servers.
- **Bias Reduction**: Designed with a "Blind Mode first" philosophy to ensure merit-based hiring.

Built for Kairos · Powered by Kairos AI
