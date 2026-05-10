import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { TheoryPanel } from "@/components/shared/TheoryPanel";
import {
  useListBuiltinDatasets,
  useLoadBuiltinDataset,
  useUploadDataset
} from "@workspace/api-client-react";
import { Upload, Database, Loader2, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Stage1() {
  const { sessionId: paramSessionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const { data: builtinDatasets, isLoading: loadingBuiltin } = useListBuiltinDatasets();
  const loadBuiltinMutation = useLoadBuiltinDataset();
  const uploadMutation = useUploadDataset();

  const handleNext = async () => {
    if (!selectedDataset) return;
    try {
      const res = await loadBuiltinMutation.mutateAsync({ data: { datasetName: selectedDataset } });
      setLocation(`/session/${res.sessionId}/stage/2`);
    } catch (err: any) {
      toast({ title: "Failed to load dataset", description: err.message || "An error occurred", variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const base64 = btoa(text);
        const res = await uploadMutation.mutateAsync({ data: { filename: file.name, csvContent: base64 } });
        setLocation(`/session/${res.sessionId}/stage/2`);
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message || "Could not upload file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const isPending = loadBuiltinMutation.isPending || uploadMutation.isPending;

  return (
    <StageLayout
      sessionId={paramSessionId || "new"}
      currentStage={1}
      title="Dataset Selection"
      description="Select a built-in dataset or upload your own CSV file to begin the experiment."
      onNext={handleNext}
      nextDisabled={!selectedDataset || isPending}
    >
      <TheoryPanel
        stageTitle="Dataset Selection"
        summary="A dataset is the foundation of any Machine Learning system. It's a structured table of examples your model will learn patterns from. Choosing the right dataset determines what your model can predict."
        items={[
          { title: "What is a Dataset?", content: "A collection of examples (rows) described by features (columns). Each row is one observation, like one flower measurement or one email.", type: "info" },
          { title: "Features vs. Target", content: "Features are the inputs (e.g., petal length). The target is what you want to predict (e.g., flower species). ML finds patterns linking features to the target.", type: "info" },
          { title: "Why Dataset Quality Matters", content: "'Garbage in, garbage out' — a poorly collected dataset leads to a poor model, no matter how sophisticated the algorithm.", type: "warning" },
          { title: "Beginner Recommendation", content: "Start with Iris (150 rows, 4 features, 3 classes). It's clean, balanced, and perfect for learning Naive Bayes classification.", type: "tip" },
          { title: "CSV Upload Rules", content: "Your CSV must have column headers in the first row. The algorithm works best with numeric columns and a clear categorical target.", type: "tip" },
          { title: "Class Balance", content: "If one class has far more rows than others, the model may be biased. Explore distributions in Stage 2 to check.", type: "warning" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Built-in Datasets */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
            <Database className="w-5 h-5 text-primary" />
            Built-in Datasets
          </h2>

          {loadingBuiltin ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {builtinDatasets?.map((ds) => (
                <div
                  key={ds.name}
                  onClick={() => setSelectedDataset(ds.name)}
                  className={`relative cursor-pointer glass-panel p-5 transition-all duration-200 ${
                    selectedDataset === ds.name
                      ? "border-primary ring-1 ring-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
                      : "hover:border-primary/50 hover:shadow-md"
                  }`}
                >
                  {selectedDataset === ds.name && (
                    <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-primary" />
                  )}
                  <h3 className="font-bold text-base mb-1 pr-6">{ds.displayName}</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{ds.description}</p>
                  <div className="flex items-center justify-between text-xs font-mono text-primary">
                    <span>{ds.rows} ROWS</span>
                    <span>{ds.columns} COLS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
            <Upload className="w-5 h-5 text-accent" />
            Upload CSV
          </h2>

          <div
            className="glass-panel border-dashed border-2 border-muted-foreground/30 hover:border-accent/50 p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group min-h-[250px]"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
            ) : (
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground group-hover:text-accent mb-4 transition-colors" />
            )}
            <h3 className="font-bold text-base uppercase">Upload CSV File</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
              Files must contain headers. Works best with numeric features and a clear target column.
            </p>
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          </div>
        </div>
      </div>
    </StageLayout>
  );
}
