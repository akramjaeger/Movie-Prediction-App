import Link from "next/link";
import { verdictColorClass, verdictLabel } from "@/lib/prediction";

interface RecentPredictionsProps {
  predictions: Array<{
    id: string;
    inputSnapshot: { title: string };
    result: "SUCCESS" | "FAILURE";
    probability?: number | null;
    successScore?: number | null;
    predictedAt: string;
  }>;
}

export default function RecentPredictions({ predictions }: RecentPredictionsProps) {
  const header = (
    <>
      <h2 className="text-sm font-bold uppercase tracking-widest mb-4">Recent predictions</h2>
      <Link
        href="/predict"
        className="text-[10px] font-bold uppercase tracking-widest text-red-900 hover:underline"
      >
        View all →
      </Link>
    </>
  );

  if (predictions.length === 0) {
    return (
      <div className="rounded border border-black/10 bg-black/5 p-4">
        {header}
        <p className="mt-4 text-center text-xs text-black/40">No predictions yet</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-black/10 bg-black/5 p-4">
      {header}
      <div className="space-y-3 mt-2">
        {predictions.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 px-2 py-1.5 rounded hover:bg-white transition">
            <div className="flex-1 min-w-0">
              <Link
                href={`/predict/${p.id}`}
                className="text-sm font-bold hover:underline"
              >
                {p.inputSnapshot.title}
              </Link>
              <div className="text-xs text-black/50">
                {new Date(p.predictedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border border-black px-2.5 py-0.5 text-[10px] font-bold tracking-tighter uppercase ${verdictColorClass(p.result === "SUCCESS" ? "BLOCKBUSTER" : "FLOP")}`}>
                {verdictLabel(p.result === "SUCCESS" ? "BLOCKBUSTER" : "FLOP")}
              </span>
              {p.successScore != null && (
                <span className="text-xs font-mono font-bold">{p.successScore}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
