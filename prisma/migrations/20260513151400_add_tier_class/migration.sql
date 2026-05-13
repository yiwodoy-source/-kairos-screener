-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "tierClass" TEXT NOT NULL DEFAULT 'tier-skip',
    "seniority" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "resumeText" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Remote',
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "currentRole" TEXT NOT NULL DEFAULT 'Software Engineer',
    "nextStep" TEXT NOT NULL DEFAULT 'Archive',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Candidate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Candidate" ("createdAt", "currentRole", "id", "location", "name", "nextStep", "reasoning", "resumeText", "score", "seniority", "tier", "workspaceId", "yearsOfExperience") SELECT "createdAt", "currentRole", "id", "location", "name", "nextStep", "reasoning", "resumeText", "score", "seniority", "tier", "workspaceId", "yearsOfExperience" FROM "Candidate";
DROP TABLE "Candidate";
ALTER TABLE "new_Candidate" RENAME TO "Candidate";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
