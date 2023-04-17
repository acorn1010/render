import {useState} from "react";
import {cn} from "@/lib/utils";
import {FaChevronDown, FaChevronUp} from "react-icons/all";
import {localizeNumber} from "@/lib/StringUtils";

const RESULTS_PER_PAGE = 100;
export function SortableTable<T extends {[key: string]: number | string}>({rows: unsortedRows}: {rows: T[]}) {
  const [sortOrDefault, setSort] = useState<{column: keyof T, dir: 'asc' | 'desc'} | null>(null);

  const [page] = useState(0);  // TODO(acorn1010): Add support for pagination
  const keys = Object.keys(unsortedRows[0] ?? {}) as (keyof T)[];
  const sort = sortOrDefault ?? {column: keys[0], dir: 'asc'};

  // Sort the rows to display and slice on what data to show
  const rows = unsortedRows.sort((a, b) => {
    const aVal = a[sort.column];
    const bVal = b[sort.column];
    const direction = sort.dir === 'asc' ? 1 : -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction * aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction * (aVal - bVal);
    }
    // TODO(acorn1010): Allow other types
    return 0;
  }).slice(page * RESULTS_PER_PAGE, (page + 1) * RESULTS_PER_PAGE);

  return (
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300 rounded overflow-hidden">
              <thead className='bg-gray-800'>
                <tr>
                  {keys.map(key => (
                      <th key={key as string} scope="col" className="p-2 text-left text-sm font-semibold text-gray-300">
                        <button onClick={() => setSort(prevState => {
                          if (prevState?.column === key) {
                            return {column: key, dir: prevState.dir === 'asc' ? 'desc' : 'asc'};
                          }
                          return {column: key, dir: 'asc'};
                        })} className={cn(
                            "group inline-flex hover:bg-gray-700 active:bg-gray-700 py-2 px-4 rounded",
                            sort?.column === key && 'text-gray-50'
                        )}>
                          {key as string}
                          <span className={cn(
                              "flex-none rounded",
                              sort?.column === key
                                  ? 'text-gray-100 bg-gray-700 p-1 -m-1 ml-1'
                                  : 'ml-2 text-gray-400 invisible group-hover:visible group-focus:visible',
                          )}>
                              {sort?.column === key && sort.dir === 'asc'
                                  ? <FaChevronDown className="h-5 w-5" aria-hidden="true" />
                                  : <FaChevronUp className="h-5 w-5" aria-hidden="true" />}
                            </span>
                        </button>
                      </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-900">
                {rows.map((row, idx) => (
                    <tr
                        className={cn(idx % 2 === 0 && 'bg-gray-800/30', 'hover:bg-gray-800')}
                        key={idx + '_' + page * RESULTS_PER_PAGE + '_' + JSON.stringify(row)}>
                      {Object.entries(row).map(([column, value]) =>
                          <td className='p-2 pl-6 text-gray-100' key={column}>
                            {typeof value === 'number' ? localizeNumber(value) : value}
                          </td>)}
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
