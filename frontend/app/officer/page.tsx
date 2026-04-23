"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Shield, CheckCircle2, Clock, MapPin, ArrowRight, LogOut, XCircle } from "lucide-react";
import type { ComplaintResult } from "@/app/page";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

const DEPARTMENTS = [
  "Municipal Water Works Department",
  "Municipal Solid Waste Management",
  "Municipal Public Works Department",
  "Gram Panchayat",
  "Zilla Parishad / State PWD",
  "State Electricity Board (MSEDCL/MSEB)"
];

export default function OfficerDashboard() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);
  const [complaints, setComplaints] = useState<ComplaintResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Automatically select the officer's department if they have one
  useEffect(() => {
    if (profile?.department) {
      setSelectedDept(profile.department);
    }
  }, [profile]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => {
    if (!profile) return;
    setLoading(true);

    // Build query: match department AND officer's district
    const officerDistrict = profile.district;
    let q;
    if (officerDistrict) {
      q = query(
        collection(db, "complaints"),
        where("assigned_department", "==", selectedDept),
        where("citizen_district", "==", officerDistrict)
      );
    } else {
      // Fallback: no district filter (for legacy accounts)
      q = query(
        collection(db, "complaints"),
        where("assigned_department", "==", selectedDept)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        ...doc.data(),
        firestore_id: doc.id
      })) as ComplaintResult[];

      // Sort newest first
      fetched.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setComplaints(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDept, profile]);

  const updateStatus = async (id: string, newStatus: string, note?: string) => {
    try {
      const docRef = doc(db, "complaints", id);
      const payload: any = { status: newStatus };
      if (note) {
        payload.resolution_note = note;
        payload.resolved_at = new Date().toISOString();
      }
      await updateDoc(docRef, payload);
      setResolvingId(null);
      setResolutionNote("");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Check console.");
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center animate-pulse">Verifying Government Credentials...</div>;

  if (!user || profile?.role !== "officer") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-4">Restricted Government Access</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">This portal is strictly reserved for authorized government officials. Unauthorized access is prohibited.</p>
        <button onClick={() => router.push('/login')} className="bg-emerald-500/20 text-emerald-500 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-500/30 transition-all">Officer Login</button>
      </main>
    );
  }

  // Block pending / rejected officers
  if (profile.verification_status === "pending") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold mb-3">Verification Pending</h2>
        <p className="text-muted-foreground mb-4 text-center max-w-sm">Your account is awaiting admin verification. You will be notified once approved.</p>
        <button onClick={logout} className="mt-4 text-sm text-muted-foreground hover:text-foreground underline">Sign out</button>
      </main>
    );
  }

  if (profile.verification_status === "rejected") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-3">Verification Rejected</h2>
        <p className="text-muted-foreground mb-4 text-center max-w-sm">Your officer registration was rejected. Contact your department's administrative office.</p>
        <button onClick={logout} className="mt-4 text-sm text-muted-foreground hover:text-foreground underline">Sign out</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">BAGA Officer Portal</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Govt Authority Access</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-semibold">{profile?.name || "Officer"}</p>
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider">{profile?.district}, {profile?.state}</p>
            </div>
            <button 
              onClick={logout}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Dept Selector */}
        <div className="mb-8 p-6 glass-card rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-between animate-slide-down">
          <div>
            <h2 className="text-xl font-bold">Department View</h2>
            <p className="text-sm text-muted-foreground">
              Showing complaints from <span className="text-emerald-400 font-semibold">{profile?.district} district</span>, {profile?.state}
            </p>
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50"
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Complaints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <p className="text-center col-span-full text-muted-foreground animate-pulse">Loading department data...</p>
          ) : complaints.length === 0 ? (
            <div className="col-span-full text-center p-12 glass-card rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold">All Clear</h3>
              <p className="text-muted-foreground">No active complaints assigned to {selectedDept}.</p>
            </div>
          ) : (
            complaints.map((c, i) => (
              <div key={c.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono bg-secondary px-2 py-1 rounded text-muted-foreground">
                      {c.id}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.priority_level === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {c.priority_level} Priority
                    </span>
                  </div>

                  <p className="text-sm bg-secondary/30 p-3 rounded-lg border border-border/30 mb-4">
                    "{c.raw_text}"
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {c.jurisdiction_level}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      SLA: {c.predicted_hours}h
                    </div>
                  </div>
                  {/* Location badge */}
                  {(c as any).citizen_city && (
                    <div className="flex items-center gap-2 text-xs bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mb-4">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-blue-300 font-medium">{(c as any).citizen_city}, {(c as any).citizen_district}</span>
                    </div>
                  )}
                </div>

                {/* Status Controls */}
                {resolvingId === c.firestore_id ? (
                  <div className="pt-4 border-t border-border/50 animate-slide-up">
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Proof of Work</p>
                    <textarea
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Describe the actions taken (e.g., 'Pothole filled with asphalt')"
                      className="w-full bg-secondary/50 border border-border/50 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none mb-3"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setResolvingId(null); setResolutionNote(""); }}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-secondary text-muted-foreground hover:bg-secondary/80"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => updateStatus(c.firestore_id!, "Resolved", resolutionNote)}
                        disabled={resolutionNote.trim().length < 5}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Confirm Resolution
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Update Status</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(c.firestore_id!, "In-Progress")}
                        disabled={c.status === "In-Progress" || c.status === "Resolved"}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${c.status === "In-Progress" || c.status === "Resolved"
                          ? "bg-secondary/50 text-muted-foreground cursor-not-allowed opacity-50"
                          : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                          }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Start Work
                      </button>

                      <button
                        onClick={() => setResolvingId(c.firestore_id!)}
                        disabled={c.status !== "In-Progress"}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${c.status === "Resolved"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed"
                          : c.status === "Routed"
                            ? "bg-secondary/30 text-muted-foreground/50 cursor-not-allowed"
                            : "bg-secondary text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400"
                          }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {c.status === "Resolved" ? "Resolved" : "Mark Resolved"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
