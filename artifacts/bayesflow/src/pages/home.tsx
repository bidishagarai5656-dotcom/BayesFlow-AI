import { Link, useLocation } from "wouter";
import { useHealthCheck } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Activity, Database, Network, Zap } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: health } = useHealthCheck();

  const startSession = () => {
    // Stage 1 will create the session
    setLocation(`/session/new/stage/1`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background grids and glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px]" />

      <header className="p-6 relative z-10 flex justify-between items-center">
        <div className="text-xl font-bold tracking-tighter text-primary glow-text uppercase">
          BayesFlow AI
        </div>
        <div className="flex items-center gap-2 text-sm font-mono">
          <Activity className="w-4 h-4 text-green-500" />
          <span className="text-green-500">
            {health?.status === "ok" ? "SYSTEM ONLINE" : "CONNECTING..."}
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl text-center space-y-8"
        >
          <div className="inline-block border border-primary/30 bg-primary/5 px-4 py-1.5 rounded-full text-primary text-sm font-mono mb-4 backdrop-blur-sm">
            NAIVE BAYES CLASSIFICATION ENVIRONMENT
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-tight">
            Predict the <span className="text-primary glow-text">Uncertain</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            An immersive, interactive machine learning laboratory. Process data, train models, and visualize probability flows in real-time.
          </p>

          <div className="pt-8">
            <button
              onClick={startSession}
              className="group relative px-8 py-4 bg-primary text-primary-foreground text-lg font-bold uppercase tracking-widest rounded-none overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-3">
                <Zap className="w-5 h-5" />
                Initialize Experiment
              </span>
            </button>
          </div>
        </motion.div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          {[
            { icon: Database, title: "Data Processing", desc: "Automated cleaning and feature scaling" },
            { icon: Network, title: "Model Training", desc: "Gaussian, Multinomial & Bernoulli variants" },
            { icon: Activity, title: "Deep Evaluation", desc: "Real-time metrics and probability visualization" },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="glass-panel p-6 border-l-2 border-l-primary flex flex-col gap-4"
            >
              <feature.icon className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-bold text-lg uppercase tracking-wide">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
