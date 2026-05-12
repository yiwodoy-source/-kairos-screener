export interface ScoringResult {
  score: number;
  tier: string;
  tierClass: string;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
  questions: string[];
  outreach: string;
  seniority: string;
}

export const calculateScore = (jd: string, resume: string): ScoringResult => {
  const jdLower = jd.toLowerCase();
  const resumeLower = resume.toLowerCase();

  const skillCategories = {
    technical: [
      "javascript", "python", "react", "node.js", "sql", "aws", "docker",
      "typescript", "architecture", "c++", "java", "go", "rust",
      "kubernetes", "terraform",
    ],
    leadership: [
      "management", "leadership", "mentoring", "lead", "principal",
      "strategy", "roadmap", "stakeholders",
    ],
    softSkills: [
      "agile", "communication", "teamwork", "problem solving",
      "collaboration", "adaptability",
    ],
  };

  const weights = { technical: 0.6, leadership: 0.2, softSkills: 0.2 };
  const categoryScores = { technical: 0, leadership: 0, softSkills: 0 };
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  (Object.keys(skillCategories) as Array<keyof typeof skillCategories>).forEach(
    (cat) => {
      const skills = skillCategories[cat];
      let catMatches = 0;
      let catTotal = 0;

      skills.forEach((skill) => {
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

      categoryScores[cat] = catTotal > 0 ? catMatches / catTotal : 0.5;
    }
  );

  let finalScore = Math.round(
    (categoryScores.technical * weights.technical +
      categoryScores.leadership * weights.leadership +
      categoryScores.softSkills * weights.softSkills) *
      100
  );

  finalScore = Math.min(98, Math.max(15, finalScore));

  let tier = "Skip";
  let tierClass = "tier-skip";
  if (finalScore > 80) {
    tier = "Strong match";
    tierClass = "tier-strong";
  } else if (finalScore > 50) {
    tier = "Maybe";
    tierClass = "tier-maybe";
  }

  const seniorityKeywords = {
    senior: ["senior", "lead", "principal", "architect", "staff", "manager", "director"],
    junior: ["junior", "intern", "associate", "entry", "trainee"],
  };

  let seniority = "Mid-level";
  if (seniorityKeywords.senior.some((k) => resumeLower.includes(k))) seniority = "Senior";
  else if (seniorityKeywords.junior.some((k) => resumeLower.includes(k))) seniority = "Junior";

  const topMatched = matchedSkills.slice(0, 3).join(", ");
  const reasoning = `Candidate shows ${finalScore}% alignment at a ${seniority} level. ${
    matchedSkills.length > 0
      ? `Strong presence of ${topMatched}.`
      : "Limited direct skill overlap."
  } Matches well in ${
    categoryScores.technical > 0.7 ? "technical" : "foundational"
  } requirements.`;

  const questions =
    missingSkills.length > 0
      ? missingSkills
          .slice(0, 2)
          .map(
            (s) =>
              `How have you approached ${s} in previous roles, even if not explicitly listed on your profile?`
          )
      : [`Tell us about a time you scaled a ${matchedSkills[0] || "technical"} system.`];

  const outreach =
    tier === "Strong match"
      ? `Hi Candidate, we were impressed by your ${topMatched} experience and would love to chat...`
      : `Hi Candidate, thanks for applying. While we see your background in ${
          matchedSkills[0] || "technology"
        }, we are looking for...`;

  return {
    score: finalScore,
    tier,
    tierClass,
    matchedSkills,
    missingSkills,
    reasoning,
    questions,
    outreach,
    seniority,
  };
};
