import { useState } from "react";
import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { TheoryPanel } from "@/components/shared/TheoryPanel";
import { useTrainModel, useGetModelRecommendation, getGetModelRecommendationQueryKey } from "@workspace/api-client-react";
import { Loader2, Terminal, Play, Cpu, CheckCircle2, BarChart as BarChartIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function Stage6() {
  const { sessionId } = useParams();
  const { toast } = useToast();

  const [result, setResult] = useState<any>(null);

  // Prefer user's model selection from sessionStorage (set in stage-5)
  // Fall back to recommendation if not found
  const storedModel = sessionId ? (() => { try { return sessionStorage.getItem(`bayesflow_model_${sessionId}`); } catch { return null; } })() : null;

  const { data: recData } = useGetModelRecommendation(sessionId || "", {
    query: { enabled: !!sessionId && !storedModel, queryKey: getGetModelRecommendationQueryKey(sessionId || "") }
  });

  const modelType = storedModel || recData?.recommended || null;

  const trainMutation = useTrainModel();

  if (!sessionId || sessionId === "new") return <Redirect to="/" />;

  const handleTrain = async () => {
    if (!modelType) return;

    try {
      const res = await trainMutation.mutateAsync({ sessionId, data: { modelType: modelType as any } });
      setResult(res);
      toast({ title: "Model Trained", description: `${(res.accuracy * 100).toFixed(2)}% accuracy on test set.` });
    } catch (err: any) {
      toast({ title: "Training Failed", description: err.message || "An error occurred", variant: "destructive" });
    }
  };

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={6}
      title="Model Training"
      description="Initialize the training sequence and monitor the model learning from your dataset."
      nextDisabled={!result}
    >
      <TheoryPanel
        stageTitle="Model Training"
        summary="Training Naive Bayes is a single-pass operation: compute the class priors and feature likelihoods from the training data. Unlike neural networks, there's no iteration or gradient descent."
        items={[
          { title: "Class Prior P(class)", content: "The probability of each class in the training data. If 60% of emails are spam, P(spam) = 0.60. This is the starting probability before seeing any features.", type: "info" },
          { title: "Feature Likelihood P(x|class)", content: "For Gaussian NB: the mean and variance of each feature per class. For Multinomial: the feature count frequencies. These form the core of the learned model.", type: "info" },
          { title: "Laplace Smoothing", content: "Adds a small count (usually 1) to prevent zero probabilities. Without it, one unseen feature value would zero out the entire prediction.", type: "tip" },
          { title: "Training vs Test Accuracy", content: "Train accuracy shows in-sample fit; test accuracy shows generalization. A large gap (e.g., 99% train vs 70% test) indicates overfitting — the model memorized training data.", type: "warning" },
          { title: "Speed Advantage", content: "Naive Bayes training is O(n × d): linear in rows and columns. A 1M-row dataset trains in seconds — far faster than SVM, Random Forest, or Neural Networks.", type: "tip" },
          { title: "Feature Importance", content: "The heuristic importance is estimated by the variance of feature means across classes. High variance → more discriminative power between classes.", type: "info" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {modelType && !result && !trainMutation.isPending && (
            <div className="glass-panel p-4 border border-primary/20 bg-primary/5 rounded-md text-xs font-mono text-center text-primary">
              Model: <span className="font-bold uppercase">{modelType}</span>
            </div>
          )}

          {!result && !trainMutation.isPending && (
            <div className="glass-panel p-8 text-center flex flex-col items-center justify-center min-h-[280px]">
              <Cpu className="w-16 h-16 text-primary/40 mb-6" />
              <h3 className="font-bold text-base uppercase tracking-wider mb-2">Ready for Execution</h3>
              <p className="text-sm text-muted-foreground mb-8">Parameters configured. Waiting for initialization signal.</p>
              <button
                onClick={handleTrain}
                disabled={!modelType}
                className="w-full py-4 bg-primary text-primary-foreground uppercase font-bold tracking-widest rounded-md hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(var(--primary)/0.4)] disabled:opacity-40"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Initiate Training
              </button>
            </div>
          )}

          {trainMutation.isPending && (
            <div className="glass-panel p-8 text-center flex flex-col items-center justify-center min-h-[280px]">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                <Cpu className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="font-bold text-base uppercase text-primary animate-pulse mb-2">Training...</h3>
              <p className="text-xs text-muted-foreground font-mono">Computing prior probabilities...</p>
            </div>
          )}

          {result && (
            <div className="glass-panel p-6 border border-chart-3/30 bg-chart-3/5">
              <div className="flex items-center gap-2 text-chart-3 font-bold text-xs uppercase mb-3">
                <CheckCircle2 className="w-4 h-4" /> Training Complete
              </div>
              <p className="text-3xl font-bold">{(result.accuracy * 100).toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Overall Accuracy</p>
            </div>
          )}

          {(result || trainMutation.isPending) && (
            <div className="glass-panel border-muted bg-background/50 rounded-md overflow-hidden flex flex-col flex-1 min-h-[300px]">
              <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono uppercase text-muted-foreground">Execution Shell</span>
              </div>
              <div className="p-3 overflow-y-auto custom-scrollbar font-mono text-xs space-y-1.5 flex-1 text-primary/70">
                {result ? (
                  <>
                    {result.logs.map((log: string, i: number) => (
                      <div key={i} className="animate-in fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                        &gt; {log}
                      </div>
                    ))}
                    <div className="text-green-400 font-bold mt-3">&gt; COMPLETE IN {result.trainingTime}ms</div>
                  </>
                ) : (
                  <div className="animate-pulse space-y-1">
                    <div>&gt; Initializing worker nodes...</div>
                    <div>&gt; Allocating memory...</div>
                    <div>&gt; Running fit()...</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Results */}
        <div className="lg:col-span-8 relative min-h-[550px]">
          <AnimatePresence>
            {!result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 glass-panel border-dashed border-2 border-muted/40 flex flex-col items-center justify-center text-muted-foreground"
              >
                <BarChartIcon className="w-24 h-24 opacity-10 mb-4" />
                <p className="uppercase tracking-widest font-mono text-sm">Awaiting Telemetry</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 space-y-6 overflow-auto"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-panel p-5 text-center border-b-4 border-b-primary">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Overall Acc.</p>
                    <div className="text-3xl font-bold text-primary">{(result.accuracy * 100).toFixed(1)}%</div>
                  </div>
                  <div className="glass-panel p-5 text-center border-b-4 border-b-accent">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Train Acc.</p>
                    <div className="text-3xl font-bold">{(result.trainAccuracy * 100).toFixed(1)}%</div>
                  </div>
                  <div className="glass-panel p-5 text-center border-b-4 border-b-chart-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Test Acc.</p>
                    <div className="text-3xl font-bold">{(result.testAccuracy * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 h-[380px]">
                  <div className="glass-panel p-5 flex flex-col">
                    <h3 className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-3">Class Prior Probabilities</h3>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={result.classProbabilities} margin={{ top: 0, right: 30, left: 50, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <YAxis dataKey="className" type="category" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} />
                          <RechartsTooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                          <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                            {result.classProbabilities.map((_: any, i: number) => (
                              <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-panel p-5 flex flex-col">
                    <h3 className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-3">Feature Importance (Heuristic)</h3>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={result.featureImportance} margin={{ top: 0, right: 30, left: 50, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <YAxis dataKey="feature" type="category" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} />
                          <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                          <Bar dataKey="importance" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </StageLayout>
  );
}
