import {cn} from "@/lib/utils";

/** Provides a simple rectangular skeleton for use when a component is loading. */
export function Skeleton({className}: { className?: string }) {
  return <div className={cn('h-8 w-full animate-pulse rounded-md bg-zinc-700', className)} />;
}
