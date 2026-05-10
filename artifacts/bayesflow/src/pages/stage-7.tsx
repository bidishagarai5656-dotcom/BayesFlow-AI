import { useState } from "react";
import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
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
    query: {
      enabled: !!sessionId,
      queryKey: getExploreDatasetQueryKey(sessionId || "")
    }
  });

  const predictMutation = useMakePrediction();

  if (!sessionId || sessionId === "new") {
    return <Redirect to="/" />;
  }

  const handlePredict = async () => {
    try {
      // Coerce string inputs to numbers if they are numeric features
      const features: Record<string, any> = {};
      
      exploreData?.columnStats.forEach(col => {
        // Skip target column (assume it's the last one for now or the one not provided in form)
        if (inputValues[col.name] !== undefined) {
          if (col.dtype.includes("int") || col.dtype.includes("float")) {
             features[col.name] = Number(inputValues[col.name]);
          } else {
             features[col.name] = inputValues[col.name];
          }
        }
      });

      const res = await predictMutation.mutateAsync({
        sessionId,
        data: { features }
      });
      setPrediction(res);
      
    } catch (err: any) {
      toast({
        title: "Prediction Failed",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (col: string, val: string) => {
    setInputValues(prev => ({ ...prev, [col]: val }));
  };

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={7}
      title="Inference Engine"
      description="Input new data points to see the model's prediction and probability breakdowns in real-time."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-border pb-2 flex items-center gap-2 text-primary">
              <Fingerprint className="w-5 h-5" />
              Input Parameters
            </h3>

            {loadingData ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {/* We assume the target column is the one with highest uniqueness or last, 
                    for this UI we just render inputs for all columns except one (assumed target).
                    In a perfect world we'd fetch the feature config from an endpoint, 
                    but we'll just omit the last column as a heuristic here for the form.
                */}
                {exploreData?.columnStats.slice(0, -1).map(col => (
                  <div key={col.name} className="space-y-2">
                    <Label className="text-xs uppercase font-mono text-muted-foreground flex justify-between">
                      {col.name}
                      <span className="text-[10px] text-primary/50">{col.dtype}</span>
                    </Label>
                    <Input 
                      type={col.dtype.includes('int') || col.dtype.includes('float') ? 'number' : 'text'}
                      className="bg-secondary/30 border-border focus-visible:ring-primary/50 font-mono"
                      placeholder={`e.g. ${col.mean ? col.mean.toFixed(2) : '...'}`}
                      value={inputValues[col.name] || ''}
                      onChange={(e) => handleInputChange(col.name, e.target.value)}
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
              
              {/* Primary Output */}
              <div className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Crosshair className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Predicted Classification</p>
                    <h2 className="text-5xl font-bold text-primary glow-text uppercase">{prediction.predictedClass}</h2>
                  </div>
                  <div className="flex-1 w-full text-center">
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Confidence Score</p>
                    <div className="text-4xl font-mono mb-2">{(prediction.confidence * 100).toFixed(2)}%</div>
                    <Progress value={prediction.confidence * 100} className="h-2 bg-secondary" indicatorClassName="bg-primary" />
                  </div>
                </div>
              </div>

              {/* Probability Breakdown */}
              <div className="glass-panel p-6">
                <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-border pb-2 flex items-center gap-2 text-accent">
                  <Activity className="w-5 h-5" />
                  Class Probability Distribution
                </h3>
                <div className="space-y-4">
                  {prediction.classProbabilities.map((cp: any, i: number) => (
                    <div key={cp.className} className="space-y-1">
                      <div className="flex justify-between text-sm font-mono">
                        <span>{cp.className}</span>
                        <span>{(cp.probability * 100).toFixed(2)}%</span>
                      </div>
                      <Progress 
                        value={cp.probability * 100} 
                        className="h-1.5 bg-secondary" 
                        indicatorClassName={cp.className === prediction.predictedClass ? "bg-primary" : "bg-muted-foreground"} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div className="glass-panel p-6">
                <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2 text-destructive">
                  <HelpCircle className="w-5 h-5" />
                  Reasoning
                </h3>
                <ul className="space-y-3">
                  {prediction.explanation.map((expl: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="text-destructive font-mono mt-0.5">[{i+1}]</span>
                      <span>{expl}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
             <div className="h-full min-h-[500px] glass-panel flex flex-col items-center justify-center text-center border-dashed border-2 border-muted opacity-50">
               <Crosshair className="w-24 h-24 mb-6" />
               <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Awaiting Input</h3>
               <p className="text-sm font-mono">Submit parameters to generate classification</p>
             </div>
          )}
        </div>

      </div>
    </StageLayout>
  );
}
