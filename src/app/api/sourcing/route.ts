import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { keywords } = await req.json();
    const queryArgs = Array.isArray(keywords) ? keywords : [keywords];

    // Safety check: Filter out any non-string keywords
    const safeArgs = queryArgs.filter((arg: unknown) => typeof arg === 'string') as string[];

    const scriptPath = path.join(process.cwd(), "src/services/scraper_service.py");

    return new Promise<NextResponse>((resolve) => {
      // Use spawn with arguments array to prevent command injection
      const pythonProcess = spawn('python3', [scriptPath, ...safeArgs]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Scraper exited with code ${code}: ${stderr}`);
          return resolve(NextResponse.json({ error: "Scraping failed" }, { status: 500 }));
        }

        try {
          const lines = stdout.trim().split("\n");
          const lastLine = lines[lines.length - 1];
          const results = JSON.parse(lastLine);

          resolve(NextResponse.json({
            status: "success",
            results: results.map((r: { name: string; source: string; text: string }) => ({
              name: `${r.name} (${r.source})`,
              text: r.text
            }))
          }));
        } catch (e) {
          console.error("Failed to parse scraper output:", e);
          resolve(NextResponse.json({ error: "Invalid scraper output" }, { status: 500 }));
        }
      });
    });

  } catch (error) {
    console.error("Sourcing API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    active: false,
    message: "Sourcing service is idle. Use POST to start a search."
  });
}
