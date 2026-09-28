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
    <div className="w-full overflow-x-auto rounded-lg border border-[#e5e7eb] dark:border-[#262626] bg-white dark:bg-[#171717]">
      <table className="w-full text-left text-[13px] text-[#111827] dark:text-[#fafafa]">
        <thead className="border-b border-[#e5e7eb] dark:border-[#262626] bg-[#fafafa] dark:bg-[#1c1c1c] text-[11px] font-medium uppercase tracking-wider text-[#6b7280] dark:text-[#a3a3a3]">
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || col.accessor || idx} className="px-3.5 py-2.5 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#262626]">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#6b7280]">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <Spinner size="sm" className="text-[#3b82f6]" />
                  <span className="text-xs">Loading records...</span>
                </div>
              </td>
            </tr>
          ) : safeData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#6b7280] dark:text-[#a3a3a3] text-xs">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            safeData.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`h-10 transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#212121]' : 'hover:bg-[#fafafa] dark:hover:bg-[#212121]'
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td key={col.key || col.accessor || colIdx} className="px-3.5 py-2 text-[#111827] dark:text-[#e5e7eb]">
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
