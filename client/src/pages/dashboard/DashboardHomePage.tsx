import {FaPlus} from "react-icons/all";
import {Link} from "wouter";
import {poll} from "@/api/call";
import {isLoaded} from "@/state/isLoaded";
import {Skeleton} from "@/components/base/loading/Skeleton";

export default function DashboardHomePage() {
  const monthlyRenderCounts = poll.use('getMonthlyRenderCounts');

  if (!isLoaded(monthlyRenderCounts)) {
    return <Skeleton className='h-32' />
  }

  return <EmptyDashboard />;
}

export function EmptyDashboard() {
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
