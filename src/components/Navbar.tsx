"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, Trash2 } from "lucide-react";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-8 mx-auto">
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight">kairos</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-1">
            Hiring intelligence for modern teams
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md border hover:bg-accent transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="flex items-center gap-2 text-xs font-medium px-4 py-2 border rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors text-muted-foreground"
            onClick={async () => {
               if (confirm('Are you sure you want to clear the entire workspace?')) {
                  localStorage.removeItem('kairos_blind_mode');
                  try {
                    await fetch('/api/workspace', {
                      method: 'POST',
                      body: JSON.stringify({ jdText: "", candidates: [] })
                    });
                  } catch (e) {
                    console.error("Failed to clear DB workspace", e);
                  }
                  window.location.reload();
               }
            }}
          >
            <Trash2 size={14} />
            Clear Workspace
          </button>

          <div className="px-3 py-1 rounded-full bg-secondary text-[10px] font-semibold border tabular">
            SaaS Edition · v2.1
          </div>
        </div>
      </div>
    </nav>
  );
}
