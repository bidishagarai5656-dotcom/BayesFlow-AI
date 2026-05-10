import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { 
  useListBuiltinDatasets, 
  useLoadBuiltinDataset, 
  useUploadDataset 
} from "@workspace/api-client-react";
import { Upload, Database, Loader2, FileSpreadsheet } from "lucide-react";
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

  const handleDatasetSelect = (name: string) => {
    setSelectedDataset(name);
  };

  const handleNext = async () => {
    if (!selectedDataset) return;

    try {
      const res = await loadBuiltinMutation.mutateAsync({
        data: { datasetName: selectedDataset }
      });
      setLocation(`/session/${res.sessionId}/stage/2`);
    } catch (err: any) {
      toast({
        title: "Failed to load dataset",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Convert to base64
        const base64 = btoa(text);
        
        const res = await uploadMutation.mutateAsync({
          data: {
            filename: file.name,
            csvContent: base64
          }
        });
        setLocation(`/session/${res.sessionId}/stage/2`);
      } catch (err: any) {
        toast({
          title: "Upload failed",
          description: err.message || "Could not upload file",
          variant: "destructive"
        });
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Built-in Datasets */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
            <Database className="w-5 h-5 text-primary" />
            System Archives
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
                  onClick={() => handleDatasetSelect(ds.name)}
                  className={`cursor-pointer glass-panel p-5 transition-all ${
                    selectedDataset === ds.name 
                      ? "border-primary ring-1 ring-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.2)]" 
                      : "hover:border-primary/50"
                  }`}
                >
                  <h3 className="font-bold text-lg mb-1">{ds.displayName}</h3>
                  <p className="text-xs text-muted-foreground mb-4 h-12 overflow-hidden">
                    {ds.description}
                  </p>
                  <div className="flex items-center justify-between text-xs font-mono text-primary">
                    <span>{ds.rows} ROWS</span>
                    <span>{ds.columns} COLS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Upload */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
            <Upload className="w-5 h-5 text-accent" />
            External Uplink
          </h2>

          <div 
            className="glass-panel border-dashed border-2 border-muted-foreground/30 hover:border-accent/50 p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group h-full min-h-[250px]"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
            ) : (
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground group-hover:text-accent mb-4 transition-colors" />
            )}
            <h3 className="font-bold text-lg uppercase">Upload CSV File</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
              Files must contain headers. Target variable should be in the last column ideally.
            </p>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </StageLayout>
  );
}
