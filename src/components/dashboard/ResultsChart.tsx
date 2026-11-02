interface ResultsChartProps {
  distribution: { label: "SUCCESS" | "FAILURE"; count: number }[];
}

export default function ResultsChart({ distribution }: ResultsChartProps) {
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {distribution.map((item) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        const height = Math.max(20, (item.count / maxCount) * 120);
        const isSuccess = item.label === "SUCCESS";
        const barClass = isSuccess ? "bg-green-900" : "bg-red-900";
        const label = isSuccess ? "Success" : "Failure";

        return (
          <div key={item.label} className="flex items-end gap-3">
            <div className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t ${barClass} transition-origin origin-bottom`}
                style={{ height: `${height}px` }}
              ></div>
              <span className="text-[10px] font-bold text-black/50 mt-1">{pct}%</span>
            </div>
            <span className="text-sm font-bold min-w-[60px]">{item.count}</span>
            <span className="text-xs text-black/50">{label}</span>
          </div>
        );
      })}

      {total === 0 && (
        <div className="h-32 flex items-center justify-center">
          <p className="text-black/40 text-sm">No predictions yet</p>
        </div>
      )}
    </div>
  );
}
