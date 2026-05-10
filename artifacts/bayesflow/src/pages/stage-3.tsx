import { useState } from "react";
import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { usePreprocessDataset } from "@workspace/api-client-react";
import { Loader2, Settings, Terminal, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function Stage3() {
  const { sessionId } = useParams();
  const { toast } = useToast();

  const [handleMissing, setHandleMissing] = useState("fill_mean");
  const [encodeCategorical, setEncodeCategorical] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [featureScaling, setFeatureScaling] = useState("standard");
  const [result, setResult] = useState<any>(null);

  const preprocessMutation = usePreprocessDataset();

  if (!sessionId || sessionId === "new") {
    return <Redirect to="/" />;
  }

  const handleApply = async () => {
    try {
      const res = await preprocessMutation.mutateAsync({
        sessionId,
        data: {
          handleMissing: handleMissing as any,
          encodeCategorical,
          removeDuplicates,
          featureScaling: featureScaling as any
        }
      });
      setResult(res);
      toast({
        title: "Preprocessing Complete",
        description: "Dataset has been cleaned and transformed successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Preprocessing Failed",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={3}
      title="Data Preprocessing"
      description="Configure data transformation pipelines to prepare your dataset for the Naive Bayes algorithm."
      nextDisabled={!result}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Config Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-border pb-2 flex items-center gap-2 text-primary">
              <Settings className="w-5 h-5" />
              Pipeline Configuration
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground uppercase">Missing Values Strategy</label>
                <Select value={handleMissing} onValueChange={setHandleMissing}>
                  <SelectTrigger className="w-full bg-secondary/50 border-primary/30 text-foreground">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="drop_rows">Drop Rows</SelectItem>
                    <SelectItem value="fill_mean">Fill with Mean/Mode</SelectItem>
                    <SelectItem value="fill_median">Fill with Median/Mode</SelectItem>
                    <SelectItem value="fill_mode">Fill all with Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground uppercase">Feature Scaling</label>
                <Select value={featureScaling} onValueChange={setFeatureScaling}>
                  <SelectTrigger className="w-full bg-secondary/50 border-primary/30 text-foreground">
                    <SelectValue placeholder="Select scaling" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="standard">Standardization (Z-score)</SelectItem>
                    <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                    <SelectItem value="robust">Robust Scaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <label className="text-sm font-bold text-muted-foreground uppercase">Encode Categorical</label>
                <Switch checked={encodeCategorical} onCheckedChange={setEncodeCategorical} />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <label className="text-sm font-bold text-muted-foreground uppercase">Remove Duplicates</label>
                <Switch checked={removeDuplicates} onCheckedChange={setRemoveDuplicates} />
              </div>

              <button
                onClick={handleApply}
                disabled={preprocessMutation.isPending}
                className="w-full mt-4 py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-md uppercase tracking-widest text-sm font-bold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] disabled:opacity-50"
              >
                {preprocessMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Initialize Pipeline
              </button>
            </div>
          </div>
        </div>

        {/* Results & Terminal */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4 flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-muted-foreground font-mono uppercase mb-1">Row Count</p>
                  <div className="flex items-center gap-2 text-xl font-bold">
                    <span>{result.rowsBefore}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-primary">{result.rowsAfter}</span>
                  </div>
                </div>
                <div className="glass-panel p-4 flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-muted-foreground font-mono uppercase mb-1">Column Count</p>
                  <div className="flex items-center gap-2 text-xl font-bold">
                    <span>{result.columnsBefore}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-accent">{result.columnsAfter}</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel border-muted bg-background/50 rounded-md overflow-hidden flex flex-col h-[400px]">
                <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono uppercase text-muted-foreground">Execution Logs</span>
                </div>
                <div className="p-4 overflow-y-auto font-mono text-sm space-y-2 flex-1">
                  {result.logs.map((log: string, i: number) => (
                    <div key={i} className="text-primary/80 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${i * 100}ms` }}>
                      <span className="text-muted-foreground mr-2">[{new Date().toISOString().split('T')[1].split('.')[0]}]</span>
                      {log}
                    </div>
                  ))}
                  <div className="text-green-500 mt-4 font-bold animate-in fade-in" style={{ animationDelay: `${result.logs.length * 100}ms` }}>
                    &gt; PIPELINE EXECUTION COMPLETE
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] glass-panel flex flex-col items-center justify-center text-center border-dashed border-2 border-muted">
              <Terminal className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground uppercase tracking-widest">Awaiting Pipeline Execution</p>
            </div>
          )}
        </div>
      </div>
    </StageLayout>
  );
}
