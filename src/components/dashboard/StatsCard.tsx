interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  variant?: "default" | "green" | "red";
}

export default function DashboardStatsCard({ title, value, icon, variant = "default" }: StatsCardProps) {
  const ring =
    variant === "green"
      ? "ring-2 ring-green-900"
      : variant === "red"
        ? "ring-2 ring-red-900"
        : "ring-2 ring-black";
  const text =
    variant === "green"
      ? "text-green-900"
      : variant === "red"
        ? "text-red-900"
        : "text-black";

  return (
    <div className={`rounded-xl border border-black/10 bg-white p-4 sm:p-6 shadow-sm ${ring}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-2">
        {title}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-black ${text}`}>{value}</span>
        <span className={`${icon} text-2xl`} />
      </div>
    </div>
  );
}
