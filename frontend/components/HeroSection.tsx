"use client";

import { Zap, Brain, Clock } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-16 pb-8 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron-500/10 border border-saffron-500/20 mb-6 animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-saffron-400" />
          <span className="text-xs font-medium text-saffron-400">
            Powered by Agentic AI
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 animate-slide-up">
          <span className="gradient-text">Bharat Autonomous</span>
          <br />
          <span className="text-foreground">Governance Agent</span>
        </h2>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up">
          Submit your complaint in any language. Our AI automatically
          identifies the issue, routes it to the correct{" "}
          <span className="text-saffron-400 font-medium">government department</span>,
          and predicts resolution time.
        </p>

        <div className="flex flex-wrap justify-center gap-6 animate-fade-in">
          <Feature icon={<Brain className="w-4 h-4" />} text="AI Classification" />
          <Feature icon={<Zap className="w-4 h-4" />} text="Auto Routing" />
          <Feature icon={<Clock className="w-4 h-4" />} text="Time Prediction" />
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="text-saffron-400">{icon}</div>
      <span>{text}</span>
    </div>
  );
}
