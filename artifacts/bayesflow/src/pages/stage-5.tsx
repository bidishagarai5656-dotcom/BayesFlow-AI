import { useState, useEffect } from "react";
import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { useGetModelRecommendation, getGetModelRecommendationQueryKey, useTrainModel } from "@workspace/api-client-react";
import { Loader2, BrainCircuit, CheckCircle2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Stage5() {
  const { sessionId } = useParams();
  const { toast } = useToast();

  const [selectedModel, setSelectedModel] = useState<string>("");

  const { data: recData, isLoading } = useGetModelRecommendation(sessionId || "", {
    query: {
      enabled: !!sessionId,
      queryKey: getGetModelRecommendationQueryKey(sessionId || "")
    }
  });

  useEffect(() => {
    if (recData && !selectedModel) {
      setSelectedModel(recData.recommended);
    }
  }, [recData]);

  if (!sessionId || sessionId === "new") {
    return <Redirect to="/" />;
  }

  const handleNext = () => {
    // Stage 6 will do the actual training
  };

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={5}
      title="Model Architecture"
      description="Select the Naive Bayes variant for your experiment. The system analyzes your features and recommends the optimal architecture."
      nextDisabled={!selectedModel}
      nextLabel="Proceed to Training"
    >
      {isLoading || !recData ? (
        <div className="flex justify-center py-24 text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Recommendation Banner */}
          <div className="glass-panel p-6 border border-primary/50 relative overflow-hidden bg-primary/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm mb-2">
                <Zap className="w-4 h-4" /> System Recommendation
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {recData.models.find(m => m.type === recData.recommended)?.displayName}
              </h2>
              <p className="text-muted-foreground max-w-3xl">
                {recData.reason}
              </p>
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
                      ? "border-primary ring-1 ring-primary shadow-[0_0_20px_hsl(var(--primary)/0.2)] scale-[1.02]" 
                      : "hover:border-primary/50 hover:scale-[1.01]"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 uppercase tracking-wider shadow-lg transform rotate-12">
                      Optimal
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl">{model.displayName}</h3>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-primary" />}
                  </div>

                  <p className="text-sm text-muted-foreground mb-6 flex-1">
                    {model.description}
                  </p>

                  <div className="space-y-4 text-sm mt-auto border-t border-border pt-4">
                    <div>
                      <span className="text-xs font-bold uppercase text-green-500 mb-1 block">Pros</span>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                        {model.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase text-destructive mb-1 block">Cons</span>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                        {model.cons.map((con, i) => <li key={i}>{con}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </StageLayout>
  );
}
