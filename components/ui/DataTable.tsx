'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  exportFileName?: string;
  extraFilters?: React.ReactNode;
  defaultPageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  emptyIcon?: any;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchFilter,
  onRowClick,
  actions,
  exportFileName = 'data_export',
  extraFilters,
  defaultPageSize = 10,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching your filter criteria.',
  emptyAction,
  emptyIcon = Filter,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    if (searchFilter) {
      return data.filter((item) => searchFilter(item, searchQuery.toLowerCase()));
    }
    return data.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery, searchFilter]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortOrder]);

  // Paginate Data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = new Set(paginatedData.map(keyExtractor));
      setSelectedIds(ids);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedIds(updated);
  };

  const exportCSV = () => {
    if (!sortedData.length) return;
    const headers = columns.map((c) => `"${c.header}"`).join(',');
    const rows = sortedData.map((item: any) =>
      columns
        .map((c) => {
          const val = item[c.key] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c141f] p-4 shadow-sm">
      {/* Control Bar: Search, Filters & Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1c2a3b]">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#00e5c9] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {extraFilters}
          <button
            onClick={exportCSV}
            title="Export CSV"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#233549] bg-slate-50 dark:bg-[#14202e] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c2c3e] hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      {paginatedData.length === 0 ? (
        <div className="py-8">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1c2a3b] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-transparent">
                <th className="py-3 px-3 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedData.length > 0 &&
                      paginatedData.every((item) => selectedIds.has(keyExtractor(item)))
                    }
                    className="rounded border-slate-300 dark:border-[#2a3c50] bg-white dark:bg-[#101824] text-[#00e5c9] focus:ring-0 cursor-pointer"
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      'py-3 px-3',
                      col.sortable && 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-white',
                      col.className
                    )}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <ArrowUpDown
                          className={cn(
                            'h-3 w-3',
                            sortKey === col.key ? 'text-[#00897b] dark:text-[#00e5c9]' : 'text-slate-400 dark:text-slate-600'
                          )}
                        />
                      )}
                    </div>
                  </th>
                ))}
                {actions && <th className="py-3 px-3 text-right w-20">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#182433] text-xs text-slate-800 dark:text-slate-200">
              {paginatedData.map((item) => {
                const id = keyExtractor(item);
                const isSelected = selectedIds.has(id);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      'group transition-colors',
                      isSelected ? 'bg-teal-50 dark:bg-[#0e242c]' : 'hover:bg-slate-50 dark:hover:bg-[#121c29]',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(id)}
                        className="rounded border-slate-300 dark:border-[#2a3c50] bg-white dark:bg-[#101824] text-[#00897b] dark:text-[#00e5c9] focus:ring-0 cursor-pointer"
                      />
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className={cn('py-3 px-3 text-slate-700 dark:text-slate-300', col.className)}>
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                    {actions && (
                      <td
                        className="py-3 px-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-[#1c2a3b] text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>
            Showing{' '}
            <strong className="text-slate-900 dark:text-white">
              {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-900 dark:text-white">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </strong>{' '}
            of <strong className="text-slate-900 dark:text-white">{filteredData.length}</strong> records
          </span>
          {selectedIds.size > 0 && (
            <span className="rounded bg-[#00e5c9]/10 px-2 py-0.5 text-[11px] font-medium text-[#00897b] dark:text-[#00e5c9]">
              {selectedIds.size} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#192636] dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#192636] dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium text-slate-800 dark:text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#192636] dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#192636] dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
