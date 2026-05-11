document.addEventListener('DOMContentLoaded', () => {
    // Configure PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    const scoreBtn = document.getElementById('score-btn');
    const resultsSection = document.getElementById('results-section');
    const candidateList = document.getElementById('candidate-list');
    const candidateCount = document.getElementById('candidate-count');
    const jdTextarea = document.querySelector('.input-container:first-child .writing-surface');
    const resumeContainer = document.querySelector('.input-container:last-child .writing-surface');
    const jdUpload = document.getElementById('jd-upload');
    const resumeUpload = document.getElementById('resume-upload');
    const exportBtn = document.querySelector('.results-header .btn-secondary');
    const blindModeToggle = document.getElementById('blind-mode');
    const resetBtn = document.getElementById('reset-btn');
    const tabList = document.getElementById('tab-list');
    const tabAnalytics = document.getElementById('tab-analytics');
    const listContainer = document.getElementById('candidate-list-container');
    const analyticsView = document.getElementById('analytics-view');
    const jdFeedback = document.getElementById('jd-feedback');

    let processedCandidates = [];

    // --- Persistence ---
    function saveToStorage() {
        const data = {
            jd: jdTextarea.value,
            candidates: processedCandidates,
            blindMode: blindModeToggle.checked
        };
        localStorage.setItem('kairos_workspace', JSON.stringify(data));
    }

    function loadFromStorage() {
        const saved = localStorage.getItem('kairos_workspace');
        if (saved) {
            const data = JSON.parse(saved);
            jdTextarea.value = data.jd || '';
            if (jdTextarea.value) analyzeJD(jdTextarea.value);
            processedCandidates = data.candidates || [];
            blindModeToggle.checked = !!data.blindMode;

            if (processedCandidates.length > 0) {
                resultsSection.style.display = 'block';
                // Trigger the 'All' tab to ensure it is active
                const allTab = document.querySelector('.filter-tab[data-view="list"]');
                if (allTab) allTab.click();
                renderAnalytics();
            }
        }
    }

    // --- File Handling ---

    async function extractTextFromPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        return fullText;
    }

    function handleFileUpload(uploadEl, targetEl, isJD) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        if (!isJD) input.multiple = true;

        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (isJD && files[0]) {
                const text = await extractTextFromPDF(files[0]);
                targetEl.value = text;
                uploadEl.querySelector('span').innerText = files[0].name;
            } else if (!isJD && files.length > 0) {
                targetEl.innerHTML = ''; // Clear placeholder
                for (const file of files) {
                    const text = await extractTextFromPDF(file);
                    const fileTag = document.createElement('div');
                    fileTag.className = 'candidate-tag';
                    fileTag.style = "background: #F1F5F9; padding: 4px 12px; border-radius: 6px; margin: 4px; display: inline-block; font-size: 13px; border: 1px solid #E2E8F0;";
                    fileTag.innerText = `📄 ${file.name}`;
                    fileTag.dataset.text = text;
                    fileTag.dataset.name = file.name.replace('.pdf', '');
                    targetEl.appendChild(fileTag);
                }
                uploadEl.querySelector('span').innerText = `${files.length} files selected`;
            }
        };
        input.click();
    }

    jdUpload.addEventListener('click', () => handleFileUpload(jdUpload, jdTextarea, true));
    resumeUpload.addEventListener('click', () => handleFileUpload(resumeUpload, resumeContainer, false));

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire workspace?')) {
            localStorage.removeItem('kairos_workspace');
            location.reload();
        }
    });

    blindModeToggle.addEventListener('change', () => {
        if (processedCandidates.length > 0) {
            renderCandidates(processedCandidates);
            renderAnalytics();
        }
        saveToStorage();
    });

    tabList.addEventListener('click', () => {
        tabList.classList.add('active');
        tabAnalytics.classList.remove('active');
        listContainer.style.display = 'block';
        analyticsView.style.display = 'none';
    });

    tabAnalytics.addEventListener('click', () => {
        tabAnalytics.classList.add('active');
        tabList.classList.remove('active');
        listContainer.style.display = 'none';
        analyticsView.style.display = 'block';
        renderAnalytics();
    });

    // --- Scoring Logic ---

    function calculateScore(jd, resume) {
        const jdLower = jd.toLowerCase();
        const resumeLower = resume.toLowerCase();
        
        const skillCategories = {
            technical: ['javascript', 'python', 'react', 'node.js', 'sql', 'aws', 'docker', 'typescript', 'architecture', 'c++', 'java', 'go', 'rust', 'kubernetes', 'terraform'],
            leadership: ['management', 'leadership', 'mentoring', 'lead', 'principal', 'strategy', 'roadmap', 'stakeholders'],
            softSkills: ['agile', 'communication', 'teamwork', 'problem solving', 'collaboration', 'adaptability']
        };

        let weights = { technical: 0.6, leadership: 0.2, softSkills: 0.2 };
        let categoryScores = { technical: 0, leadership: 0, softSkills: 0 };
        let matchedSkills = [];
        let missingSkills = [];

        Object.keys(skillCategories).forEach(cat => {
            const skills = skillCategories[cat];
            let catMatches = 0;
            let catTotal = 0;

            skills.forEach(skill => {
                const inJD = jdLower.includes(skill);
                if (inJD) {
                    catTotal++;
                    if (resumeLower.includes(skill)) {
                        catMatches++;
                        matchedSkills.push(skill);
                    } else {
                        missingSkills.push(skill);
                    }
                }
            });

            categoryScores[cat] = catTotal > 0 ? (catMatches / catTotal) : 0.5; // Neutral if not specified in JD
        });

        // Weighted final score
        let finalScore = Math.round(
            (categoryScores.technical * weights.technical +
             categoryScores.leadership * weights.leadership +
             categoryScores.softSkills * weights.softSkills) * 100
        );

        // Cap score and add some variety based on keyword density
        finalScore = Math.min(98, Math.max(15, finalScore));
        
        let tier = "Skip";
        let tierClass = "tier-skip";
        if (finalScore > 80) { tier = "Strong match"; tierClass = "tier-strong"; }
        else if (finalScore > 50) { tier = "Maybe"; tierClass = "tier-maybe"; }

        // Experience / Seniority detection (Simulation)
        const seniorityKeywords = {
            senior: ['senior', 'lead', 'principal', 'architect', 'staff', 'manager', 'director'],
            junior: ['junior', 'intern', 'associate', 'entry', 'trainee']
        };

        let seniority = "Mid-level";
        if (seniorityKeywords.senior.some(k => resumeLower.includes(k))) seniority = "Senior";
        else if (seniorityKeywords.junior.some(k => resumeLower.includes(k))) seniority = "Junior";

        const topMatched = matchedSkills.slice(0, 3).join(', ');
        const reasoning = `Candidate shows ${finalScore}% alignment at a ${seniority} level. ${matchedSkills.length > 0 ? `Strong presence of ${topMatched}.` : 'Limited direct skill overlap.'} Matches well in ${categoryScores.technical > 0.7 ? 'technical' : 'foundational'} requirements.`;

        // Automation: Outreach & Interview Questions
        const questions = missingSkills.length > 0
            ? missingSkills.slice(0, 2).map(s => `How have you approached ${s} in previous roles, even if not explicitly listed on your profile?`)
            : [`Tell us about a time you scaled a ${matchedSkills[0] || 'technical'} system.`];

        const outreach = tier === "Strong match"
            ? `Hi Candidate, we were impressed by your ${topMatched} experience and would love to chat...`
            : `Hi Candidate, thanks for applying. While we see your background in ${matchedSkills[0] || 'technology'}, we are looking for...`;

        return {
            score: finalScore,
            tier,
            tierClass,
            matchedSkills,
            missingSkills,
            reasoning,
            questions,
            outreach,
            seniority
        };
    }

    // --- Auto-Analysis Trigger ---
    function analyzeJD(text) {
        const biasWords = {
            'rockstar': 'Inclusive alternative: "Highly skilled engineer"',
            'ninja': 'Inclusive alternative: "Expert" or "Specialist"',
            'crush it': 'Inclusive alternative: "Succeed" or "Excel"',
            'competitive': 'Consider: "Collaborative" or "Growth-oriented" if appropriate',
            'dominate': 'Consider: "Lead" or "Pioneer"'
        };

        const findings = [];
        Object.keys(biasWords).forEach(word => {
            if (text.toLowerCase().includes(word)) {
                findings.push(`⚠️ <b>${word}</b>: ${biasWords[word]}`);
            }
        });

        if (findings.length > 0) {
            jdFeedback.style.display = 'block';
            jdFeedback.innerHTML = `
                <div style="background: var(--warning-bg); color: var(--warning); padding: 12px; border-radius: var(--radius-md); border: 1px solid #FFE4A6;">
                    <div class="uppercase-label" style="color: var(--warning); margin-bottom: 8px;">JD OPTIMIZER FINDINGS</div>
                    ${findings.map(f => `<p style="margin-bottom: 4px;">${f}</p>`).join('')}
                </div>
            `;
        } else if (text.trim().length > 0) {
            jdFeedback.style.display = 'block';
            jdFeedback.innerHTML = `
                <div style="background: var(--success-bg); color: var(--success); padding: 12px; border-radius: var(--radius-md); border: 1px solid #B7E4C7;">
                    <div class="uppercase-label" style="color: var(--success); margin-bottom: 0;">✅ JD looks inclusive and balanced.</div>
                </div>
            `;
        } else {
            jdFeedback.style.display = 'none';
        }
    }

    function checkAutoScore() {
        const jd = jdTextarea.value.trim();
        const candidates = resumeContainer.querySelectorAll('.candidate-tag');
        if (jd.length > 50 && candidates.length > 0) {
            scoreBtn.click();
        }
    }

    jdTextarea.addEventListener('input', debounce(() => {
        analyzeJD(jdTextarea.value);
        checkAutoScore();
        saveToStorage();
    }, 2000));

    // Observer for candidates container (since tags are added dynamically)
    const observer = new MutationObserver(() => checkAutoScore());
    observer.observe(resumeContainer, { childList: true });

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- Actions ---

    if (scoreBtn) {
        scoreBtn.addEventListener('click', async () => {
            const jd = jdTextarea.value;
            const candidatesElements = resumeContainer.querySelectorAll('.candidate-tag');
            
            if (!jd || candidatesElements.length === 0) {
                alert('Please provide a job description and at least one resume.');
                return;
            }

            scoreBtn.disabled = true;
            scoreBtn.innerHTML = `Analyzing <span class="dot-pulse">...</span>`;
            candidateList.innerHTML = '';
            resultsSection.style.display = 'block';

            processedCandidates = [];

            // Simulate staggered analysis
            for (let i = 0; i < candidatesElements.length; i++) {
                const el = candidatesElements[i];
                const res = calculateScore(jd, el.dataset.text);
                processedCandidates.push({
                    name: el.dataset.name,
                meta: res.seniority + " profile parsed from PDF",
                    ...res
                });
            }

            // Sort by score
            processedCandidates.sort((a, b) => b.score - a.score);

            setTimeout(() => {
                scoreBtn.disabled = false;
                scoreBtn.innerHTML = `Score Resumes &rarr;`;
                renderCandidates(processedCandidates);
                renderAnalytics();
                saveToStorage();
            }, 1500);
        });
    }

    function renderAnalytics() {
        const seniorityCounts = { Senior: 0, 'Mid-level': 0, Junior: 0 };
        const skillCounts = {};

        processedCandidates.forEach(c => {
            seniorityCounts[c.seniority] = (seniorityCounts[c.seniority] || 0) + 1;
            c.matchedSkills.forEach(s => {
                skillCounts[s] = (skillCounts[s] || 0) + 1;
            });
        });

        // Render Seniority Chart
        const seniorityChart = document.getElementById('seniority-chart');
        seniorityChart.innerHTML = Object.entries(seniorityCounts).map(([label, count]) => {
            const pct = processedCandidates.length > 0 ? (count / processedCandidates.length) * 100 : 0;
            return `
                <div style="font-size: 13px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>${label}</span>
                        <span class="tabular">${count}</span>
                    </div>
                    <div class="match-bar-container" style="height: 6px; background: #f0f0f0;">
                        <div class="match-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Render Skills Chart (Top 5)
        const skillsChart = document.getElementById('skills-chart');
        const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const maxSkillCount = sortedSkills.length > 0 ? sortedSkills[0][1] : 1;

        skillsChart.innerHTML = sortedSkills.map(([skill, count]) => {
            const pct = (count / maxSkillCount) * 100;
            return `
                <div style="font-size: 13px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="text-transform: capitalize;">${skill}</span>
                        <span class="tabular">${count}</span>
                    </div>
                    <div class="match-bar-container" style="height: 6px; background: #f0f0f0;">
                        <div class="match-bar-fill" style="width: ${pct}%; background: var(--brand-amber);"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- View Handling ---
    const filterTabs = document.querySelectorAll('.filter-tab[data-view="list"]');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch back to list view if in analytics
            tabList.click();

            const tier = tab.innerText;
            if (tier === 'All') {
                renderCandidates(processedCandidates);
            } else {
                const filtered = processedCandidates.filter(c => c.tier === tier);
                renderCandidates(filtered, true); // true = don't reset count
            }
        });
    });

    function renderCandidates(candidates, isFiltered = false) {
        if (!isFiltered) candidateCount.innerText = `${candidates.length} candidates`;
        candidateList.innerHTML = '';
        
        const isBlindMode = blindModeToggle.checked;

        candidates.forEach((c, index) => {
            const displayName = isBlindMode ? `Candidate ${Math.random().toString(36).substring(7).toUpperCase()}` : c.name;

            const card = document.createElement('div');
            card.className = 'candidate-card staggered-entry';
            card.innerHTML = `
                <div class="rank-num serif tabular">#${index + 1}</div>
                <div class="candidate-info">
                    <h3>${displayName}</h3>
                    <div class="candidate-meta">${isBlindMode ? "Identity redacted for bias-free screening" : c.meta}</div>
                    <div class="match-bar-container">
                        <div class="match-bar-fill" style="width: 0%;" data-target-width="${c.score}%"></div>
                    </div>
                </div>
                <div class="score-group">
                    <div class="score-value tabular">${c.score}</div>
                    <div class="tier-badge ${c.tierClass}">${c.tier}</div>
                </div>
                <div class= "card-details">
                    <div class="details-grid">
                        <div>
                            <div class="uppercase-label">MATCHED SKILLS</div>
                            <ul style="list-style: none; font-size: 13px;">
                                ${c.matchedSkills.map(s => `<li><span style="color: var(--success);">●</span> ${s}</li>`).join('')}
                            </ul>
                        </div>
                        <div>
                            <div class="uppercase-label">MISSING SKILLS</div>
                            <ul style="list-style: none; font-size: 13px;">
                                ${c.missingSkills.slice(0, 3).map(s => `<li><span style="color: var(--warning);">—</span> ${s}</li>`).join('')}
                            </ul>
                        </div>
                    </div>

                    <div class="automation-grid" style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px;">
                         <div class="automation-box">
                            <button class="copy-action" title="Copy Probes" data-copy="${c.questions.join('\n')}">
                                <i data-lucide="copy" size="14"></i>
                            </button>
                            <div class="uppercase-label">INTERVIEW PROBES</div>
                            <ul style="list-style: none; font-size: 13px; color: var(--text-secondary);">
                                ${c.questions.map(q => `<li style="margin-bottom: 8px;">• ${q}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="automation-box">
                            <button class="copy-action" title="Copy Draft" data-copy="${c.outreach}">
                                <i data-lucide="copy" size="14"></i>
                            </button>
                            <div class="uppercase-label">OUTREACH DRAFT</div>
                            <p style="font-size: 13px; color: var(--text-secondary); background: white; padding: 10px; border-radius: 6px; border: 1px solid var(--border-light);">
                                ${c.outreach}
                            </p>
                        </div>
                    </div>

                    <div class="reasoning">
                        <div class="uppercase-label">REASONING</div>
                        <p>${c.reasoning}</p>
                    </div>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.copy-action')) {
                    const btn = e.target.closest('.copy-action');
                    navigator.clipboard.writeText(btn.dataset.copy);
                    const icon = btn.querySelector('i');
                    btn.innerHTML = '<i data-lucide="check" size="14"></i>';
                    lucide.createIcons();
                    setTimeout(() => {
                        btn.innerHTML = '<i data-lucide="copy" size="14"></i>';
                        lucide.createIcons();
                    }, 2000);
                    return;
                }
                card.classList.toggle('expanded');
            });

            candidateList.appendChild(card);
            setTimeout(() => {
                card.classList.add('fade-in-visible');
                const bar = card.querySelector('.match-bar-fill');
                if (bar) bar.style.width = bar.dataset.targetWidth;
            }, index * 100);
        });

        lucide.createIcons();
    }

    // --- CSV Export ---

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (processedCandidates.length === 0) return;
            
            const csv = Papa.unparse(processedCandidates.map(c => ({
                Rank: processedCandidates.indexOf(c) + 1,
                Name: c.name,
                Score: c.score,
                Tier: c.tier,
                Reasoning: c.reasoning
            })));

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "kairos_shortlist.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Keyboard Shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') scoreBtn.click();
    });

    // Initialize
    loadFromStorage();
});

// Animations CSS
document.head.insertAdjacentHTML('beforeend', `
<style>
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .dot-pulse { animation: pulse 1s infinite; display: inline-block; }
    .candidate-tag:hover { background: #E2E8F0 !important; cursor: default; }
</style>
`);
