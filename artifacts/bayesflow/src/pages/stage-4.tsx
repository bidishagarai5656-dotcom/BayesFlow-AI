import { useState, useEffect } from "react";
import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { TheoryPanel } from "@/components/shared/TheoryPanel";
import { useExploreDataset, getExploreDatasetQueryKey, useConfigureFeatures } from "@workspace/api-client-react";
import { Loader2, CheckSquare, Target, SplitSquareHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

export default function Stage4() {
  const { sessionId } = useParams();
  const { toast } = useToast();

  const [targetColumn, setTargetColumn] = useState<string>("");
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [testSize, setTestSize] = useState<number[]>([0.2]);
  const [result, setResult] = useState<any>(null);

  const { data: exploreData, isLoading: loadingData } = useExploreDataset(sessionId || "", {
    query: { enabled: !!sessionId, queryKey: getExploreDatasetQueryKey(sessionId || "") }
  });

  const configureMutation = useConfigureFeatures();

  useEffect(() => {
    if (exploreData && exploreData.columnStats.length > 0 && !targetColumn) {
      const lastCol = exploreData.columnStats[exploreData.columnStats.length - 1].name;
      setTargetColumn(lastCol);
      setFeatureColumns(exploreData.columnStats.filter((c) => c.name !== lastCol).map((c) => c.name));
    }
  }, [exploreData]);

  if (!sessionId || sessionId === "new") return <Redirect to="/" />;

  const handleApply = async () => {
    if (!targetColumn || featureColumns.length === 0) {
      toast({ title: "Configuration Error", description: "Must select a target column and at least one feature.", variant: "destructive" });
      return;
    }
    try {
      const res = await configureMutation.mutateAsync({ sessionId, data: { targetColumn, featureColumns, testSize: testSize[0] } });
      setResult(res);
      toast({ title: "Features Configured", description: `Split: ${res.trainRows} train / ${res.testRows} test rows.` });
    } catch (err: any) {
      toast({ title: "Configuration Failed", description: err.message || "An error occurred", variant: "destructive" });
    }
  };

  const toggleFeature = (colName: string) => {
    setFeatureColumns((prev) =>
      prev.includes(colName) ? prev.filter((c) => c !== colName) : [...prev, colName]
    );
  };

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={4}
      title="Feature Selection"
      description="Select the target variable to predict and the input features to train on, then set the train/test split."
      nextDisabled={!result}
    >
      <TheoryPanel
        stageTitle="Feature Selection & Train-Test Split"
        summary="Feature selection determines what information the model uses to learn. The train-test split ensures we evaluate the model on data it has never seen — simulating real-world deployment."
        items={[
          { title: "What is the Target?", content: "The target (label) is the variable you want to predict. For Iris, it's 'species'. For spam detection, it's 'spam/not_spam'. It must be categorical for Naive Bayes.", type: "info" },
          { title: "What are Features?", content: "Features are the inputs the model uses to make predictions (e.g., sepal_length). More relevant features → better predictions, but too many can hurt for small datasets.", type: "info" },
          { title: "Train/Test Split", content: "We split data so the model trains on one part and is evaluated on a different (held-out) part. This tests generalization — can it work on new, unseen examples?", type: "info" },
          { title: "80/20 Rule", content: "80% training, 20% testing is the most common split. With small datasets (< 200 rows), use 70/30 or even 60/40 to give the test set enough examples for reliable evaluation.", type: "tip" },
          { title: "Avoid Data Leakage", content: "Never use the target column as a feature — that would give the model the answer during training, making it useless in practice.", type: "warning" },
          { title: "Feature Count", content: "Naive Bayes works well even with many features because of the independence assumption. Unlike neural networks, it doesn't need feature reduction for small datasets.", type: "tip" },
        ]}
      />

      {loadingData || !exploreData ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-6">
              <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2 text-primary">
                <Target className="w-5 h-5" /> Target Variable
              </h3>
              <p className="text-xs text-muted-foreground mb-4">The column the model will learn to predict.</p>
              <Select value={targetColumn} onValueChange={(val) => {
                setTargetColumn(val);
                setFeatureColumns(exploreData.columnStats.filter((c) => c.name !== val).map((c) => c.name));
              }}>
                <SelectTrigger className="w-full md:w-[300px] bg-secondary/50 border-primary/30">
                  <SelectValue placeholder="Select target column" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {exploreData.columnStats.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="glass-panel p-6">
              <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2 text-accent">
                <CheckSquare className="w-5 h-5" /> Input Features
                <span className="ml-auto text-xs font-normal text-muted-foreground">{featureColumns.length} selected</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {exploreData.columnStats.map((c) => {
                  if (c.name === targetColumn) return null;
                  const checked = featureColumns.includes(c.name);
                  return (
                    <div
                      key={c.name}
                      className={`flex items-center gap-3 border p-3 rounded-md cursor-pointer transition-colors ${checked ? "bg-accent/10 border-accent/40" : "border-border hover:bg-secondary/40"}`}
                      onClick={() => toggleFeature(c.name)}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleFeature(c.name)} className="data-[state=checked]:bg-accent" />
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-bold truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.dtype}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6">
              <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-border pb-2 flex items-center gap-2 text-destructive">
                <SplitSquareHorizontal className="w-5 h-5" /> Train/Test Split
              </h3>

              <div className="mb-8 space-y-4">
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-chart-3">Train: {(100 - testSize[0] * 100).toFixed(0)}%</span>
                  <span className="text-primary font-bold">Test: {(testSize[0] * 100).toFixed(0)}%</span>
                </div>
                <Slider defaultValue={[0.2]} max={0.4} min={0.1} step={0.05} value={testSize} onValueChange={setTestSize} />
                <div className="w-full h-3 rounded-full bg-secondary overflow-hidden flex">
                  <div className="bg-chart-3 h-full transition-all duration-300" style={{ width: `${100 - testSize[0] * 100}%` }} />
                  <div className="bg-primary h-full flex-1" />
                </div>
              </div>

              <button
                onClick={handleApply}
                disabled={configureMutation.isPending}
                className="w-full py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-md uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] disabled:opacity-50"
              >
                {configureMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Apply Configuration
              </button>
            </div>

            {result && (
              <div className="glass-panel p-6 border-l-4 border-l-chart-3 animate-in slide-in-from-right">
                <h4 className="font-bold uppercase text-xs mb-4 text-chart-3">Split Results</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Training Set</p>
                    <p className="text-2xl font-bold">{result.trainRows.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">rows</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Test Set</p>
                    <p className="text-2xl font-bold">{result.testRows.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">rows</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Target Classes</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {result.classes.map((c: string) => (
                        <span key={c} className="px-2 py-0.5 text-[10px] bg-primary/10 rounded-sm font-mono border border-primary/30 text-primary">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </StageLayout>
  );
}
