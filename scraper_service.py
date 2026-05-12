import os
import time
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from playwright.sync_api import sync_playwright

app = Flask(__name__)
CORS(app)

# Global store for sourcing progress
sourcing_status = {
    "active": False,
    "progress": 0,
    "logs": [],
    "results": []
}

def run_scraper(jd_keywords):
    global sourcing_status
    sourcing_status["active"] = True
    sourcing_status["progress"] = 0
    sourcing_status["logs"] = ["Initializing headless scraper..."]
    sourcing_status["results"] = []

    try:
        with sync_playwright() as p:
            sourcing_status["logs"].append("Launching Chrome...")
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Simulate searching multiple sources
            sources = ["LinkedIn (Public Profiles)", "GitHub", "StackOverflow"]
            for i, source in enumerate(sources):
                sourcing_status["logs"].append(f"Searching {source} for keywords: {', '.join(jd_keywords[:3])}...")
                sourcing_status["progress"] = int(((i + 1) / len(sources)) * 100)

                # In a real scenario, you'd navigate and scrape here
                # page.goto(f"https://www.google.com/search?q=site:linkedin.com/in+{' '.join(jd_keywords[:3])}")
                time.sleep(2) # Simulate network delay

                mock_candidates = [
                    {"name": f"Alex Rivera ({source})", "text": "Senior Software Engineer with 8 years of experience in React and Node.js. Expert in AWS architecture."},
                    {"name": f"Jordan Smith ({source})", "text": "Lead Developer specializing in Python and Distributed Systems. Strong background in Kubernetes and DevOps."}
                ]

                for cand in mock_candidates:
                    sourcing_status["logs"].append(f"Found candidate: {cand['name']}")
                    sourcing_status["results"].append(cand)

            sourcing_status["logs"].append("Sourcing complete. Found 6 potential matches.")
            browser.close()
    except Exception as e:
        sourcing_status["logs"].append(f"Error during scraping: {str(e)}")
    finally:
        sourcing_status["active"] = False

@app.route('/start-sourcing', methods=['POST'])
def start_sourcing():
    data = request.json
    keywords = data.get('keywords', ['Software Engineer'])

    if sourcing_status["active"]:
        return jsonify({"error": "Sourcing already in progress"}), 400

    thread = threading.Thread(target=run_scraper, args=(keywords,))
    thread.start()
    return jsonify({"status": "started"})

@app.route('/sourcing-status', methods=['GET'])
def get_status():
    return jsonify(sourcing_status)

if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')
