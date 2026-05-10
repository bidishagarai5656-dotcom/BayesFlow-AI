import { Link, useLocation } from "wouter";
import { Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  "Dataset",
  "Explore",
  "Preprocess",
  "Features",
  "Model",
  "Train",
  "Predict",
  "Evaluate",
  "History"
];

export function StageLayout({
  children,
  sessionId,
  currentStage,
  title,
  description,
  nextDisabled = false,
  onNext,
  nextLabel = "Next Stage"
}: StageLayoutProps) {
  const [, setLocation] = useLocation();

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      setLocation(`/session/${sessionId}/stage/${currentStage + 1}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      {/* Header / Progress Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-lg tracking-tighter text-primary glow-text transition-colors hover:text-primary/80">
              BAYESFLOW AI
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-mono truncate max-w-[150px]">
              {sessionId.split('-')[0]}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {STAGES.map((stage, index) => {
              const stageNum = index + 1;
              const isPast = stageNum < currentStage;
              const isCurrent = stageNum === currentStage;
              
              return (
                <div key={stage} className="flex items-center">
                  <Link 
                    href={`/session/${sessionId}/stage/${stageNum}`}
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-mono transition-all duration-300 ${
                      isCurrent 
                        ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.5)]" 
                        : isPast
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        : "bg-muted text-muted-foreground opacity-50 pointer-events-none"
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : stageNum}
                  </Link>
                  {index < STAGES.length - 1 && (
                    <div className={`w-8 h-px ${isPast ? 'bg-primary/50' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        
        <div className="mb-8 relative z-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2 uppercase">{title}</h1>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="mt-12 flex justify-between items-center relative z-10 border-t border-border pt-6 pb-12">
          <button
            className="px-6 py-2 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors uppercase tracking-widest text-sm font-semibold disabled:opacity-50"
            onClick={() => setLocation(currentStage === 1 ? '/' : `/session/${sessionId}/stage/${currentStage - 1}`)}
          >
            {currentStage === 1 ? "Cancel" : "Back"}
          </button>

          {currentStage < 9 && (
            <button
              className="px-8 py-2 bg-primary text-primary-foreground rounded-md uppercase tracking-widest text-sm font-bold shadow-[0_0_15px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)] transition-all disabled:opacity-50 disabled:pointer-events-none"
              onClick={handleNext}
              disabled={nextDisabled}
            >
              {nextLabel}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
