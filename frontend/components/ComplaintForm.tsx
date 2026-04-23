"use client";

import { useState } from "react";
import { Send, Loader2, AlertCircle, Sparkles, MapPin } from "lucide-react";
import type { ComplaintResult } from "@/app/page";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/lib/authContext";
const FLASK_API = process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5000";

const EXAMPLE_COMPLAINTS = [
  "Ward 12 mein paani nahi aa raha hai subah se, pipeline leak ho gayi hai",
  "Bijli 4 ghante se gayi hai, transformer se dhuaan aa raha hai — bahut khatarnak",
  "MG Road pe bada sa pothole hai, kal ek auto palat gaya wahan",
  "Hamare gaon ka handpump kharab hai, 3 din se paani nahi",
  "Colony mein kachra 1 hafte se nahi uthaya gaya, naali bhi band hai",
];

interface Props {
  onSubmit: (result: ComplaintResult) => void;
}

export default function ComplaintForm({ onSubmit }: Props) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim() || text.trim().length < 10) {
      setError("Please provide at least 10 characters describing your issue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${FLASK_API}/process-complaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();

      const complaint: ComplaintResult = {
        id: `BAGA-${Date.now().toString(36).toUpperCase()}`,
        raw_text: text.trim(),
        issue_category: data.issue_category,
        jurisdiction_level: data.jurisdiction_level,
        assigned_department: data.assigned_department,
        officer_title: data.officer_title,
        priority_level: data.priority_level,
        predicted_hours: data.predicted_hours,
        status: data.status || "Routed",
        processed_at: data.processed_at,
        created_at: new Date().toISOString(),
      };

      // Write to Firestore with citizen's verified location
      const citizenUid = user?.uid || "anonymous";
      await addDoc(collection(db, "complaints"), {
        ...complaint,
        citizen_uid: citizenUid,
        // Location fields from citizen's verified profile
        citizen_state: profile?.state || null,
        citizen_district: profile?.district || null,
        citizen_city: profile?.city || null,
      });

      onSubmit(complaint);
      setText("");
    } catch (err: any) {
      setError(err.message || "Failed to process complaint. Is the Flask backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">File a Complaint</h3>
            <p className="text-xs text-muted-foreground">
              Describe your issue in Hindi, English, or Hinglish
            </p>
          </div>
        </div>

        {/* Location badge */}
        {profile?.city && (
          <div className="flex items-center gap-2 text-xs bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5 mb-5">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-blue-300">
              Filing as citizen of <strong>{profile.city}, {profile.district}</strong> — {profile.state}
            </span>
          </div>
        )}

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="complaint-input"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            placeholder="Describe your civic complaint here... e.g. 'Hamare area mein paani nahi aa raha hai subah se'"
            rows={5}
            disabled={loading}
            className="w-full resize-none rounded-xl bg-secondary/50 border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-saffron-500/40 focus:border-saffron-500/40 transition-all disabled:opacity-50"
          />
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground/50">
            {text.length} chars
          </div>
        </div>

        {/* Example complaints */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">
            💡 Try an example:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_COMPLAINTS.map((ex, i) => (
              <button
                key={i}
                onClick={() => setText(ex)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary/80 border border-border/50 text-muted-foreground hover:text-foreground hover:border-saffron-500/30 transition-all truncate max-w-[280px] disabled:opacity-50"
              >
                {ex.substring(0, 50)}...
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          id="submit-complaint"
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-semibold shadow-lg shadow-saffron-500/25 hover:shadow-saffron-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 spinner" />
              AI is analyzing your complaint...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit & Route via AI
            </>
          )}
        </button>

        {loading && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-saffron-400 animate-pulse" />
              Parsing complaint with LangChain AI...
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
              Mapping to Indian governance authority...
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "1s" }} />
              Predicting resolution time with ML model...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
