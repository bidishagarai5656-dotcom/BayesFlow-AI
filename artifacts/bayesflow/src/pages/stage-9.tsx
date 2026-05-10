import { useParams, Redirect } from "wouter";
import { StageLayout } from "@/components/layout/StageLayout";
import { useGetPredictionHistory, getGetPredictionHistoryQueryKey, useGetSessionAnalytics, getGetSessionAnalyticsQueryKey, useExportReport } from "@workspace/api-client-react";
import { Loader2, Download, History, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

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

  if (!sessionId || sessionId === "new") {
    return <Redirect to="/" />;
  }

  const handleExport = async () => {
    try {
      const report = await exportMutation.mutateAsync({ sessionId });
      
      // Create and download file
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bayesflow-report-${sessionId.substring(0,8)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Report Exported", description: "JSON report downloaded successfully." });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={9}
      title="Analytics & Export"
      description="Review session history, analyze prediction confidence trends, and export your experiment report."
      nextDisabled={true} // Last stage
    >
      {loadHist || loadAnal || !analytics || !history ? (
         <div className="flex justify-center py-24"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
      ) : (
        <div className="mt-8 space-y-8">
          
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-md uppercase tracking-widest text-sm font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] disabled:opacity-50"
            >
              {exportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export Final Report
            </button>
          </div>

          {/* Top Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 border-l-2 border-l-primary">
              <p className="text-xs uppercase text-muted-foreground font-mono mb-2">Total Predictions</p>
              <div className="text-4xl font-bold">{analytics.totalPredictions}</div>
            </div>
            <div className="glass-panel p-6 border-l-2 border-l-accent">
              <p className="text-xs uppercase text-muted-foreground font-mono mb-2">Average Confidence</p>
              <div className="text-4xl font-bold">{(analytics.avgConfidence * 100).toFixed(1)}%</div>
            </div>
            <div className="glass-panel p-6 border-l-2 border-l-chart-3">
              <p className="text-xs uppercase text-muted-foreground font-mono mb-2">Most Frequent Class</p>
              <div className="text-3xl font-bold text-chart-3 truncate">{analytics.topClass || '-'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[400px]">
            {/* Confidence Trend */}
            <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" /> Confidence Trend
              </h3>
              <div className="flex-1">
                {analytics.confidenceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.confidenceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="index" tick={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
                      <YAxis domain={[0, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        formatter={(val: number) => [`${(val*100).toFixed(2)}%`, 'Confidence']}
                        labelFormatter={(label) => `Prediction #${label}`}
                      />
                      <Line type="monotone" dataKey="confidence" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--card))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-mono">No predictions recorded yet</div>
                )}
              </div>
            </div>

            {/* Class Distribution */}
            <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2 text-accent">
                <PieChartIcon className="w-5 h-5" /> Predicted Classes
              </h3>
              <div className="flex-1">
                {Object.keys(analytics.classCounts).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(analytics.classCounts).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(analytics.classCounts).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-mono">No predictions recorded yet</div>
                )}
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="glass-panel p-6">
            <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2 text-muted-foreground">
              <History className="w-5 h-5" /> Prediction Log
            </h3>
            {history.length > 0 ? (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-md">Time</th>
                      <th className="px-4 py-3">Predicted Class</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3 rounded-tr-md">Input Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
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
              <div className="text-center py-12 text-muted-foreground font-mono text-sm">Log is empty. Run predictions in Stage 7 to populate.</div>
            )}
          </div>

        </div>
      )}
    </StageLayout>
  );
}
