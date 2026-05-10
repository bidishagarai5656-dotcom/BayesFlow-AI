import { useState, useEffect } from "react";
import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
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
  const [testSize, setTestSize] = useState<number[]>([0.2]); // 20% test size default
  const [result, setResult] = useState<any>(null);

  const { data: exploreData, isLoading: loadingData } = useExploreDataset(sessionId || "", {
    query: {
      enabled: !!sessionId,
      queryKey: getExploreDatasetQueryKey(sessionId || "")
    }
  });

  const configureMutation = useConfigureFeatures();

  useEffect(() => {
    if (exploreData && exploreData.columnStats.length > 0) {
      // Auto-select last column as target if nothing selected
      if (!targetColumn) {
        const lastCol = exploreData.columnStats[exploreData.columnStats.length - 1].name;
        setTargetColumn(lastCol);
        setFeatureColumns(exploreData.columnStats.filter(c => c.name !== lastCol).map(c => c.name));
      }
    }
  }, [exploreData]);

  if (!sessionId || sessionId === "new") {
    return <Redirect to="/" />;
  }

  const handleApply = async () => {
    if (!targetColumn || featureColumns.length === 0) {
      toast({
        title: "Configuration Error",
        description: "Must select a target column and at least one feature.",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await configureMutation.mutateAsync({
        sessionId,
        data: {
          targetColumn,
          featureColumns,
          testSize: testSize[0]
        }
      });
      setResult(res);
      toast({
        title: "Features Configured",
        description: `Split data into ${res.trainRows} train and ${res.testRows} test rows.`,
      });
    } catch (err: any) {
      toast({
        title: "Configuration Failed",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  const toggleFeature = (colName: string) => {
    setFeatureColumns(prev => 
      prev.includes(colName) 
        ? prev.filter(c => c !== colName)
        : [...prev, colName]
    );
  };

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={4}
      title="Feature Selection"
      description="Select the target variable to predict and the features to train on. Set your train/test split."
      nextDisabled={!result}
    >
      {loadingData || !exploreData ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          
          {/* Main Configuration */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass-panel p-6">
              <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-border pb-2 flex items-center gap-2 text-primary">
                <Target className="w-5 h-5" />
                Target Variable
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Select the column you want the model to predict.</p>
              
              <Select value={targetColumn} onValueChange={(val) => {
                setTargetColumn(val);
                setFeatureColumns(exploreData.columnStats.filter(c => c.name !== val).map(c => c.name));
              }}>
                <SelectTrigger className="w-full md:w-[300px] bg-secondary/50 border-primary/30">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {exploreData.columnStats.map(c => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="glass-panel p-6">
              <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-border pb-2 flex items-center gap-2 text-accent">
                <CheckSquare className="w-5 h-5" />
                Input Features
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Select the columns to use as inputs for the prediction.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {exploreData.columnStats.map(c => {
                  if (c.name === targetColumn) return null;
                  return (
                    <div 
                      key={c.name} 
                      className={`flex items-center space-x-2 border border-border p-3 rounded-md transition-colors cursor-pointer ${featureColumns.includes(c.name) ? 'bg-accent/10 border-accent/50' : 'hover:bg-secondary/50'}`}
                      onClick={() => toggleFeature(c.name)}
                    >
                      <Checkbox 
                        checked={featureColumns.includes(c.name)} 
                        onCheckedChange={() => toggleFeature(c.name)}
                        className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                      />
                      <label className="text-sm font-mono truncate cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {c.name}
                      </label>
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
                <SplitSquareHorizontal className="w-5 h-5" />
                Train/Test Split
              </h3>
              
              <div className="mb-8">
                <div className="flex justify-between text-sm font-mono mb-4">
                  <span className="text-muted-foreground">Train: {(100 - testSize[0] * 100).toFixed(0)}%</span>
                  <span className="text-primary font-bold">Test: {(testSize[0] * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  defaultValue={[0.2]}
                  max={0.5}
                  min={0.1}
                  step={0.05}
                  value={testSize}
                  onValueChange={setTestSize}
                  className="w-full"
                />
              </div>

              <button
                onClick={handleApply}
                disabled={configureMutation.isPending}
                className="w-full py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-md uppercase tracking-widest text-sm font-bold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] disabled:opacity-50"
              >
                {configureMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Apply Configuration
              </button>
            </div>

            {result && (
              <div className="glass-panel p-6 border-l-4 border-l-green-500 animate-in slide-in-from-right">
                <h4 className="font-bold uppercase text-sm mb-4">Split Results</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-mono">Training Set</p>
                    <p className="text-2xl font-bold">{result.trainRows.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">rows</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-mono">Testing Set</p>
                    <p className="text-2xl font-bold">{result.testRows.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">rows</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-mono">Target Classes</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {result.classes.map((c: string) => (
                        <span key={c} className="px-2 py-1 text-xs bg-secondary rounded-sm font-mono border border-border">{c}</span>
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
