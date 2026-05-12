import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, Lightbulb, AlertCircle, Info } from "lucide-react";

interface TheoryItem {
  title: string;
  content: string;
  type?: "info" | "tip" | "warning";
}

interface TheoryPanelProps {
  stageTitle: string;
  summary: string;
  items: TheoryItem[];
  defaultOpen?: boolean;
}

const iconMap = {
  info: <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />,
  tip: <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />,
  warning: <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />,
};

export function TheoryPanel({ stageTitle, summary, items, defaultOpen = false }: TheoryPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="theory-panel rounded-lg border border-primary/20 bg-primary/5 overflow-hidden mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <div className="text-left">
            <span className="text-sm font-bold uppercase tracking-wider text-primary">
              Theory & Concepts
            </span>
            <span className="text-xs text-muted-foreground ml-3 hidden sm:inline">
              — {stageTitle}
            </span>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-primary" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-primary/20">
              <p className="text-sm text-muted-foreground mt-4 mb-5 leading-relaxed italic">
                {summary}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex gap-3 bg-background/40 rounded-md p-4 border border-border/40"
                  >
                    {iconMap[item.type || "info"]}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-1">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
