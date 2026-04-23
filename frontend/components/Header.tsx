"use client";

import { Shield, LogOut } from "lucide-react";
import { useAuth } from "@/lib/authContext";

export default function Header() {
  const { user, profile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center shadow-lg shadow-saffron-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="gradient-text-saffron">BAGA</span>
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-widest uppercase">
              Governance Agent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-xs text-emerald-400 font-medium">AI Online</span>
          </div>
          
          {user && (
            <div className="flex items-center gap-3 ml-2 border-l border-border/50 pl-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold">{profile?.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{profile?.role}</p>
              </div>
              <button 
                onClick={logout}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
