"use client";

import { useEffect, useState } from "react";
import { FileText, CheckCircle, Clock, Users } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function StatsBar() {
  const [statsData, setStatsData] = useState({
    total: "0",
    resolvedPct: "0%",
    avgHours: "0h",
    officers: "0"
  });

  useEffect(() => {
    // Listen to all complaints for real-time global stats
    const unsubscribeComplaints = onSnapshot(collection(db, "complaints"), (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      const total = docs.length;
      const resolved = docs.filter(d => d.status === "Resolved").length;
      const resolvedPct = total === 0 ? 0 : Math.round((resolved / total) * 100);
      
      let totalSLA = 0;
      docs.forEach(d => {
        if (d.predicted_hours) totalSLA += Number(d.predicted_hours);
      });
      const avgHours = total === 0 ? 0 : Math.round(totalSLA / total);

      setStatsData(prev => ({
        ...prev,
        total: total.toLocaleString(),
        resolvedPct: `${resolvedPct}%`,
        avgHours: `${avgHours}h`
      }));
    });

    // Listen to users collection to count active officers
    const q = query(collection(db, "users"), where("role", "==", "officer"));
    const unsubscribeOfficers = onSnapshot(q, (snapshot) => {
      setStatsData(prev => ({
        ...prev,
        officers: snapshot.docs.length.toLocaleString()
      }));
    });

    return () => {
      unsubscribeComplaints();
      unsubscribeOfficers();
    };
  }, []);

  const stats = [
    { icon: <FileText className="w-4 h-4" />, value: statsData.total, label: "Complaints Filed" },
    { icon: <CheckCircle className="w-4 h-4" />, value: statsData.resolvedPct, label: "Resolved" },
    { icon: <Clock className="w-4 h-4" />, value: statsData.avgHours, label: "Avg Resolution" },
    { icon: <Users className="w-4 h-4" />, value: statsData.officers, label: "Officers Active" },
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="glass-card rounded-xl p-4 text-center hover:border-saffron-500/20 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-saffron-500/10 text-saffron-400 mb-2 group-hover:scale-110 transition-transform">
              {stat.icon}
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
