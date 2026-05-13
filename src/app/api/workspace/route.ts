
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  // For prototype/demo, allow a "default" user if not logged in
  const userId = (session?.user as any)?.id || "default-user-id";

  const workspace = await prisma.workspace.findFirst({
    where: { userId },
    include: {
      candidates: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return NextResponse.json(workspace);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // For prototype/demo, allow a "default" user if not logged in
  const userId = (session?.user as any)?.id || "default-user-id";

  const { jdText, candidates } = await req.json();

  // For this prototype, we'll maintain one primary workspace per user
  let workspace = await prisma.workspace.findFirst({
    where: { userId }
  });

  if (workspace) {
    workspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: { jdText, updatedAt: new Date() }
    });
  } else {
    workspace = await prisma.workspace.create({
      data: {
        name: "My First Workspace",
        userId,
        jdText
      }
    });
  }

  // If candidates are provided, upsert them (simplified for prototype)
  if (candidates && Array.isArray(candidates)) {
    for (const c of candidates) {
      // Check if candidate already exists in this workspace (by name for simplicity)
      const existing = await prisma.candidate.findFirst({
        where: {
            workspaceId: workspace.id,
            name: c.name
        }
      });

      if (!existing) {
        await prisma.candidate.create({
          data: {
            workspaceId: workspace.id,
            name: c.name,
            score: c.score,
            tier: c.tier,
            tierClass: c.tierClass || "tier-skip",
            seniority: c.seniority,
            reasoning: c.reasoning,
            resumeText: c.resumeText || "",
            location: c.location,
            yearsOfExperience: c.yearsOfExperience,
            currentRole: c.currentRole,
            nextStep: c.nextStep
          }
        });
      }
    }
  }

  return NextResponse.json(workspace);
}
