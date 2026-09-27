import React from 'react';
import { Spinner } from './Spinner.jsx';

export default function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found.',
  onRowClick,
}) {
  const safeData = Array.isArray(data)
    ? data
    : Array.isArray(data?.leaves)
    ? data.leaves
    : Array.isArray(data?.history)
    ? data.history
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || col.accessor || idx} className="px-6 py-4">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Spinner size="md" className="text-indigo-500" />
                  <span className="text-xs">Loading records...</span>
                </div>
              </td>
            </tr>
          ) : safeData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            safeData.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : 'hover:bg-slate-800/30'
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td key={col.key || col.accessor || colIdx} className="px-6 py-4 text-slate-200">
                    {col.cell
                      ? col.cell(row, rowIdx)
                      : col.render
                      ? col.render(row, rowIdx)
                      : row[col.accessor || col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { Table };
