import { useState, useEffect } from "react";
import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { useTrainModel, useGetModelRecommendation, getGetModelRecommendationQueryKey } from "@workspace/api-client-react";
import { Loader2, Terminal, Play, Cpu, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function Stage6() {
  const { sessionId } = useParams();
  const { toast } = useToast();

  const [result, setResult] = useState<any>(null);

  const { data: recData } = useGetModelRecommendation(sessionId || "", {
    query: {
      enabled: !!sessionId,
      queryKey: getGetModelRecommendationQueryKey(sessionId || "")
    }
  });

  const trainMutation = useTrainModel();

  if (!sessionId || sessionId === "new") {
    return <Redirect to="/" />;
  }

  const handleTrain = async () => {
    if (!recData?.recommended) return;
    
    try {
      const res = await trainMutation.mutateAsync({
        sessionId,
        data: {
          modelType: recData.recommended as any
        }
      });
      setResult(res);
      toast({
        title: "Model Trained Successfully",
        description: `Achieved ${(res.accuracy * 100).toFixed(2)}% accuracy on test set.`,
      });
    } catch (err: any) {
      toast({
        title: "Training Failed",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={6}
      title="Model Training"
      description="Initialize training sequence and monitor model convergence."
      nextDisabled={!result}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* Left Col: Controls & Terminal */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {!result && !trainMutation.isPending && (
            <div className="glass-panel p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
              <Cpu className="w-16 h-16 text-primary/50 mb-6" />
              <h3 className="font-bold text-lg uppercase tracking-wider mb-2">Ready for Execution</h3>
              <p className="text-sm text-muted-foreground mb-8">Model parameters configured. Waiting for initialization signal.</p>
              
              <button
                onClick={handleTrain}
                className="w-full py-4 bg-primary text-primary-foreground uppercase font-bold tracking-widest rounded-md hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Initiate Training
              </button>
            </div>
          )}

          {trainMutation.isPending && (
            <div className="glass-panel p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                <Cpu className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="font-bold text-lg uppercase tracking-wider mb-2 text-primary animate-pulse">Training in Progress</h3>
              <p className="text-sm text-muted-foreground font-mono">Computing prior probabilities...</p>
            </div>
          )}

          {(result || trainMutation.isPending) && (
             <div className="glass-panel border-muted bg-background/50 rounded-md overflow-hidden flex flex-col flex-1 min-h-[400px]">
             <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-2">
               <Terminal className="w-4 h-4 text-primary" />
               <span className="text-xs font-mono uppercase text-muted-foreground">Execution Shell</span>
             </div>
             <div className="p-4 overflow-y-auto font-mono text-xs space-y-2 flex-1 text-primary/70">
               {result ? (
                 <>
                  {result.logs.map((log: string, i: number) => (
                    <div key={i} className="animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                      &gt; {log}
                    </div>
                  ))}
                  <div className="text-green-500 font-bold mt-4">&gt; PROCESS COMPLETE IN {result.trainingTime}ms</div>
                 </>
               ) : (
                  <div className="animate-pulse">
                    &gt; Initializing worker nodes...<br/>
                    &gt; Allocating memory...<br/>
                    &gt; Running fit()...
                  </div>
               )}
             </div>
           </div>
          )}
        </div>

        {/* Right Col: Results Dashboard */}
        <div className="lg:col-span-8 relative min-h-[600px]">
          <AnimatePresence>
            {!result ? (
               <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 glass-panel border-dashed border-2 border-muted flex flex-col items-center justify-center text-muted-foreground"
               >
                 <BarChart className="w-24 h-24 opacity-10 mb-4" />
                 <p className="uppercase tracking-widest font-mono text-sm">Awaiting Telemetry</p>
               </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 space-y-6"
              >
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-panel p-6 text-center border-b-4 border-b-primary">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Overall Accuracy</p>
                    <div className="text-4xl font-bold text-primary">{(result.accuracy * 100).toFixed(1)}%</div>
                  </div>
                  <div className="glass-panel p-6 text-center border-b-4 border-b-accent">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Train Set Acc</p>
                    <div className="text-3xl font-bold">{(result.trainAccuracy * 100).toFixed(1)}%</div>
                  </div>
                  <div className="glass-panel p-6 text-center border-b-4 border-b-destructive">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Test Set Acc</p>
                    <div className="text-3xl font-bold">{(result.testAccuracy * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 h-[400px]">
                  {/* Prior Probs */}
                  <div className="glass-panel p-6 flex flex-col">
                    <h3 className="text-sm uppercase font-bold tracking-widest text-muted-foreground mb-4">Class Prior Probabilities</h3>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={result.classProbabilities} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v*100).toFixed(0)}%`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <YAxis dataKey="className" type="category" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                          <RechartsTooltip formatter={(v: number) => `${(v*100).toFixed(1)}%`} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                          <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                            {result.classProbabilities.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Feature Importance */}
                  <div className="glass-panel p-6 flex flex-col">
                    <h3 className="text-sm uppercase font-bold tracking-widest text-muted-foreground mb-4">Feature Importance (Heuristic)</h3>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={result.featureImportance} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <YAxis dataKey="feature" type="category" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                          <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
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
