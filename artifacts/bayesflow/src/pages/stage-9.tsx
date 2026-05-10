import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { TheoryPanel } from "@/components/shared/TheoryPanel";
import { useGetPredictionHistory, getGetPredictionHistoryQueryKey, useGetSessionAnalytics, getGetSessionAnalyticsQueryKey, useExportReport } from "@workspace/api-client-react";
import { Loader2, Download, History, PieChart as PieChartIcon, TrendingUp, Trophy } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Stage9() {
  const { sessionId } = useParams();
  const { toast } = useToast();

  const { data: history, isLoading: loadHist } = useGetPredictionHistory(sessionId || "", {
    query: { enabled: !!sessionId, queryKey: getGetPredictionHistoryQueryKey(sessionId || "") }
  });

  const { data: analytics, isLoading: loadAnal } = useGetSessionAnalytics(sessionId || "", {
    query: { enabled: !!sessionId, queryKey: getGetSessionAnalyticsQueryKey(sessionId || "") }
  });

  const exportMutation = useExportReport();

  if (!sessionId || sessionId === "new") return <Redirect to="/" />;

  const handleExport = async () => {
    try {
      const report = await exportMutation.mutateAsync({ sessionId });
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bayesflow-report-${sessionId.substring(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Report Exported", description: "JSON report downloaded successfully." });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
  };

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={9}
      title="Analytics & Export"
      description="Review your prediction history, analyze confidence trends, and export the experiment report."
      nextDisabled={true}
    >
      <TheoryPanel
        stageTitle="Prediction History & Analytics"
        summary="Monitoring predictions over time reveals model behavior in a deployment-like scenario. Confidence trends, class distributions, and logs are the core of any production ML monitoring system."
        items={[
          { title: "Why Monitor Predictions?", content: "Real ML systems log every prediction to detect drift (when data distribution changes over time), debug unexpected behavior, and audit decisions for fairness.", type: "info" },
          { title: "Confidence Trend", content: "If confidence drops over time, the model may be encountering inputs that differ from its training data — a sign of distribution shift or data drift.", type: "tip" },
          { title: "Class Distribution", content: "If one class dominates predicted outputs but wasn't dominant in training data, investigate whether the model is biased or if real-world prevalence shifted.", type: "warning" },
          { title: "Average Confidence", content: "Naive Bayes tends to produce overconfident predictions (near 0 or 1) because it multiplies many probabilities assuming independence. This is a known limitation.", type: "info" },
          { title: "Export & Reproducibility", content: "The exported JSON report includes model type, session ID, accuracy metrics, and all predictions — enabling reproducible experiments and sharing with others.", type: "tip" },
          { title: "Experiment Complete!", content: "You've run the full 9-stage Naive Bayes workflow: from raw data to trained model to predictions to evaluation. Try different datasets and model variants to deepen understanding.", type: "tip" },
        ]}
      />

      {loadHist || loadAnal || !analytics || !history ? (
        <div className="flex flex-col items-center justify-center py-24 text-primary gap-4">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-mono text-xs tracking-widest animate-pulse">LOADING ANALYTICS...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Completion Banner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 border border-chart-3/40 bg-chart-3/5 flex items-center gap-6"
          >
            <Trophy className="w-12 h-12 text-chart-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-lg uppercase tracking-wide text-chart-3 mb-1">Experiment Complete!</h3>
              <p className="text-sm text-muted-foreground">You've completed all 9 stages of the Naive Bayes ML workflow. Export your report or go back to Stage 7 to run more predictions.</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="flex-shrink-0 px-5 py-2.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-md uppercase tracking-widest text-xs font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] disabled:opacity-50 whitespace-nowrap"
            >
              {exportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export Report
            </button>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 border-l-4 border-l-primary">
              <p className="text-xs uppercase text-muted-foreground font-mono mb-2">Total Predictions</p>
              <div className="text-4xl font-bold">{analytics.totalPredictions}</div>
            </div>
            <div className="glass-panel p-6 border-l-4 border-l-accent">
              <p className="text-xs uppercase text-muted-foreground font-mono mb-2">Avg Confidence</p>
              <div className="text-4xl font-bold">{(analytics.avgConfidence * 100).toFixed(1)}%</div>
            </div>
            <div className="glass-panel p-6 border-l-4 border-l-chart-3">
              <p className="text-xs uppercase text-muted-foreground font-mono mb-2">Top Predicted Class</p>
              <div className="text-3xl font-bold text-chart-3 truncate">{analytics.topClass || "—"}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[380px]">
            {/* Confidence Trend */}
            <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2 text-primary">
                <TrendingUp className="w-4 h-4" /> Confidence Trend
              </h3>
              <div className="flex-1">
                {analytics.confidenceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.confidenceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="index" tick={false} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                        formatter={(val: number) => [`${(val * 100).toFixed(2)}%`, "Confidence"]}
                        labelFormatter={(label) => `Prediction #${label}`}
                      />
                      <Line type="monotone" dataKey="confidence" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--card))", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-mono">No predictions yet</div>
                )}
              </div>
            </div>

            {/* Class Distribution */}
            <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2 text-accent">
                <PieChartIcon className="w-4 h-4" /> Predicted Classes
              </h3>
              <div className="flex-1">
                {Object.keys(analytics.classCounts).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(analytics.classCounts).map(([name, value]) => ({ name, value }))}
                        cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value"
                      >
                        {Object.entries(analytics.classCounts).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} itemStyle={{ color: "hsl(var(--foreground))" }} />
                      <Legend formatter={(val) => <span style={{ color: "hsl(var(--foreground))", fontSize: "12px" }}>{val}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-mono">No predictions yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Prediction Log */}
          <div className="glass-panel p-6">
            <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2 text-muted-foreground">
              <History className="w-5 h-5" /> Prediction Log
              {history.length > 0 && <span className="ml-auto text-xs font-normal text-primary">{history.length} entries</span>}
            </h3>
            {history.length > 0 ? (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Input Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{new Date(record.timestamp).toLocaleTimeString()}</td>
                        <td className="px-4 py-3 font-bold text-primary">{record.predictedClass}</td>
                        <td className="px-4 py-3 font-mono">{(record.confidence * 100).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                          {JSON.stringify(record.inputFeatures)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground font-mono text-sm">
                No predictions yet. Go to Stage 7 to make predictions.
              </div>
            )}
          </div>
        </div>
      )}
    </StageLayout>
  );
}
