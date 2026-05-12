"use client";

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import { Search, ArrowRight, Loader2, CheckCircle2, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropzone } from 'react-dropzone';
import { extractTextFromPdf } from '@/lib/pdf';

interface CandidateResult {
  id: string;
  name: string;
  score: number;
  tier: string;
  tierClass: string;
  seniority: string;
  reasoning: string;
}

export default function Home() {
  const [jd, setJd] = useState("");
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [isScoring, setIsScoring] = useState(false);
  const [isSourcing, setIsSourcing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sourcingLogs, setSourcingLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [blindMode, setBlindMode] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('kairos_workspace');
    if (saved) {
      const { jd: savedJd, candidates: savedCandidates, blindMode: savedBlind } = JSON.parse(saved);
      setJd(savedJd || "");
      setCandidates(savedCandidates || []);
      setBlindMode(savedBlind || false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kairos_workspace', JSON.stringify({ jd, candidates, blindMode }));
  }, [jd, candidates, blindMode]);

  const handleScore = async () => {
    if (!jd) return alert("Please provide a Job Description");
    setIsScoring(true);

    // In a real app, we would process multiple resumes here
    // Mocking one result for demonstration
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        body: JSON.stringify({ jd, resume: "Senior React Developer with 5 years experience" })
      });
      const result = await response.json();
      setCandidates([{ ...result, id: Math.random().toString(36).substr(2, 9) }, ...candidates]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsScoring(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!jd) return alert("Please provide a Job Description first.");
    setIsUploading(true);

    try {
      for (const file of acceptedFiles) {
        let text = "";
        if (file.type === "application/pdf") {
          text = await extractTextFromPdf(file);
        } else {
          text = await file.text();
        }

        const response = await fetch('/api/score', {
          method: 'POST',
          body: JSON.stringify({ jd, resume: text })
        });
        const result = await response.json();
        setCandidates(prev => [{ ...result, id: Math.random().toString(36).substr(2, 9), name: file.name.split('.')[0] }, ...prev]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to process one or more files.");
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    }
  });

  const handleSourcing = async () => {
    if (!jd) return alert("Please provide a Job Description");
    setIsSourcing(true);
    setSourcingLogs(["Initializing Kairos Scraper..."]);
    setProgress(10);

    try {
        setSourcingLogs(prev => [...prev, "Connecting to external sourcing engines..."]);
        const res = await fetch('/api/sourcing', {
          method: 'POST',
          body: JSON.stringify({ keywords: jd.split(' ').slice(0, 3) })
        });

        if (!res.ok) throw new Error("Sourcing failed");

        setProgress(60);
        setSourcingLogs(prev => [...prev, "Processing raw candidate data..."]);
        const data = await res.json();

        setSourcingLogs(prev => [...prev, `Found ${data.results.length} matches. Scoring...`]);

        // Auto-score results
        const scored = await Promise.all(data.results.map(async (c: { name: string; text: string }) => {
            const scoreRes = await fetch('/api/score', { method: 'POST', body: JSON.stringify({ jd, resume: c.text }) });
            const scoreData = await scoreRes.json();
            return { ...scoreData, name: c.name, id: Math.random().toString(36).substr(2, 9) };
        }));

        setProgress(100);
        setCandidates(prev => [...scored, ...prev]);
        setSourcingLogs(prev => [...prev, "Sourcing complete!"]);
    } catch {
        setSourcingLogs(prev => [...prev, "Error: Failed to reach sourcing service"]);
    } finally {
        setIsSourcing(false);
        setTimeout(() => setProgress(0), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <div className="container max-w-7xl mx-auto px-8 py-12">
        <header className="mb-16">
          <span className="text-[11px] font-bold tracking-[0.2em] text-brand-amber uppercase">Resume Intelligence</span>
          <h1 className="serif text-5xl font-medium mt-4 mb-6">Screen smarter. Hire faster.</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Upgrade your recruitment workflow with automated ranking, bias reduction, and real-time sourcing.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Job Description</span>
            <div className="flex-1 min-h-[300px] border rounded-xl p-6 bg-card">
              <textarea
                className="w-full h-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed"
                placeholder="Paste the job description here..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Actions & Status</span>
            <div className="flex-1 border rounded-xl p-6 bg-card flex flex-col gap-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-dashed">
                <div className="flex items-center gap-3">
                   <button
                     onClick={() => setBlindMode(!blindMode)}
                     className={cn(
                       "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                       blindMode ? "bg-brand-amber" : "bg-muted"
                     )}
                   >
                     <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition", blindMode ? "translate-x-6" : "translate-x-1")} />
                   </button>
                   <span className="text-xs font-medium">Blind Recruitment Mode</span>
                </div>
                {blindMode && <CheckCircle2 className="text-brand-amber" size={16} />}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleSourcing}
                  disabled={isSourcing}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg border-2 border-brand-amber text-brand-amber text-sm font-bold hover:bg-brand-amber hover:text-white transition-all disabled:opacity-50"
                >
                  {isSourcing ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  Start Sourcing
                </button>
                <button
                  onClick={handleScore}
                  disabled={isScoring}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isScoring ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                  Quick Score
                </button>
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  "flex-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer",
                  isDragActive ? "border-brand-amber bg-brand-amber/5" : "border-muted hover:border-brand-amber/50",
                  isUploading && "opacity-50 pointer-events-none"
                )}
              >
                <input {...getInputProps()} />
                <div className="p-4 rounded-full bg-secondary">
                  {isUploading ? <Loader2 className="animate-spin text-brand-amber" size={32} /> : <CloudUpload className="text-muted-foreground" size={32} />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Drop resumes here or click to upload</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">PDF or TXT files supported</p>
                </div>
              </div>

              {isSourcing && (
                <div className="mt-auto space-y-3">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                        <span>Scraper Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-brand-amber transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="bg-black text-green-500 font-mono text-[10px] p-3 rounded border border-white/10 max-h-[100px] overflow-y-auto">
                        {sourcingLogs.map((log, index) => <div key={index}>&gt; {log}</div>)}
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {candidates.length > 0 && (
          <section className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-center justify-between mb-8">
                <h2 className="serif text-3xl">Ranked Candidates</h2>
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase">{candidates.length} Found</span>
             </div>

             <div className="grid gap-6">
                {candidates.map((c) => (
                  <div key={c.id} className="group relative border rounded-xl p-6 bg-card hover:border-brand-amber transition-all overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">{blindMode ? `Candidate ${c.id.toUpperCase()}` : c.name}</h3>
                        <div className="flex items-center gap-3">
                           <span className="text-xs text-muted-foreground">{c.seniority} Level</span>
                           <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                           <span className={cn("text-xs font-bold uppercase tracking-widest",
                             c.tier === 'Strong match' ? 'text-green-500' : 'text-brand-amber'
                           )}>{c.tier}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl tabular font-bold serif">{c.score}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Match Score</div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t flex flex-col lg:flex-row gap-8">
                       <div className="flex-1 space-y-4">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reasoning</div>
                          <p className="text-sm leading-relaxed text-muted-foreground">{c.reasoning}</p>
                       </div>
                       <button className="self-end lg:self-center px-4 py-2 text-xs font-bold border rounded-lg hover:bg-secondary transition-colors">
                          View Profile Details
                       </button>
                    </div>
                  </div>
                ))}
             </div>
          </section>
        )}
      </div>

      <footer className="border-t py-12 px-8 flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
        <div>Built for Kairos · Powered by Kairos AI · 2026 SaaS Edition</div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span>Infrastructure Operational</span>
        </div>
      </footer>
    </main>
  );
}
