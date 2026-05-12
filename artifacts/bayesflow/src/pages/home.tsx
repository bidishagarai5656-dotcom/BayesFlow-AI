import { useLocation } from "wouter";
import { useHealthCheck } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Activity, Database, Network, Zap, Sun, Moon, BookOpen, ArrowRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: health } = useHealthCheck();
  const { theme, toggleTheme } = useTheme();

  const startSession = () => {
    setLocation(`/session/new/stage/1`);
  };

  const stages = [
    { num: 1, title: "Dataset Selection", desc: "Upload CSV or choose from 4 built-in datasets" },
    { num: 2, title: "Data Exploration", desc: "Statistics, charts, and class distributions" },
    { num: 3, title: "Preprocessing", desc: "Clean, encode, and scale your data" },
    { num: 4, title: "Feature Selection", desc: "Pick inputs & set train/test split" },
    { num: 5, title: "Model Selection", desc: "Gaussian, Multinomial, or Bernoulli NB" },
    { num: 6, title: "Model Training", desc: "Watch the model learn in real-time" },
    { num: 7, title: "Prediction", desc: "Enter features, get predicted class + confidence" },
    { num: 8, title: "Evaluation", desc: "Confusion matrix, ROC curve, F1-score" },
    { num: 9, title: "Analytics", desc: "History tracking and export report" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

      {/* Header */}
      <header className="p-5 relative z-10 flex justify-between items-center border-b border-border/40">
        <div className="text-xl font-bold tracking-tighter text-primary glow-text uppercase">
          BayesFlow AI
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-mono">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-xs hidden sm:inline">
              {health?.status === "ok" ? "SYSTEM ONLINE" : "CONNECTING..."}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-border hover:bg-secondary/50 transition-colors"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-4xl text-center space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-1.5 rounded-full text-primary text-xs font-mono backdrop-blur-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            NAIVE BAYES CLASSIFICATION LABORATORY
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-tight">
            Predict the{" "}
            <span className="text-primary glow-text">Uncertain</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            An immersive, interactive Machine Learning laboratory. Explore data, train Naive Bayes
            models, and understand probability — step by step.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <motion.button
              onClick={startSession}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group relative px-8 py-4 bg-primary text-primary-foreground text-base font-bold uppercase tracking-widest overflow-hidden transition-all shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-3">
                <Zap className="w-5 h-5" />
                Initialize Experiment
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {[
            { icon: Database, title: "4 Built-in Datasets", desc: "Iris, Spam, Student Performance, Heart Disease — ready to train on instantly", color: "text-primary" },
            { icon: Network, title: "3 NB Variants", desc: "Gaussian, Multinomial & Bernoulli Naive Bayes with AI-powered recommendation", color: "text-accent" },
            { icon: Activity, title: "Educational Guidance", desc: "Theory panels + AI guide assistant at every stage — perfect for beginners", color: "text-chart-3" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className="glass-panel p-6 border-l-2 border-l-primary/50 flex flex-col gap-4 hover:border-l-primary transition-colors"
            >
              <feature.icon className={`w-7 h-7 ${feature.color}`} />
              <div>
                <h3 className="font-bold text-base uppercase tracking-wide mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Workflow stages overview */}
        <div className="mt-20 max-w-5xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8">
              9-Stage Guided Workflow
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
              {stages.map((stage, i) => (
                <motion.div
                  key={stage.num}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                  className="flex flex-col items-center gap-2 group cursor-default"
                  title={stage.desc}
                >
                  <div className="w-9 h-9 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-xs font-bold text-primary group-hover:bg-primary/20 transition-colors">
                    {stage.num}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-center text-muted-foreground leading-tight hidden md:block">
                    {stage.title.split(" ")[0]}
                  </span>
                  {i < stages.length - 1 && (
                    <div className="hidden md:block absolute" />
                  )}
                </motion.div>
              ))}
            </div>
            <div className="hidden md:flex items-center justify-center mt-3 gap-1 text-muted-foreground/30">
              {stages.map((_, i) => i < stages.length - 1 && (
                <ArrowRight key={i} className="w-3 h-3" />
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-muted-foreground/50 border-t border-border/30">
        BayesFlow AI · Interactive Naive Bayes Classification Laboratory
      </footer>
    </div>
  );
}
