import { useExploreDataset, getExploreDatasetQueryKey } from "@workspace/api-client-react";
import { StageLayout } from "@/components/layout/StageLayout";
import { useParams, Redirect } from "wouter";
import { Loader2, BarChart2, Activity } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from "recharts";

export default function Stage2() {
  const { sessionId } = useParams();

  if (!sessionId || sessionId === "new") {
    return <Redirect to="/" />;
  }

  const { data: exploreData, isLoading } = useExploreDataset(sessionId, {
    query: {
      enabled: !!sessionId,
      queryKey: getExploreDatasetQueryKey(sessionId)
    }
  });

  return (
    <StageLayout
      sessionId={sessionId}
      currentStage={2}
      title="Dataset Exploration"
      description="Analyze the statistical properties, distributions, and correlations within your dataset."
      nextDisabled={isLoading || !exploreData}
    >
      {isLoading || !exploreData ? (
        <div className="flex flex-col items-center justify-center py-24 text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="font-mono animate-pulse">ANALYZING DATASET TOPOLOGY...</p>
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 border-l-2 border-l-primary flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-mono mb-1">TOTAL ROWS</p>
                <p className="text-3xl font-bold">{exploreData.rowCount.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-primary/50" />
            </div>
            <div className="glass-panel p-6 border-l-2 border-l-accent flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-mono mb-1">TOTAL COLUMNS</p>
                <p className="text-3xl font-bold">{exploreData.columnCount}</p>
              </div>
              <BarChart2 className="w-8 h-8 text-accent/50" />
            </div>
            <div className="glass-panel p-6 border-l-2 border-l-destructive flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-mono mb-1">MISSING VALUES</p>
                <p className="text-3xl font-bold">
                  {Object.values(exploreData.missingValues).reduce((a, b) => a + b, 0).toLocaleString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-destructive/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column Stats Table */}
            <div className="glass-panel p-6">
              <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 text-primary">
                Feature Statistics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-md">Feature</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Missing</th>
                      <th className="px-4 py-3">Unique</th>
                      <th className="px-4 py-3 rounded-tr-md">Mean</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exploreData.columnStats.map((stat, i) => (
                      <tr key={stat.name} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-primary font-bold">{stat.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{stat.dtype}</td>
                        <td className="px-4 py-3">
                          {exploreData.rowCount - stat.nonNull > 0 ? (
                            <span className="text-destructive font-bold">{exploreData.rowCount - stat.nonNull}</span>
                          ) : "0"}
                        </td>
                        <td className="px-4 py-3">{stat.unique}</td>
                        <td className="px-4 py-3">{stat.mean !== null && stat.mean !== undefined ? stat.mean.toFixed(2) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Class Distribution */}
            <div className="glass-panel p-6">
              <h3 className="font-bold uppercase tracking-wider mb-4 border-b border-border pb-2 text-accent">
                Target Distribution
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(exploreData.classCounts).map(([name, count]) => ({ name, count }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {
                        Object.keys(exploreData.classCounts).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </StageLayout>
  );
}
