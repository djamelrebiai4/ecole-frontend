import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  change,
  trend = "neutral",
}: StatCardProps) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
      <div
        className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[26px] font-bold leading-tight tracking-tight text-fg">
          {value}
        </div>
        <div className="text-sm text-muted">{label}</div>
        {change && (
          <div
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-[13px] font-semibold",
              trend === "up" && "text-success",
              trend === "down" && "text-danger",
              trend === "neutral" && "text-muted"
            )}
          >
            {change}
          </div>
        )}
      </div>
    </div>
  );
}
