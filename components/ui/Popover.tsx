
import React, { useState, useEffect, useMemo, useRef } from 'react';

interface PopoverProps {
    isOpen: boolean;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    // Fix: Made children optional to resolve type errors.
    children?: React.ReactNode;
    className?: string;
}

export const Popover = ({ isOpen, anchorEl, onClose, children, className = '' }: PopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && anchorEl && !anchorEl.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose, anchorEl]);

    if (!isOpen || !anchorEl) return null;

    const rect = anchorEl.getBoundingClientRect();
    const popoverStyle = {
        position: 'absolute',
        top: `${rect.bottom + window.scrollY + 5}px`,
        left: `${rect.left + window.scrollX}px`,
    };

    return React.createElement('div', { ref: popoverRef, style: popoverStyle, onClick: e => e.stopPropagation(), className: `bg-white border border-gray-300 rounded-lg shadow-xl z-20 ${className}`}, children);
};

interface ExcelFilterPopoverProps {
    isOpen: boolean;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onApplyFilter: (columnKey: string, values: Set<any>) => void;
    onClearFilter: (columnKey: string) => void;
    onSort: (columnKey: string, direction: 'asc' | 'desc') => void;
    columnKey: string | null;
    data: any[];
    currentFilter: Set<any> | undefined;
}

export const ExcelFilterPopover = ({ isOpen, anchorEl, onClose, onApplyFilter, onClearFilter, onSort, columnKey, data, currentFilter }: ExcelFilterPopoverProps) => {
    const [checklistSearch, setChecklistSearch] = useState('');

    const uniqueValues = useMemo(() => {
        if (!columnKey) return [];
        const values = new Set(data.map(row => row[columnKey]));
        return Array.from(values).sort((a, b) => String(a).localeCompare(String(b)));
    }, [data, columnKey]);
    
    const [checkedValues, setCheckedValues] = useState(new Set(currentFilter || uniqueValues));

    useEffect(() => {
        if(isOpen) {
            if (!currentFilter || currentFilter.size === 0) {
                setCheckedValues(new Set(uniqueValues));
            } else {
                setCheckedValues(new Set(currentFilter));
            }
        }
    }, [isOpen, uniqueValues, currentFilter]);

    if (!isOpen || !columnKey) return null;

    const filteredChecklistItems = uniqueValues.filter(val =>
        String(val).toLowerCase().includes(checklistSearch.toLowerCase())
    );

    const handleSelectAll = (isChecked: boolean) => {
        if (isChecked) setCheckedValues(new Set(uniqueValues));
        else setCheckedValues(new Set());
    };

    const handleSelectItem = (value: any, isChecked: boolean) => {
        const newChecked = new Set(checkedValues);
        if (isChecked) newChecked.add(value);
        else newChecked.delete(value);
        setCheckedValues(newChecked);
    };
    
    const handleApply = () => {
        onApplyFilter(columnKey, new Set(checkedValues));
        onClose();
    };

    const handleClear = () => {
        onClearFilter(columnKey);
        onClose();
    };
    
    const isAllSelected = checkedValues.size === uniqueValues.length && uniqueValues.length > 0;
    
    return React.createElement(Popover, { isOpen, anchorEl, onClose, className: "flex flex-col min-w-[250px]" },
        React.createElement('div', { className: 'p-2 border-b' },
            React.createElement('button', { onClick: () => { onSort(columnKey, 'asc'); onClose(); }, className: 'w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded' }, 'Sort A to Z'),
            React.createElement('button', { onClick: () => { onSort(columnKey, 'desc'); onClose(); }, className: 'w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded' }, 'Sort Z to A')
        ),
        React.createElement('div', { className: 'p-2 border-b' },
            React.createElement('input', {
                type: 'text', placeholder: '(Search)',
                value: checklistSearch, onChange: e => setChecklistSearch(e.target.value),
                className: 'w-full px-2 py-1 border border-gray-300 rounded-md text-sm'
            })
        ),
        React.createElement('div', { className: 'p-2 border-b max-h-60 overflow-y-auto' },
            React.createElement('label', { className: 'flex items-center space-x-2 px-2 py-1' },
                React.createElement('input', { type: 'checkbox', checked: isAllSelected, onChange: e => handleSelectAll(e.target.checked) }),
                React.createElement('span', { className: 'text-sm font-semibold' }, '(Select All)')
            ),
            filteredChecklistItems.map(value => React.createElement('label', { key: value, className: 'flex items-center space-x-2 px-2 py-1' },
                React.createElement('input', { type: 'checkbox', value: value, checked: checkedValues.has(value), onChange: e => handleSelectItem(value, e.target.checked) }),
                React.createElement('span', { className: 'text-sm' }, value)
            ))
        ),
        React.createElement('div', { className: 'flex justify-end space-x-2 p-2 bg-gray-50' },
            React.createElement('button', { onClick: handleClear, className: 'px-4 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100' }, 'Clear'),
            React.createElement('button', { onClick: handleApply, className: 'px-4 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700' }, 'Apply')
        )
    );
};

interface ColumnVisibilityPopoverProps {
    isOpen: boolean;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    allColumns: any[];
    columnVisibility: { [key: string]: boolean };
    setColumnVisibility: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
}

export const ColumnVisibilityPopover = ({ isOpen, anchorEl, onClose, allColumns, columnVisibility, setColumnVisibility }: ColumnVisibilityPopoverProps) => {
    if (!isOpen) return null;

    return React.createElement(Popover, { isOpen, anchorEl, onClose, className: "p-2 min-w-[200px]" },
        React.createElement('p', { className: 'px-2 py-1 text-xs font-semibold text-gray-500' }, 'Show/Hide Columns'),
        React.createElement('div', { className: 'mt-1' },
            allColumns.map(col => React.createElement('label', { key: col.accessorKey, className: 'flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-100 rounded' },
                React.createElement('input', {
                    type: 'checkbox',
                    checked: columnVisibility[col.accessorKey] !== false,
                    onChange: e => setColumnVisibility(prev => ({ ...prev, [col.accessorKey]: e.target.checked }))
                }),
                React.createElement('span', { className: 'text-sm text-gray-700' }, col.header)
            ))
        )
    );
};
