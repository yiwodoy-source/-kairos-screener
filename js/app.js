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

    let processedCandidates = [];

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

    // --- Scoring Logic ---

    function calculateScore(jd, resume) {
        const jdWords = new Set(jd.toLowerCase().match(/\w+/g));
        const resumeWords = resume.toLowerCase().match(/\w+/g) || [];
        
        // Key terms extraction (mock)
        const commonSkills = ['javascript', 'python', 'react', 'node.js', 'sql', 'aws', 'docker', 'typescript', 'architecture', 'agile', 'product', 'management', 'scaling', 'performance'];
        const matchedSkills = commonSkills.filter(skill => jdWords.has(skill) && resume.toLowerCase().includes(skill));
        const missingSkills = commonSkills.filter(skill => jdWords.has(skill) && !resume.toLowerCase().includes(skill));

        // Basic keyword matching score
        let matchCount = 0;
        jdWords.forEach(word => {
            if (word.length > 4 && resume.toLowerCase().includes(word)) matchCount++;
        });

        const score = Math.min(95, Math.floor((matchCount / (jdWords.size * 0.1)) * 100));
        
        let tier = "Skip";
        let tierClass = "tier-skip";
        if (score > 85) { tier = "Strong match"; tierClass = "tier-strong"; }
        else if (score > 60) { tier = "Maybe"; tierClass = "tier-maybe"; }

        return {
            score,
            tier,
            tierClass,
            matchedSkills,
            missingSkills,
            reasoning: `Based on keyword density and skill alignment, this candidate demonstrates a ${score}% overlap with the requirements. Strong match in ${matchedSkills.slice(0, 3).join(', ')}.`
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
                    meta: "Candidate profile parsed from PDF",
                    ...res
                });
            }

            // Sort by score
            processedCandidates.sort((a, b) => b.score - a.score);

            setTimeout(() => {
                scoreBtn.disabled = false;
                scoreBtn.innerHTML = `Score Resumes &rarr;`;
                renderCandidates(processedCandidates);
            }, 1500);
        });
    }

    function renderCandidates(candidates) {
        candidateCount.innerText = `${candidates.length} candidates`;
        candidateList.innerHTML = '';
        
        candidates.forEach((c, index) => {
            const card = document.createElement('div');
            card.className = 'candidate-card staggered-entry';
            card.innerHTML = `
                <div class="rank-num serif tabular">#${index + 1}</div>
                <div class="candidate-info">
                    <h3>${c.name}</h3>
                    <div class="candidate-meta">${c.meta}</div>
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
                    <div class="reasoning">
                        <div class="uppercase-label">REASONING</div>
                        <p>${c.reasoning}</p>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });

            candidateList.appendChild(card);
            setTimeout(() => card.classList.add('fade-in-visible'), index * 100);
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
});

// Animations CSS
document.head.insertAdjacentHTML('beforeend', `
<style>
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .dot-pulse { animation: pulse 1s infinite; display: inline-block; }
    .candidate-tag:hover { background: #E2E8F0 !important; cursor: default; }
</style>
`);
