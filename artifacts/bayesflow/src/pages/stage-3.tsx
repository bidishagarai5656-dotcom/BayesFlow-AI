import { useState } from "react";
import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { TheoryPanel } from "@/components/shared/TheoryPanel";
import { usePreprocessDataset } from "@workspace/api-client-react";
import { Loader2, Settings, Terminal, Zap, CheckCircle2 } from "lucide-react";
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

  if (!sessionId || sessionId === "new") return <Redirect to="/" />;

  const handleApply = async () => {
    try {
      const res = await preprocessMutation.mutateAsync({
        sessionId,
        data: { handleMissing: handleMissing as any, encodeCategorical, removeDuplicates, featureScaling: featureScaling as any }
      });
      setResult(res);
      toast({ title: "Preprocessing Complete", description: "Dataset cleaned and transformed successfully." });
    } catch (err: any) {
      toast({ title: "Preprocessing Failed", description: err.message || "An error occurred", variant: "destructive" });
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
      <TheoryPanel
        stageTitle="Data Preprocessing"
        summary="Raw data is messy. Preprocessing converts it into a clean, standardized form that algorithms can use effectively. Skipping preprocessing usually leads to worse results."
        items={[
          { title: "Missing Values", content: "NaN values crash most algorithms. 'Fill Mean' replaces missing numbers with the column average — a safe, common default for small datasets.", type: "warning" },
          { title: "Categorical Encoding", content: "Naive Bayes needs numbers, not text. Label encoding converts categories like 'cat'/'dog' to 0/1. Enable this if your dataset has text columns.", type: "info" },
          { title: "Standardization (Z-score)", content: "Converts each feature to zero mean and unit variance: z = (x - μ) / σ. Best for Gaussian Naive Bayes with continuous features.", type: "info" },
          { title: "Min-Max Scaling", content: "Scales values to [0, 1] range. Useful when you know your data is bounded and want to preserve zero values (e.g., word counts).", type: "tip" },
          { title: "Robust Scaling", content: "Uses median and IQR instead of mean/std. Great when your data has outliers that would skew standardization.", type: "tip" },
          { title: "Duplicate Rows", content: "Duplicate rows bias the model toward patterns that appear multiple times. Removing them ensures each data point contributes equally.", type: "warning" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-border pb-2 flex items-center gap-2 text-primary">
              <Settings className="w-5 h-5" /> Pipeline Config
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Missing Values</label>
                <Select value={handleMissing} onValueChange={setHandleMissing}>
                  <SelectTrigger className="w-full bg-secondary/50 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="drop_rows">Drop Rows</SelectItem>
                    <SelectItem value="fill_mean">Fill with Mean</SelectItem>
                    <SelectItem value="fill_median">Fill with Median</SelectItem>
                    <SelectItem value="fill_mode">Fill with Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Feature Scaling</label>
                <Select value={featureScaling} onValueChange={setFeatureScaling}>
                  <SelectTrigger className="w-full bg-secondary/50 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="standard">Standardization (Z-score)</SelectItem>
                    <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                    <SelectItem value="robust">Robust Scaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <div>
                  <label className="text-xs font-bold uppercase">Encode Categorical</label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Convert text to numbers</p>
                </div>
                <Switch checked={encodeCategorical} onCheckedChange={setEncodeCategorical} />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <label className="text-xs font-bold uppercase">Remove Duplicates</label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Drop identical rows</p>
                </div>
                <Switch checked={removeDuplicates} onCheckedChange={setRemoveDuplicates} />
              </div>

              <button
                onClick={handleApply}
                disabled={preprocessMutation.isPending}
                className="w-full mt-2 py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-md uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] disabled:opacity-50"
              >
                {preprocessMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Run Pipeline
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Row Count", before: result.rowsBefore, after: result.rowsAfter, color: "text-primary" },
                  { label: "Column Count", before: result.columnsBefore, after: result.columnsAfter, color: "text-accent" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-panel p-5 text-center">
                    <p className="text-xs text-muted-foreground font-mono uppercase mb-2">{stat.label}</p>
                    <div className="flex items-center justify-center gap-3 text-xl font-bold">
                      <span className="text-muted-foreground">{stat.before}</span>
                      <span className="text-muted-foreground text-base">→</span>
                      <span className={stat.color}>{stat.after}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-panel border-muted bg-background/50 rounded-md overflow-hidden flex flex-col h-[380px]">
                <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono uppercase text-muted-foreground">Execution Logs</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-auto" />
                </div>
                <div className="p-4 overflow-y-auto custom-scrollbar font-mono text-xs space-y-1.5 flex-1">
                  {result.logs.map((log: string, i: number) => (
                    <div key={i} className="text-primary/80 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${i * 80}ms` }}>
                      <span className="text-muted-foreground mr-2 select-none">[{String(i).padStart(2, "0")}]</span>
                      {log}
                    </div>
                  ))}
                  <div className="text-green-400 mt-3 font-bold animate-in fade-in" style={{ animationDelay: `${result.logs.length * 80}ms` }}>
                    ▶ PIPELINE COMPLETE
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[460px] glass-panel flex flex-col items-center justify-center text-center border-dashed border-2 border-muted/40">
              <Terminal className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground/60 uppercase tracking-widest text-sm">Awaiting Pipeline Execution</p>
              <p className="text-muted-foreground/40 text-xs mt-2 font-mono">Configure options and click Run Pipeline</p>
            </div>
          )}
        </div>
      </div>
    </StageLayout>
  );
}
