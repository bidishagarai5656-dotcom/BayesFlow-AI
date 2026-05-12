import { useExploreDataset, getExploreDatasetQueryKey } from "@workspace/api-client-react";
import { StageLayout } from "@/components/layout/StageLayout";
import { TheoryPanel } from "@/components/shared/TheoryPanel";
import { useParams, Redirect } from "wouter";
import { Loader2, BarChart2, Activity, Table2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

export default function Stage2() {
  const { sessionId } = useParams();

  if (!sessionId || sessionId === "new") return <Redirect to="/" />;

  const { data: exploreData, isLoading } = useExploreDataset(sessionId, {
    query: { enabled: !!sessionId, queryKey: getExploreDatasetQueryKey(sessionId) }
  });

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={2}
      title="Dataset Exploration"
      description="Analyze the statistical properties, distributions, and class balance of your dataset."
      nextDisabled={isLoading || !exploreData}
    >
      <TheoryPanel
        stageTitle="Dataset Exploration"
        summary="Before touching the algorithm, always understand your data. Exploration reveals hidden quality issues, imbalances, and patterns that affect model performance."
        items={[
          { title: "Rows & Columns", content: "Rows = number of training examples. Columns = features + target. More rows means the model can learn more patterns, but quality matters more than quantity.", type: "info" },
          { title: "Missing Values", content: "Empty cells mean incomplete information. If left untreated, most algorithms will crash or produce wrong results. You'll fix these in Stage 3.", type: "warning" },
          { title: "Feature Types", content: "Columns can be numeric (float, int) or categorical (text). Naive Bayes handles them differently — Gaussian NB for numeric, Bernoulli for binary, Multinomial for counts.", type: "info" },
          { title: "Class Distribution", content: "The target bar chart shows how many examples exist per class. Imbalanced classes (e.g., 90% negative, 10% positive) can mislead the model.", type: "tip" },
          { title: "Unique Values", content: "High unique counts in numeric columns suggest continuous distributions (→ Gaussian NB). Low unique counts suggest discrete or binary data (→ Bernoulli NB).", type: "tip" },
          { title: "Correlation Insight", content: "Naive Bayes assumes all features are independent (no correlation). In reality, correlated features exist but Naive Bayes still works well in practice.", type: "warning" },
        ]}
      />

      {isLoading || !exploreData ? (
        <div className="flex flex-col items-center justify-center py-24 text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="font-mono animate-pulse text-sm tracking-widest">ANALYZING DATASET...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Total Rows", value: exploreData.rowCount.toLocaleString(), icon: Activity, color: "border-l-primary" },
              { label: "Total Columns", value: exploreData.columnCount, icon: BarChart2, color: "border-l-accent" },
              {
                label: "Missing Values",
                value: Object.values(exploreData.missingValues).reduce((a, b) => a + b, 0).toLocaleString(),
                icon: Activity,
                color: "border-l-destructive"
              },
            ].map((card) => (
              <div key={card.label} className={`glass-panel p-6 border-l-4 ${card.color} flex items-start justify-between`}>
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase mb-1">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <card.icon className="w-8 h-8 opacity-20" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column Stats Table */}
            <div className="glass-panel p-6">
              <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 text-primary flex items-center gap-2">
                <Table2 className="w-4 h-4" /> Feature Statistics
              </h3>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3">Feature</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Missing</th>
                      <th className="px-4 py-3">Unique</th>
                      <th className="px-4 py-3">Mean</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exploreData.columnStats.map((stat) => (
                      <tr key={stat.name} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-primary font-bold text-xs">{stat.name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{stat.dtype}</td>
                        <td className="px-4 py-3">
                          {exploreData.rowCount - stat.nonNull > 0 ? (
                            <span className="text-destructive font-bold">{exploreData.rowCount - stat.nonNull}</span>
                          ) : <span className="text-chart-3">0</span>}
                        </td>
                        <td className="px-4 py-3 text-xs">{stat.unique}</td>
                        <td className="px-4 py-3 text-xs">{stat.mean != null ? stat.mean.toFixed(2) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Class Distribution */}
            <div className="glass-panel p-6">
              <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 text-accent flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Target Class Distribution
              </h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(exploreData.classCounts).map(([name, count]) => ({ name, count }))}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--secondary))" }}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {Object.keys(exploreData.classCounts).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Data preview (first 5 rows using columnStats names as hint) */}
          <div className="glass-panel p-6">
            <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 text-muted-foreground flex items-center gap-2">
              <Table2 className="w-4 h-4" /> Column Overview
            </h3>
            <div className="flex flex-wrap gap-3">
              {exploreData.columnStats.map((stat, i) => (
                <div key={stat.name} className="px-3 py-2 rounded-md border border-border bg-secondary/30 text-xs">
                  <span className="font-mono font-bold text-primary">{stat.name}</span>
                  <span className="ml-2 text-muted-foreground">{stat.dtype}</span>
                  {stat.mean != null && (
                    <span className="ml-2 text-muted-foreground/60">μ={stat.mean.toFixed(1)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </StageLayout>
  );
}
