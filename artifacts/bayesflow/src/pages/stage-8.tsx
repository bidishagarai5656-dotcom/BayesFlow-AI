import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { useEvaluateModel, getEvaluateModelQueryKey } from "@workspace/api-client-react";
import { Loader2, BarChart2, Activity, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Stage8() {
  const { sessionId } = useParams();

  const { data: evalData, isLoading } = useEvaluateModel(sessionId || "", {
    query: {
      enabled: !!sessionId,
      queryKey: getEvaluateModelQueryKey(sessionId || "")
    }
  });

  if (!sessionId || sessionId === "new") {
    return <Redirect to="/" />;
  }

  // Helper to render confusion matrix heatmap
  const renderConfusionMatrix = (matrix: number[][], labels?: string[]) => {
    if (!matrix || matrix.length === 0) return null;
    
    // Find max value for color scaling
    const maxVal = Math.max(...matrix.flat());

    return (
      <div className="overflow-x-auto">
        <div className="min-w-max inline-block">
          <div className="grid" style={{ gridTemplateColumns: `auto repeat(${matrix.length}, 1fr)` }}>
            {/* Header row */}
            <div className="p-2"></div>
            {matrix.map((_, i) => (
              <div key={`col-${i}`} className="p-2 text-center text-xs font-mono text-muted-foreground uppercase border-b border-border">
                {labels ? labels[i] : `Pred ${i}`}
              </div>
            ))}
            
            {/* Rows */}
            {matrix.map((row, i) => (
              <div key={`row-wrap-${i}`} className="contents">
                <div className="p-2 flex items-center justify-end text-xs font-mono text-muted-foreground uppercase pr-4 border-r border-border">
                  {labels ? labels[i] : `True ${i}`}
                </div>
                {row.map((cell, j) => {
                  const intensity = maxVal > 0 ? cell / maxVal : 0;
                  const isCorrect = i === j;
                  // Use primary color for diagonal, destructive for off-diagonal
                  const colorVar = isCorrect ? 'var(--primary)' : 'var(--destructive)';
                  
                  return (
                    <div 
                      key={`cell-${i}-${j}`} 
                      className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center font-mono font-bold text-lg m-1 rounded-md transition-colors hover:ring-2 ring-white/50"
                      style={{ 
                        backgroundColor: `hsl(${colorVar} / ${Math.max(0.1, intensity)})`,
                        color: intensity > 0.5 ? '#fff' : 'inherit'
                      }}
                    >
                      {cell}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={8}
      title="Performance Evaluation"
      description="Deep statistical analysis of the model's predictive capabilities across various metrics."
    >
      {isLoading || !evalData ? (
        <div className="flex flex-col items-center justify-center py-32 text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="font-mono text-sm tracking-widest animate-pulse">COMPUTING METRICS...</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8 animate-in fade-in duration-700">
          
          {/* Main KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-6 border-t-4 border-t-primary relative overflow-hidden group">
              <Activity className="absolute -right-4 -top-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform" />
              <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Accuracy</p>
              <p className="text-4xl font-bold">{(evalData.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div className="glass-panel p-6 border-t-4 border-t-accent relative overflow-hidden group">
              <Target className="absolute -right-4 -top-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform" />
              <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Precision</p>
              <p className="text-4xl font-bold">{(evalData.precision * 100).toFixed(1)}%</p>
            </div>
            <div className="glass-panel p-6 border-t-4 border-t-chart-3 relative overflow-hidden group">
              <BarChart2 className="absolute -right-4 -top-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform" />
              <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Recall</p>
              <p className="text-4xl font-bold">{(evalData.recall * 100).toFixed(1)}%</p>
            </div>
            <div className="glass-panel p-6 border-t-4 border-t-destructive relative overflow-hidden group">
              <Activity className="absolute -right-4 -top-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform" />
              <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">F1 Score</p>
              <p className="text-4xl font-bold">{(evalData.f1Score * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Confusion Matrix */}
            <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-border pb-2 text-primary">
                Confusion Matrix
              </h3>
              <div className="flex-1 flex items-center justify-center">
                {renderConfusionMatrix(evalData.confusionMatrix, evalData.labels)}
              </div>
            </div>

            {/* ROC Curve */}
            <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-border pb-2 text-accent">
                ROC Curve
              </h3>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evalData.rocData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="fpr" 
                      type="number" 
                      domain={[0, 1]} 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      label={{ value: 'False Positive Rate', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      dataKey="tpr" 
                      type="number" 
                      domain={[0, 1]}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      formatter={(val: number) => val.toFixed(3)}
                    />
                    {/* Diagonal baseline */}
                    <Line type="linear" dataKey="fpr" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                    {/* Actual ROC curve - if multiple classes, might need multiple lines, assuming binary for now or micro-avg */}
                    <Line type="monotone" dataKey="tpr" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Classification Report Table */}
          <div className="glass-panel p-6">
            <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 text-chart-3">
              Per-Class Metrics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-md">Class</th>
                    <th className="px-4 py-3">Precision</th>
                    <th className="px-4 py-3">Recall</th>
                    <th className="px-4 py-3">F1-Score</th>
                    <th className="px-4 py-3 rounded-tr-md">Support (Instances)</th>
                  </tr>
                </thead>
                <tbody>
                  {evalData.classReport.map((cr) => (
                    <tr key={cr.className} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                      <td className="px-4 py-3 font-mono font-bold">{cr.className}</td>
                      <td className="px-4 py-3 text-primary">{(cr.precision * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-accent">{(cr.recall * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-chart-3">{(cr.f1Score * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 font-mono">{cr.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </StageLayout>
  );
}
