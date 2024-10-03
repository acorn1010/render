import {FaPlus} from "react-icons/all";
import {Link} from "wouter";
import {poll} from "@/api/call";
import {isLoaded} from "@/state/isLoaded";
import {SortableTable} from "@/components/tables/SortedTable";
import { CloneChildren } from "@/components/base/loading/CloneChildren";
import { Skeleton } from "@/components/base/loading/Skeleton";

export default function DashboardHomePage() {
  const renderCounts = poll.use('getMonthlyRenderCounts');

  if (!isLoaded(renderCounts)) {
    return <TableSkeleton rows={10} cols={2}/>
  }

  return renderCounts ? <MonthlyRenderTable renderCounts={renderCounts} /> : <EmptyDashboard />;
}

function MonthlyRenderTable({renderCounts}: {renderCounts: {month: string, renderCount: number}[]}) {
  return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-gray-200">Renders by Month</h1>
            <p className="mt-2 text-sm text-gray-400">
              A list of the total page renders for each month.
            </p>
          </div>
        </div>
        <SortableTable
            rows={renderCounts.map(
                ({month, renderCount}) => ({'Month': month, 'Render Count': renderCount})
            )}
            defaultSort={{column: 'Month', dir: 'desc'}}
        />
      </div>
  );
}

function TableSkeleton({rows, cols}:{ rows: number, cols: number}){
    return (
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="divide-y divide-slate-700 bg-slate-900 rounded-md">
            <CloneChildren count={rows}>
                <div className="flex sm:flex-row flex-col p-4 sm:gap-0 gap-3 group">
                  <CloneChildren count={cols}>
                    <div className="sm:flex-1 odd:w-48 w-24 sm:w-full px-2">
                      <Skeleton className="sm:h-5 h-4 sm:group-odd:w-48 sm:w-24 bg-slate-700"/>
                    </div>
                    </CloneChildren>
                </div>
            </CloneChildren>
          </div>
        </div>
    )
}

function EmptyDashboard() {
  return (
      <div className="text-center">
        <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
        >
          <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-200">No recent renders</h3>
        <p className="mt-1 text-sm text-gray-400">Get started by adding a Cloudflare worker render script for your site.</p>
        <div className="mt-6">
          <Link
              to='/getting-started'
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 active:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <FaPlus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Render Script
          </Link>
        </div>
      </div>
  );
}
