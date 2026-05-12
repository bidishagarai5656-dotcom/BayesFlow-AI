import { useState, useEffect } from "react";
import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { TheoryPanel } from "@/components/shared/TheoryPanel";
import { useGetModelRecommendation, getGetModelRecommendationQueryKey } from "@workspace/api-client-react";
import { Loader2, BrainCircuit, CheckCircle2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Stage5() {
  const { sessionId } = useParams();
  const { toast } = useToast();

  const [selectedModel, setSelectedModel] = useState<string>("");

  const { data: recData, isLoading } = useGetModelRecommendation(sessionId || "", {
    query: { enabled: !!sessionId, queryKey: getGetModelRecommendationQueryKey(sessionId || "") }
  });

  useEffect(() => {
    if (recData && !selectedModel) {
      setSelectedModel(recData.recommended);
    }
  }, [recData]);

  // Persist user's model choice so stage-6 can read it
  useEffect(() => {
    if (selectedModel && sessionId) {
      try {
        sessionStorage.setItem(`bayesflow_model_${sessionId}`, selectedModel);
      } catch {}
    }
  }, [selectedModel, sessionId]);

  if (!sessionId || sessionId === "new") return <Redirect to="/" />;

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={5}
      title="Model Architecture"
      description="Select the Naive Bayes variant for your experiment. The system analyzes your features and recommends the optimal architecture."
      nextDisabled={!selectedModel}
      nextLabel="Proceed to Training"
    >
      <TheoryPanel
        stageTitle="Naive Bayes Model Selection"
        summary="Naive Bayes is a family of classifiers based on Bayes' Theorem with the 'naive' assumption that features are conditionally independent given the class. Three variants handle different data distributions."
        items={[
          { title: "Bayes' Theorem", content: "P(class | features) ∝ P(class) × P(features | class). We pick the class with the highest posterior probability — the product of prior and likelihood.", type: "info" },
          { title: "Naive Independence Assumption", content: "The algorithm assumes features don't influence each other. While rarely true in practice (e.g., height & weight correlate), NB is surprisingly robust to this violation.", type: "info" },
          { title: "Gaussian Naive Bayes", content: "Assumes continuous features follow a Gaussian (bell-curve) distribution. Best for numeric measurements like temperature, height, or petal dimensions.", type: "info" },
          { title: "Multinomial Naive Bayes", content: "Designed for count data — like word frequencies in text classification. Requires non-negative integer features. Great for spam detection.", type: "info" },
          { title: "Bernoulli Naive Bayes", content: "Works with binary (0/1) features — feature present or absent. Useful when you care about feature presence, not frequency.", type: "info" },
          { title: "Why NB is Fast", content: "Training only requires computing means, variances, and class counts. No iterative gradient descent. Even massive datasets train in milliseconds.", type: "tip" },
        ]}
      />

      {isLoading || !recData ? (
        <div className="flex justify-center py-24 text-primary">
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Recommendation Banner */}
          <div className="glass-panel p-6 border border-primary/50 relative overflow-hidden bg-primary/5">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <BrainCircuit className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-xs mb-2">
                <Zap className="w-4 h-4" /> System Recommendation
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {recData.models.find((m) => m.type === recData.recommended)?.displayName}
              </h2>
              <p className="text-sm text-muted-foreground max-w-3xl">{recData.reason}</p>
            </div>
          </div>

          {/* Model Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recData.models.map((model) => {
              const isRecommended = model.type === recData.recommended;
              const isSelected = model.type === selectedModel;

              return (
                <div
                  key={model.type}
                  onClick={() => setSelectedModel(model.type)}
                  className={`relative glass-panel p-6 cursor-pointer transition-all duration-300 flex flex-col h-full ${
                    isSelected
                      ? "border-primary ring-1 ring-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.2)] scale-[1.02]"
                      : "hover:border-primary/50 hover:scale-[1.01]"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 uppercase tracking-wider shadow-lg transform rotate-12">
                      Optimal
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{model.displayName}</h3>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                  </div>

                  <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">{model.description}</p>

                  <div className="space-y-4 text-sm mt-auto border-t border-border pt-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-chart-3 mb-1 block">Pros</span>
                      <ul className="space-y-1 text-muted-foreground text-xs pl-3">
                        {model.pros.map((pro, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-chart-3 mt-0.5">+</span>{pro}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-destructive mb-1 block">Cons</span>
                      <ul className="space-y-1 text-muted-foreground text-xs pl-3">
                        {model.cons.map((con, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5">−</span>{con}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedModel && (
            <p className="text-center text-xs text-muted-foreground font-mono">
              Selected: <span className="text-primary font-bold">{recData.models.find((m) => m.type === selectedModel)?.displayName}</span>
              {selectedModel !== recData.recommended && (
                <span className="text-orange-400 ml-2">(overriding system recommendation)</span>
              )}
            </p>
          )}
        </div>
      )}
    </StageLayout>
  );
}
