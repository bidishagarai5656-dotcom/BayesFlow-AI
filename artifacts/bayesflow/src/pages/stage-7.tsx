import { useState } from "react";
import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { TheoryPanel } from "@/components/shared/TheoryPanel";
import { useMakePrediction, useExploreDataset, getExploreDatasetQueryKey } from "@workspace/api-client-react";
import { Loader2, Fingerprint, Activity, Crosshair, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function Stage7() {
  const { sessionId } = useParams();
  const { toast } = useToast();

  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [prediction, setPrediction] = useState<any>(null);

  const { data: exploreData, isLoading: loadingData } = useExploreDataset(sessionId || "", {
    query: { enabled: !!sessionId, queryKey: getExploreDatasetQueryKey(sessionId || "") }
  });

  const predictMutation = useMakePrediction();

  if (!sessionId || sessionId === "new") return <Redirect to="/" />;

  const handlePredict = async () => {
    try {
      const features: Record<string, any> = {};
      exploreData?.columnStats.slice(0, -1).forEach((col) => {
        if (inputValues[col.name] !== undefined) {
          features[col.name] =
            col.dtype.includes("int") || col.dtype.includes("float")
              ? Number(inputValues[col.name])
              : inputValues[col.name];
        }
      });

      const res = await predictMutation.mutateAsync({ sessionId, data: { features } });
      setPrediction(res);
    } catch (err: any) {
      toast({ title: "Prediction Failed", description: err.message || "An error occurred", variant: "destructive" });
    }
  };

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={7}
      title="Inference Engine"
      description="Enter new feature values to get real-time predictions with class probability breakdowns."
    >
      <TheoryPanel
        stageTitle="Making Predictions"
        summary="Inference applies the learned model to new, unseen inputs. Naive Bayes computes P(class | features) for every class and returns the one with the highest posterior probability."
        items={[
          { title: "Posterior Probability", content: "P(class | x) ∝ P(class) × ∏ P(xᵢ | class). Multiply the prior by all feature likelihoods. The class with the highest product wins.", type: "info" },
          { title: "Log-Probability Trick", content: "In practice, we sum log-probabilities instead of multiplying raw probabilities. This prevents numerical underflow when many small probabilities are multiplied together.", type: "tip" },
          { title: "Confidence Score", content: "The softmax of log-probabilities gives a proper probability distribution over classes. High confidence (>90%) means the model is certain; low confidence means ambiguous input.", type: "info" },
          { title: "Try Boundary Cases", content: "Enter feature values right at the boundary between two classes to see low confidence. Outlier values often push predictions to 99%+ confidence — check if they make sense.", type: "tip" },
          { title: "All Predictions Are Logged", content: "Every prediction is stored in the database with your session ID. You can review all predictions in Stage 9 (Analytics).", type: "info" },
          { title: "Explanation Panel", content: "The reasoning section explains which features most influenced the prediction — based on how much their values deviate from the class mean.", type: "tip" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-border pb-2 flex items-center gap-2 text-primary">
              <Fingerprint className="w-5 h-5" /> Input Parameters
            </h3>

            {loadingData ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {exploreData?.columnStats.slice(0, -1).map((col) => (
                  <div key={col.name} className="space-y-1.5">
                    <Label className="text-xs uppercase font-mono text-muted-foreground flex justify-between items-center">
                      {col.name}
                      <span className="text-[10px] text-primary/50 font-mono">{col.dtype}</span>
                    </Label>
                    <Input
                      type={col.dtype.includes("int") || col.dtype.includes("float") ? "number" : "text"}
                      className="bg-secondary/30 border-border focus-visible:ring-primary/50 font-mono text-sm"
                      placeholder={`e.g. ${col.mean != null ? col.mean.toFixed(2) : "..."}`}
                      value={inputValues[col.name] || ""}
                      onChange={(e) => setInputValues((prev) => ({ ...prev, [col.name]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handlePredict}
              disabled={predictMutation.isPending || loadingData}
              className="w-full mt-6 py-4 bg-primary text-primary-foreground uppercase font-bold tracking-widest rounded-md transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] disabled:opacity-50"
            >
              {predictMutation.isPending ? "COMPUTING..." : "GENERATE PREDICTION"}
            </button>
          </div>
        </div>

        {/* Prediction Output */}
        <div className="lg:col-span-7">
          {prediction ? (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Crosshair className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Predicted Class</p>
                    <h2 className="text-4xl font-bold text-primary glow-text uppercase">{prediction.predictedClass}</h2>
                  </div>
                  <div className="flex-1 w-full text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Confidence</p>
                    <div className="text-4xl font-mono mb-2">{(prediction.confidence * 100).toFixed(2)}%</div>
                    <Progress value={prediction.confidence * 100} className="h-2 bg-secondary" />
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6">
                <h3 className="font-bold uppercase tracking-wider mb-5 border-b border-border pb-2 flex items-center gap-2 text-accent">
                  <Activity className="w-5 h-5" /> Class Probabilities
                </h3>
                <div className="space-y-3">
                  {prediction.classProbabilities.map((cp: any) => (
                    <div key={cp.className} className="space-y-1">
                      <div className="flex justify-between text-sm font-mono">
                        <span className={cp.className === prediction.predictedClass ? "text-primary font-bold" : ""}>{cp.className}</span>
                        <span>{(cp.probability * 100).toFixed(2)}%</span>
                      </div>
                      <Progress
                        value={cp.probability * 100}
                        className="h-1.5 bg-secondary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6">
                <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2 text-chart-3">
                  <HelpCircle className="w-5 h-5" /> Reasoning
                </h3>
                <ul className="space-y-2.5">
                  {prediction.explanation.map((expl: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="text-chart-3 font-mono mt-0.5 flex-shrink-0">[{i + 1}]</span>
                      <span>{expl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] glass-panel flex flex-col items-center justify-center text-center border-dashed border-2 border-muted/40 opacity-60">
              <Crosshair className="w-20 h-20 mb-6 opacity-30" />
              <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Awaiting Input</h3>
              <p className="text-sm font-mono text-muted-foreground">Fill in the feature values and submit</p>
            </div>
          )}
        </div>
      </div>
    </StageLayout>
  );
}
