import {useState} from "react";
import {cn} from "@/lib/utils";
import {FaChevronDown, FaChevronUp} from "react-icons/all";
import {localizeNumber} from "@/lib/StringUtils";

const RESULTS_PER_PAGE = 100;

type SortedTableProps<T extends {[key: string]: number | string}> = {
  /** The rows in the table. */
  rows: T[],

  /** If provided, this is the default sort that will be applied to the table. */
  defaultSort?: {column: keyof T, dir: 'asc' | 'desc'},
};

export function SortableTable<T extends {[key: string]: number | string}>(props: SortedTableProps<T>) {
  const {rows: unsortedRows, defaultSort} = props;
  const [sortOrDefault, setSort] =
      useState<{column: keyof T, dir: 'asc' | 'desc'} | null>(defaultSort ?? null);

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
            <div className="rounded overflow-hidden border border-slate-800">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className='bg-slate-800'>
                  <tr>
                    {keys.map(key => (
                        <th key={key as string} scope="col" className="p-2 text-left text-sm font-semibold text-gray-300">
                          <button onClick={() => setSort(prevState => {
                            const prev = prevState ?? {column: keys[0], dir: 'asc'};
                            if (prev?.column === key) {
                              return {column: key, dir: prev.dir === 'asc' ? 'desc' : 'asc'};
                            }
                            return {column: key, dir: 'asc'};
                          })} className={cn(
                              "group inline-flex hover:bg-slate-700 active:bg-slate-700 py-2 px-4 rounded",
                              sort?.column === key && 'text-gray-50'
                          )}>
                            {key as string}
                            <span className={cn(
                                "flex-none rounded",
                                sort?.column === key
                                    ? 'text-gray-100 bg-slate-700 p-1 -m-1 ml-1'
                                    : 'ml-2 text-gray-400 invisible group-hover:visible group-focus:visible',
                            )}>
                                {sort?.column === key && sort.dir === 'asc'
                                    ? <FaChevronDown className="h-4 w-4" aria-hidden="true" />
                                    : <FaChevronUp className="h-4 w-4" aria-hidden="true" />}
                              </span>
                          </button>
                        </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {rows.map((row, idx) => (
                      <tr
                          className={cn(idx % 2 === 0 && 'bg-slate-800/30', 'hover:bg-slate-800')}
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
      </div>
  );
}
