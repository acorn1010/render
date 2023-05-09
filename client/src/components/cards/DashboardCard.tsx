import {PropsWithChildren} from "react";
import {cn} from "@/lib/utils";

export function DashboardCard({children, className}: PropsWithChildren<{className?: string}>) {
  return (
      <div className={cn('lg:m-4 bg-slate-800/50 border border-slate-800 shadow p-4 rounded min-w-0', className)}>
        {children}
      </div>
  );
}
