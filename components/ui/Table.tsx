


import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ExcelFilterPopover, ColumnVisibilityPopover } from './Popover';
import { ICONS } from './Icons';

interface TableProps {
    data: any[];
    columns: any[];
    uniqueId: string;
    enableSelection?: boolean;
    onSelectionChange?: (selection: { [key: string]: boolean }) => void;
    isLoading?: boolean;
    onLoadMore?: () => void;
    totalDataCount?: number;
    initialRowSelection?: { [key: string]: boolean };
}

const ROWS_PER_PAGE = 20;

export const Table = ({
    data, columns, uniqueId,
    enableSelection = false, onSelectionChange = () => {},
    isLoading = false,
    onLoadMore = () => {},
    totalDataCount = 0,
    initialRowSelection = {},
}: TableProps) => {
    const [sorting, setSorting] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
    const [columnFilters, setColumnFilters] = useState<{ [key: string]: Set<any> }>({});
    const [rowSelection, setRowSelection] = useState(initialRowSelection);
    const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>({});
    
    const [activeFilterPopover, setActiveFilterPopover] = useState<string | null>(null);
    const [filterPopoverAnchor, setFilterPopoverAnchor] = useState<HTMLElement | null>(null);
    
    const [isColumnPopoverOpen, setColumnPopoverOpen] = useState(false);
    const [columnPopoverAnchor, setColumnPopoverAnchor] = useState<HTMLElement | null>(null);

    const [visibleRows, setVisibleRows] = useState(ROWS_PER_PAGE);
    const loaderRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    
    const storageKey = `smart-table-cols-${uniqueId}`;
    useEffect(() => {
        const savedVisibility = localStorage.getItem(storageKey);
        if (savedVisibility) {
            setColumnVisibility(JSON.parse(savedVisibility));
        }
    }, [storageKey]);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
    }, [columnVisibility, storageKey]);

    useEffect(() => {
        onSelectionChange(rowSelection);
    }, [rowSelection, onSelectionChange]);
    
    useEffect(() => {
        setRowSelection(initialRowSelection);
    }, [initialRowSelection]);

    const visibleColumns = useMemo(() => {
        let initialCols = enableSelection ? [{ accessorKey: 'selection', header: 'Select' }, ...columns] : columns;
        return initialCols.filter(c => columnVisibility[c.accessorKey] !== false);
    }, [columns, enableSelection, columnVisibility]);

    const filteredData = useMemo(() => {
        let filtered = [...data];
        if (Object.keys(columnFilters).length > 0) {
            filtered = filtered.filter(row => {
                // Fix: Explicitly cast `selectedValues` to `Set<any>` to resolve type inference issues with `Object.entries`.
                return Object.entries(columnFilters).every(([key, selectedValues]) => {
                    const filterValues = selectedValues as Set<any>;
                    if (!filterValues || filterValues.size === 0) return true;
                    return filterValues.has(row[key]);
                });
            });
        }
        return filtered;
    }, [data, columnFilters]);
    
    const sortedData = useMemo(() => {
         if (!sorting.key) return filteredData;
         const sorted = [...filteredData];
         sorted.sort((a,b) => {
             const aVal = a[sorting.key!];
             const bVal = b[sorting.key!];
             const order = sorting.direction === 'asc' ? 1 : -1;
             if (aVal === null || aVal === undefined) return 1 * order;
             if (bVal === null || bVal === undefined) return -1 * order;
             if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * order;
             return String(aVal).localeCompare(String(bVal)) * order;
         });
         return sorted;
    }, [filteredData, sorting]);

    const getDataForPopover = useCallback((columnKey: string) => {
        return data.filter(row => {
            // Fix: Explicitly cast `selectedValues` to `Set<any>` to resolve type inference issues with `Object.entries`.
            return Object.entries(columnFilters).every(([key, selectedValues]) => {
                if (key === columnKey) return true;
                const filterValues = selectedValues as Set<any>;
                if (!filterValues || filterValues.size === 0) return true;
                return filterValues.has(row[key]);
            });
        });
    }, [data, columnFilters]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isLoading && onLoadMore) {
                const newVisibleCount = Math.min(visibleRows + ROWS_PER_PAGE, sortedData.length);
                if (newVisibleCount > visibleRows) {
                    setVisibleRows(newVisibleCount);
                } else if (sortedData.length < totalDataCount) {
                    onLoadMore();
                }
            }
        }, { threshold: 1.0 });

        if (loaderRef.current && onLoadMore) observer.observe(loaderRef.current);
        return () => {
            if(loaderRef.current) observer.unobserve(loaderRef.current)
        };
    }, [isLoading, onLoadMore, sortedData.length, totalDataCount, visibleRows]);
    
    const handleFilterIconClick = (e: React.MouseEvent<HTMLButtonElement>, columnKey: string) => {
        e.stopPropagation();
        if (activeFilterPopover === columnKey) {
            setActiveFilterPopover(null);
            setFilterPopoverAnchor(null);
        } else {
            setActiveFilterPopover(columnKey);
            setFilterPopoverAnchor(e.currentTarget);
        }
    };

    const handleApplyColumnFilter = (columnKey: string, selectedValues: Set<any>) => {
        setColumnFilters(prev => ({ ...prev, [columnKey]: selectedValues }));
        setVisibleRows(ROWS_PER_PAGE);
        if (tableContainerRef.current) tableContainerRef.current.scrollTop = 0;
    };

    const handleClearColumnFilter = (columnKey: string) => {
        setColumnFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[columnKey];
            return newFilters;
        });
        setVisibleRows(ROWS_PER_PAGE);
        if (tableContainerRef.current) tableContainerRef.current.scrollTop = 0;
    };

    const handleSort = (key: string, dir: 'asc' | 'desc') => setSorting({ key, direction: dir });
    
    const handleSelectAll = (isChecked: boolean) => {
        const newSelection: { [key: string]: boolean } = {};
        if(isChecked) {
            sortedData.forEach(row => {
                if (!row.isDisabled) newSelection[row[uniqueId]] = true;
            });
        }
        setRowSelection(newSelection);
    };

    const allVisibleSelected = sortedData.length > 0 && sortedData.every(row => row.isDisabled || rowSelection[row[uniqueId]]);
    
    const currentData = onLoadMore ? sortedData.slice(0, visibleRows) : sortedData;

    return React.createElement(React.Fragment, null,
        React.createElement(ExcelFilterPopover, {
            isOpen: !!activeFilterPopover, anchorEl: filterPopoverAnchor,
            onClose: () => setActiveFilterPopover(null),
            onApplyFilter: handleApplyColumnFilter,
            onClearFilter: handleClearColumnFilter,
            onSort: handleSort,
            columnKey: activeFilterPopover,
            data: activeFilterPopover ? getDataForPopover(activeFilterPopover) : [],
            currentFilter: columnFilters[activeFilterPopover!]
        }),
        React.createElement(ColumnVisibilityPopover, {
            isOpen: isColumnPopoverOpen, anchorEl: columnPopoverAnchor,
            onClose: () => setColumnPopoverOpen(false),
            allColumns: columns.filter(c => c.accessorKey !== 'actions'),
            columnVisibility: columnVisibility,
            setColumnVisibility: setColumnVisibility
        }),
        React.createElement('div', { className: "bg-white rounded-xl border border-gray-200" },
            React.createElement('div', { className: 'p-4 border-b flex items-center justify-between' },
                React.createElement('p', { className: "text-sm text-gray-500" }, `Showing ${currentData.length} of ${sortedData.length} records.`),
                React.createElement('div', { className: 'flex items-center space-x-2' },
                     React.createElement('button', {
                         onClick: (e: React.MouseEvent<HTMLButtonElement>) => { setColumnPopoverOpen(true); setColumnPopoverAnchor(e.currentTarget); },
                         className: 'px-3 py-1.5 text-sm text-gray-600 border bg-white rounded-md hover:bg-gray-50'
                     }, 'Columns▾')
                )
            ),
            React.createElement('div', { ref: tableContainerRef, className: "overflow-auto" },
                React.createElement('table', { className: "min-w-full divide-y divide-gray-200 text-sm" },
                    React.createElement('thead', { className: "bg-gray-50 sticky top-0 z-10" },
                        React.createElement('tr', null,
                            visibleColumns.map(col => {
                                if (col.accessorKey === 'selection') {
                                    return React.createElement('th', { key: 'selection', className: 'px-4 py-3 w-12' },
                                        React.createElement('input', { type: 'checkbox', checked: allVisibleSelected, onChange: e => handleSelectAll(e.target.checked), className: "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" })
                                    );
                                }
                                const isFilterActive = columnFilters[col.accessorKey] && columnFilters[col.accessorKey].size > 0;
                                return React.createElement('th', { key: col.accessorKey, className: "px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider group" },
                                   React.createElement('div', { className: "flex items-center space-x-1" },
                                       React.createElement('span', null, col.header),
                                       (col.enableFiltering !== false) && React.createElement('button', { onClick: e => handleFilterIconClick(e, col.accessorKey), className: `transition-opacity text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 focus:opacity-100 ${isFilterActive ? 'text-blue-600 opacity-100' : ''}` },
                                          isFilterActive ? React.createElement(ICONS.FunnelIcon, {}) : React.createElement(ICONS.ChevronDownIcon, { className: 'h-4 w-4' })
                                       )
                                   )
                                )
                            })
                        )
                    ),
                    // Fix: Extracted props to an `any` typed object to bypass incorrect type inference for DOM attributes like `onClick`.
                    React.createElement('tbody', { className: "bg-white divide-y divide-gray-200" },
                        currentData.map((row) => {
                            const trProps: any = {
                                key: row[uniqueId],
                                className: `${rowSelection[row[uniqueId]] ? 'bg-blue-50' : ''} ${row.onClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`,
                                onClick: row.onClick ? () => row.onClick(row) : undefined
                            };
                            return React.createElement('tr', trProps,
                                ...visibleColumns.map(col => {
                                    if (col.accessorKey === 'selection') {
                                        return React.createElement('td', { key: 'selection-cell', className: "px-4 py-4" },
                                            React.createElement('input', {
                                                type: "checkbox", checked: !!rowSelection[row[uniqueId]], onChange: e => {
                                                    const pKey = row[uniqueId];
                                                    setRowSelection(prev => {
                                                        const newSel = { ...prev };
                                                        if (e.target.checked) newSel[pKey] = true;
                                                        else delete newSel[pKey];
                                                        return newSel;
                                                    });
                                                }, disabled: row.isDisabled, className: "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                            })
                                        );
                                    }
                                    const cellValue = row[col.accessorKey];
                                    return React.createElement('td', {
                                        key: col.accessorKey,
                                        className: `px-4 py-4 text-gray-600 whitespace-nowrap`
                                    }, col.cell ? col.cell({ row: row, value: cellValue }) : cellValue);
                                })
                            )
                        })
                    )
                )
            ),
            (onLoadMore && (isLoading || visibleRows < sortedData.length)) && React.createElement('div', { ref: loaderRef, className: 'p-4 text-center text-gray-500' }, 'Loading more items...')
        )
    );
};