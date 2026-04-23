"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ComplaintForm from "@/components/ComplaintForm";
import ComplaintTracker from "@/components/ComplaintTracker";
import StatsBar from "@/components/StatsBar";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

export interface ComplaintResult {
  id?: string;
  firestore_id?: string;
  raw_text: string;
  issue_category: string;
  jurisdiction_level: string;
  assigned_department: string;
  officer_title: string;
  priority_level: string;
  predicted_hours: number;
  status: string;
  processed_at: string;
  created_at?: string;
}

export default function Home() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<ComplaintResult[]>([]);
  const [activeView, setActiveView] = useState<"submit" | "track">("submit");

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "complaints"),
      where("citizen_uid", "==", user.uid)
    );

    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const fetchedComplaints = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ComplaintResult[];
      
      // Sort in memory
      fetchedComplaints.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      
      setComplaints(fetchedComplaints);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  const addComplaint = (complaint: ComplaintResult) => {
    // No longer need to manually append, Firestore listener handles it
    setActiveView("track");
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center animate-pulse">Loading Identity Module...</div>;

  if (!user || profile?.role !== "citizen") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4">Citizen Portal Access Required</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">Please securely log in as a citizen to file complaints or track existing grievances.</p>
        <button onClick={() => router.push('/login')} className="bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-lg shadow-saffron-500/25 px-8 py-3 rounded-xl font-semibold hover:scale-[1.02] transition-all">Go to Login</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-saffron-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-saffron-500/3 rounded-full blur-3xl" />
      </div>

      <Header />
      <HeroSection />
      <StatsBar />

      {/* Tab Navigation */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex gap-2 p-1 rounded-xl bg-secondary/50 glass w-fit mx-auto">
          <button
            id="tab-submit"
            onClick={() => setActiveView("submit")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeView === "submit"
                ? "bg-primary text-primary-foreground shadow-lg shadow-saffron-500/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📝 Submit Complaint
          </button>
          <button
            id="tab-track"
            onClick={() => setActiveView("track")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeView === "track"
                ? "bg-primary text-primary-foreground shadow-lg shadow-saffron-500/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📊 Track Status ({complaints.length})
          </button>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {activeView === "submit" ? (
          <ComplaintForm onSubmit={addComplaint} />
        ) : (
          <ComplaintTracker complaints={complaints} />
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            🏛️ BAGA — Bharat Autonomous Governance Agent •
            Built for Digital India 🇮🇳
          </p>
        </div>
      </footer>
    </main>
  );
}
