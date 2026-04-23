"use client";

import {
  Building2, User, Clock, AlertTriangle, MapPin,
  CheckCircle2, ArrowRight, Zap, FileText
} from "lucide-react";
import type { ComplaintResult } from "@/app/page";

const priorityStyles: Record<string, string> = {
  Critical: "badge-critical",
  High: "badge-high",
  Medium: "badge-medium",
  Low: "badge-low",
};

const statusSteps = [
  { key: "Pending", label: "Submitted", icon: FileText },
  { key: "Routed", label: "AI Routed", icon: Zap },
  { key: "In-Progress", label: "In Progress", icon: ArrowRight },
  { key: "Resolved", label: "Resolved", icon: CheckCircle2 },
];

function getStatusIndex(status: string): number {
  const idx = statusSteps.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 1;
}

interface Props {
  complaints: ComplaintResult[];
}

export default function ComplaintTracker({ complaints }: Props) {
  if (complaints.length === 0) {
    return (
      <div className="animate-slide-up glass-card rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Complaints Yet</h3>
        <p className="text-sm text-muted-foreground">
          Submit your first complaint to see AI routing and tracking here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {complaints.map((c, i) => (
        <ComplaintCard key={c.id || i} complaint={c} index={i} />
      ))}
    </div>
  );
}

function ComplaintCard({ complaint: c, index }: { complaint: ComplaintResult; index: number }) {
  const currentStep = getStatusIndex(c.status);

  return (
    <div
      className="glass-card rounded-2xl p-5 sm:p-6 hover:border-saffron-500/15 transition-all duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground bg-secondary/80 px-2 py-1 rounded">
            {c.id}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityStyles[c.priority_level] || "badge-medium"}`}>
            {c.priority_level}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {c.created_at ? new Date(c.created_at).toLocaleString("en-IN") : "Just now"}
        </span>
      </div>

      {/* Complaint Text */}
      <p className="text-sm text-foreground/90 mb-5 leading-relaxed bg-secondary/30 rounded-lg p-3 border border-border/30">
        &ldquo;{c.raw_text}&rdquo;
      </p>

      {/* AI Routing Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <InfoCard
          icon={<AlertTriangle className="w-4 h-4 text-saffron-400" />}
          label="Issue Category"
          value={c.issue_category}
        />
        <InfoCard
          icon={<MapPin className="w-4 h-4 text-blue-400" />}
          label="Jurisdiction"
          value={c.jurisdiction_level}
        />
        <InfoCard
          icon={<Building2 className="w-4 h-4 text-emerald-400" />}
          label="Department"
          value={c.assigned_department}
        />
        <InfoCard
          icon={<User className="w-4 h-4 text-purple-400" />}
          label="Assigned Officer"
          value={c.officer_title}
        />
      </div>

      {/* Predicted Time */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-saffron-500/5 to-emerald-500/5 border border-saffron-500/10 mb-5">
        <Clock className="w-5 h-5 text-saffron-400" />
        <div>
          <p className="text-xs text-muted-foreground">ML Predicted Resolution</p>
          <p className="text-lg font-bold text-foreground">
            {c.predicted_hours < 24
              ? `${c.predicted_hours} hours`
              : `${(c.predicted_hours / 24).toFixed(1)} days`}
            <span className="text-xs font-normal text-muted-foreground ml-2">
              ({c.predicted_hours}h)
            </span>
          </p>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="flex items-center justify-between gap-1">
        {statusSteps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i <= currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? "bg-saffron-500 text-white shadow-lg shadow-saffron-500/30 scale-110"
                      : isActive
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-secondary/50 text-muted-foreground/40 border border-border/30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[10px] font-medium ${isCurrent ? "text-saffron-400" : isActive ? "text-emerald-400" : "text-muted-foreground/40"}`}>
                  {step.label}
                </span>
              </div>
              {i < statusSteps.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full -mt-4 mx-1 ${
                  i < currentStep ? "bg-emerald-500/40" : "bg-border/30"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
