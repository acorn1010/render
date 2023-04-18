import {PropsWithChildren} from "react";
import {cn} from "@/lib/utils";

export function DashboardCard({children, className}: PropsWithChildren<{className?: string}>) {
  return (
      <div className={cn('lg:m-4 bg-zinc-900 p-4 rounded min-w-0', className)}>
        {children}
      </div>
  );
}
