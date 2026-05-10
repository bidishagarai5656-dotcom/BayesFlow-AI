import { Link, useLocation } from "wouter";
import { Check, ChevronRight, Sun, Moon, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { GuidanceAssistant } from "@/components/shared/GuidanceAssistant";

interface StageLayoutProps {
  children: React.ReactNode;
  sessionId: string;
  currentStage: number;
  title: string;
  description: string;
  nextDisabled?: boolean;
  onNext?: () => void;
  nextLabel?: string;
}

const STAGES = [
  { short: "Data", full: "Dataset Selection" },
  { short: "Explore", full: "Exploration" },
  { short: "Prep", full: "Preprocessing" },
  { short: "Features", full: "Feature Selection" },
  { short: "Model", full: "Model Selection" },
  { short: "Train", full: "Training" },
  { short: "Predict", full: "Prediction" },
  { short: "Eval", full: "Evaluation" },
  { short: "History", full: "Analytics" },
];

export function StageLayout({
  children,
  sessionId,
  currentStage,
  title,
  description,
  nextDisabled = false,
  onNext,
  nextLabel = "Next Stage",
}: StageLayoutProps) {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      setLocation(`/session/${sessionId}/stage/${currentStage + 1}`);
    }
  };

  const progressPct = ((currentStage - 1) / (STAGES.length - 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      {/* ── Top progress bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-border">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md mt-0.5">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Left: Logo + session */}
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/" className="flex items-center gap-1.5 font-bold text-base tracking-tighter text-primary glow-text hover:opacity-80 transition-opacity flex-shrink-0">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">BAYESFLOW AI</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[90px] sm:max-w-[160px]">
              {sessionId.split("-")[0]}
            </span>
          </div>

          {/* Center: Stage progress pills */}
          <div className="hidden lg:flex items-center gap-0.5">
            {STAGES.map((stage, index) => {
              const stageNum = index + 1;
              const isPast = stageNum < currentStage;
              const isCurrent = stageNum === currentStage;

              return (
                <div key={stage.short} className="flex items-center">
                  <Link
                    href={`/session/${sessionId}/stage/${stageNum}`}
                    title={stage.full}
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-mono font-bold transition-all duration-300 ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.5)] stage-complete-pulse"
                        : isPast
                        ? "bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40"
                        : "bg-muted text-muted-foreground opacity-40 pointer-events-none"
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3" /> : stageNum}
                  </Link>
                  {index < STAGES.length - 1 && (
                    <div
                      className={`w-5 h-px transition-colors duration-500 ${isPast ? "bg-primary/50" : "bg-border"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile: Stage counter */}
          <div className="lg:hidden text-xs font-mono text-muted-foreground flex-shrink-0">
            Stage {currentStage}/{STAGES.length}
          </div>

          {/* Right: Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-border hover:bg-secondary/50 transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>

        {/* Mobile stage pills */}
        <div className="lg:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto no-scrollbar">
          {STAGES.map((stage, index) => {
            const stageNum = index + 1;
            const isPast = stageNum < currentStage;
            const isCurrent = stageNum === currentStage;
            return (
              <Link
                key={stage.short}
                href={`/session/${sessionId}/stage/${stageNum}`}
                className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isPast
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground opacity-40 pointer-events-none"
                }`}
              >
                {isPast ? "✓" : stageNum} {stage.short}
              </Link>
            );
          })}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 container mx-auto px-4 py-8 relative max-w-7xl">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent opacity-60" />

        {/* Page header */}
        <div className="mb-6 relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
            <span className="text-primary">Stage {currentStage}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{STAGES[currentStage - 1]?.full}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 uppercase leading-tight">
            {title}
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl">{description}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="relative z-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* ── Footer nav ── */}
        <div className="mt-12 flex justify-between items-center relative z-10 border-t border-border pt-6 pb-16">
          <button
            className="px-5 py-2 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors uppercase tracking-widest text-xs font-semibold"
            onClick={() =>
              setLocation(
                currentStage === 1 ? "/" : `/session/${sessionId}/stage/${currentStage - 1}`
              )
            }
          >
            {currentStage === 1 ? "← Home" : "← Back"}
          </button>

          {currentStage < 9 && (
            <motion.button
              whileHover={nextDisabled ? {} : { scale: 1.02 }}
              whileTap={nextDisabled ? {} : { scale: 0.98 }}
              className="px-8 py-2.5 bg-primary text-primary-foreground rounded-md uppercase tracking-widest text-xs font-bold shadow-[0_0_15px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)] transition-all disabled:opacity-40 disabled:pointer-events-none"
              onClick={handleNext}
              disabled={nextDisabled}
            >
              {nextLabel} →
            </motion.button>
          )}
        </div>
      </main>

      {/* ── Floating AI Guidance ── */}
      <GuidanceAssistant stage={currentStage} />
    </div>
  );
}
