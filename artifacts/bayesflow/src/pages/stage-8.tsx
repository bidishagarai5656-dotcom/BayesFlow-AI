import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { TheoryPanel } from "@/components/shared/TheoryPanel";
import { useEvaluateModel, getEvaluateModelQueryKey } from "@workspace/api-client-react";
import { Loader2, BarChart2, Activity, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Stage8() {
  const { sessionId } = useParams();

  const { data: evalData, isLoading } = useEvaluateModel(sessionId || "", {
    query: { enabled: !!sessionId, queryKey: getEvaluateModelQueryKey(sessionId || "") }
  });

  if (!sessionId || sessionId === "new") return <Redirect to="/" />;

  const renderConfusionMatrix = (matrix: number[][], labels?: string[]) => {
    if (!matrix || matrix.length === 0) return null;
    const maxVal = Math.max(...matrix.flat());
    return (
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-max inline-block">
          <div className="grid" style={{ gridTemplateColumns: `auto repeat(${matrix.length}, 1fr)` }}>
            <div className="p-2" />
            {matrix.map((_, i) => (
              <div key={`col-${i}`} className="p-2 text-center text-[10px] font-mono text-muted-foreground uppercase border-b border-border">
                {labels ? labels[i] : `Pred ${i}`}
              </div>
            ))}
            {matrix.map((row, i) => (
              <div key={`row-wrap-${i}`} className="contents">
                <div className="p-2 flex items-center justify-end text-[10px] font-mono text-muted-foreground uppercase pr-4 border-r border-border whitespace-nowrap">
                  {labels ? labels[i] : `True ${i}`}
                </div>
                {row.map((cell, j) => {
                  const intensity = maxVal > 0 ? cell / maxVal : 0;
                  const isCorrect = i === j;
                  return (
                    <div
                      key={`cell-${i}-${j}`}
                      className="w-14 h-14 md:w-18 md:h-18 flex items-center justify-center font-mono font-bold text-base m-0.5 rounded-md transition-colors"
                      title={`True: ${labels?.[i] || i}, Predicted: ${labels?.[j] || j}, Count: ${cell}`}
                      style={{
                        backgroundColor: isCorrect
                          ? `hsl(var(--primary) / ${Math.max(0.12, intensity)})`
                          : `hsl(var(--destructive) / ${Math.max(0.08, intensity * 0.7)})`,
                        color: intensity > 0.5 ? "white" : "inherit",
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
      description="Statistical analysis of model predictive capabilities across accuracy, precision, recall, and F1-score."
    >
      <TheoryPanel
        stageTitle="Model Evaluation"
        summary="A single accuracy number rarely tells the full story. Comprehensive evaluation exposes where the model fails, which classes are confused, and how it performs across the probability threshold spectrum."
        items={[
          { title: "Accuracy", content: "Proportion of all predictions that were correct: (TP + TN) / Total. Can be misleading with imbalanced classes — a model predicting always-negative gets 95% on a 95/5 split.", type: "info" },
          { title: "Precision", content: "Of all predicted positives, how many were actually positive: TP / (TP + FP). High precision = few false alarms. Critical in spam detection (don't delete real emails).", type: "info" },
          { title: "Recall (Sensitivity)", content: "Of all actual positives, how many did we correctly catch: TP / (TP + FN). High recall = few missed cases. Critical in medical diagnosis (don't miss sick patients).", type: "info" },
          { title: "F1-Score", content: "Harmonic mean of precision and recall: 2 × P × R / (P + R). Balanced metric that penalizes extreme imbalance between precision and recall.", type: "info" },
          { title: "Confusion Matrix", content: "Shows exact counts for each (true class, predicted class) pair. Diagonal = correct; off-diagonal = errors. Reveals which classes the model confuses with each other.", type: "tip" },
          { title: "ROC Curve", content: "Plots True Positive Rate vs False Positive Rate at different classification thresholds. AUC close to 1.0 = excellent; AUC = 0.5 = random guessing (diagonal line).", type: "info" },
        ]}
      />

      {isLoading || !evalData ? (
        <div className="flex flex-col items-center justify-center py-32 text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="font-mono text-xs tracking-widest animate-pulse">COMPUTING METRICS...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Accuracy", value: evalData.accuracy, icon: Activity, color: "border-t-primary" },
              { label: "Precision", value: evalData.precision, icon: Target, color: "border-t-accent" },
              { label: "Recall", value: evalData.recall, icon: BarChart2, color: "border-t-chart-3" },
              { label: "F1 Score", value: evalData.f1Score, icon: Activity, color: "border-t-chart-4" },
            ].map((metric) => (
              <div key={metric.label} className={`glass-panel p-6 border-t-4 ${metric.color} relative overflow-hidden group`}>
                <metric.icon className="absolute -right-4 -top-4 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity" />
                <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">{metric.label}</p>
                <p className="text-4xl font-bold">{(metric.value * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Confusion Matrix */}
            <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-bold uppercase tracking-wider mb-5 border-b border-border pb-2 text-primary">Confusion Matrix</h3>
              <div className="flex-1 flex items-start justify-center overflow-auto custom-scrollbar">
                {renderConfusionMatrix(evalData.confusionMatrix, evalData.labels)}
              </div>
            </div>

            {/* ROC Curve */}
            <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-bold uppercase tracking-wider mb-5 border-b border-border pb-2 text-accent">ROC Curve</h3>
              <div className="flex-1 min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evalData.rocData} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="fpr"
                      type="number"
                      domain={[0, 1]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      label={{ value: "False Positive Rate", position: "bottom", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      domain={[0, 1]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                      formatter={(val: number) => val.toFixed(3)}
                    />
                    <Line type="linear" dataKey="fpr" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Baseline" />
                    <Line type="monotone" dataKey="tpr" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="ROC" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Per-class report */}
          <div className="glass-panel p-6">
            <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 text-chart-3">Per-Class Metrics</h3>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/40">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-md">Class</th>
                    <th className="px-4 py-3">Precision</th>
                    <th className="px-4 py-3">Recall</th>
                    <th className="px-4 py-3">F1-Score</th>
                    <th className="px-4 py-3 rounded-tr-md">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {evalData.classReport.map((cr) => (
                    <tr key={cr.className} className="border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold">{cr.className}</td>
                      <td className="px-4 py-3 text-primary">{(cr.precision * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-accent">{(cr.recall * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-chart-3">{(cr.f1Score * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{cr.support}</td>
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
