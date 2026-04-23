"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Briefcase,
  IdCard,
  User as UserIcon,
  LogOut,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/authContext";

// ── HARDCODED ADMIN EMAIL ──
// In a real production system, this would be managed via Firebase Custom Claims.
// For this prototype, only this email gets access to the Admin panel.
const ADMIN_EMAIL = "admin@baga.gov.in";

interface OfficerRecord extends UserProfile {
  firestore_id: string;
}

export default function AdminDashboard() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all officers
    const q = query(collection(db, "users"), where("role", "==", "officer"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((d) => ({
        ...d.data(),
        firestore_id: d.id,
      })) as OfficerRecord[];

      setOfficers(all);
      setStats({
        total: all.length,
        pending: all.filter((o) => o.verification_status === "pending").length,
        approved: all.filter((o) => o.verification_status === "approved").length,
        rejected: all.filter((o) => o.verification_status === "rejected").length,
      });
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateOfficerStatus = async (firestoreId: string, status: "approved" | "rejected") => {
    setActionLoading(firestoreId + status);
    try {
      await updateDoc(doc(db, "users", firestoreId), {
        verification_status: status,
        verified_at: new Date().toISOString(),
        verified_by: user?.email,
      });
    } catch (err) {
      console.error("Error updating officer:", err);
      alert("Failed to update officer status.");
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse">
        Verifying Admin Credentials...
      </div>
    );
  }

  // Access control: only the specific admin email
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-4">Admin Access Only</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">
          This panel is restricted to BAGA system administrators only.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-red-500/20 text-red-400 px-8 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition-all"
        >
          Go to Login
        </button>
      </main>
    );
  }

  const filteredOfficers =
    filterStatus === "all"
      ? officers
      : officers.filter((o) => o.verification_status === filterStatus);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">BAGA Admin Panel</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Officer Verification Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-semibold">{user.email}</p>
              <p className="text-[10px] text-red-400 uppercase tracking-wider">SUPER ADMIN</p>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Officers", value: stats.total, color: "text-foreground", bg: "bg-secondary/50" },
            { label: "Pending Review", value: stats.pending, color: "text-yellow-400", bg: "bg-yellow-500/10 border border-yellow-500/20" },
            { label: "Approved", value: stats.approved, color: "text-emerald-400", bg: "bg-emerald-500/10 border border-emerald-500/20" },
            { label: "Rejected", value: stats.rejected, color: "text-red-400", bg: "bg-red-500/10 border border-red-500/20" },
          ].map((stat) => (
            <div key={stat.label} className={`glass-card p-4 rounded-xl ${stat.bg} text-center`}>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl w-fit mb-6">
          {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filterStatus === tab
                ? tab === "pending"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : tab === "approved"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : tab === "rejected"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-background text-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab}
              {tab !== "all" && (
                <span className="ml-2 text-xs opacity-70">({stats[tab]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Officer Cards */}
        {loading ? (
          <p className="text-center text-muted-foreground animate-pulse py-12">
            Loading officer registrations...
          </p>
        ) : filteredOfficers.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No {filterStatus === "all" ? "" : filterStatus} officers found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredOfficers.map((officer, i) => (
              <div
                key={officer.firestore_id}
                className="glass-card p-6 rounded-2xl flex flex-col gap-4 animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{officer.name}</p>
                      <p className="text-xs text-muted-foreground">{officer.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wider ${officer.verification_status === "pending"
                      ? "bg-yellow-500/15 text-yellow-400"
                      : officer.verification_status === "approved"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                      }`}
                  >
                    {officer.verification_status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <IdCard className="w-3.5 h-3.5 text-saffron-500" />
                    <span className="font-mono font-semibold text-foreground">
                      {officer.employee_id || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{officer.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {officer.city}, {officer.district}, {officer.state}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {officer.verification_status === "pending" && (
                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    <button
                      onClick={() => updateOfficerStatus(officer.firestore_id, "approved")}
                      disabled={actionLoading !== null}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {actionLoading === officer.firestore_id + "approved" ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => updateOfficerStatus(officer.firestore_id, "rejected")}
                      disabled={actionLoading !== null}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {actionLoading === officer.firestore_id + "rejected" ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                )}

                {officer.verification_status === "approved" && (
                  <div className="pt-2 border-t border-border/50">
                    <button
                      onClick={() => updateOfficerStatus(officer.firestore_id, "rejected")}
                      disabled={actionLoading !== null}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                      Revoke Access
                    </button>
                  </div>
                )}

                {officer.verification_status === "rejected" && (
                  <div className="pt-2 border-t border-border/50">
                    <button
                      onClick={() => updateOfficerStatus(officer.firestore_id, "approved")}
                      disabled={actionLoading !== null}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                    >
                      Re-approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
