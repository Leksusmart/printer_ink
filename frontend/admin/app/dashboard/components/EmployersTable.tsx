'use client';
import { useState, useMemo } from 'react';

import CreateUserModal from './CreateUserModal';
import DeleteUserModal from './DeleteUserModal';

interface EmployeeRow {
    id: number;
    fullname: string;
    role: string;
    phone: string;
}

interface EmployersTableProps {
    title: string;
    tableData: EmployeeRow[];
    rowsCollapsedLimit?: number;
    fetchAllData: () => Promise<void>;
}

type SortableKey = keyof EmployeeRow;
type ColumnKey = SortableKey;

export default function EmployersTable({ title, tableData, rowsCollapsedLimit, fetchAllData }: EmployersTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [openFilterMenu, setOpenFilterMenu] = useState<SortableKey | null>(null);
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
    const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);

    const [filters, setFilters] = useState<{
        fullname?: string;
        role?: string;
    }>({});

    const uniqueValues = useMemo(() => {
        const names = [...new Set(tableData.map(item => item.fullname).filter(Boolean))].sort();
        const roles = [...new Set(tableData.map(item => item.role).filter(Boolean))].sort();
        return { names, roles };
    }, [tableData]);

    const filteredAndSortedItems = useMemo(() => {
        let result = [...tableData];

        if (filters.fullname) {
            result = result.filter(item => item.fullname === filters.fullname);
        }
        if (filters.role) {
            result = result.filter(item => item.role === filters.role);
        }

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [tableData, filters, sortConfig]);

    const requestSort = (key: SortableKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const setFilter = (key: keyof typeof filters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setOpenFilterMenu(null);
    };

    const clearFilter = (key: keyof typeof filters) => {
        setFilters(prev => ({ ...prev, [key]: undefined }));
        setOpenFilterMenu(null);
    };

    const columnsWithFilter: SortableKey[] = ['role'];

    const columns: { key: ColumnKey; label: string }[] = [
        { key: 'id', label: '№' },
        { key: 'fullname', label: 'ФИО' },
        { key: 'role', label: 'Роль' },
        { key: 'phone', label: 'Телефон' }

    ];

    const limit = rowsCollapsedLimit ?? 5;

    // Ширины колонок:
    const columnWidthClass = (key: ColumnKey): string => {
        switch (key) {
            case 'id': return 'w-10';
            case 'fullname': return 'w-auto flex-1';
            case 'role': return 'w-25';
            case 'phone': return 'w-32';
            default: return '';
        }
    };

    const visibleItems = isExpanded
        ? filteredAndSortedItems
        : filteredAndSortedItems.slice(0, limit);

    const hasMoreRows = filteredAndSortedItems.length > limit;

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <div className="flex flex-wrap items-center gap-3 sm:mr-auto sm:ml-4 w-full sm:w-auto">
                    <button
                        onClick={() => setIsCreateUserModalOpen(true)}
                        className="flex-1 min-w-[160px] sm:flex-initial px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/50 shadow-sm text-slate-700 rounded-xl font-medium transition-all active:scale-95"
                    >
                        Добавить сотрудника
                    </button>
                    <button
                        onClick={() => setIsDeleteUserModalOpen(true)}
                        className="flex-1 min-w-[160px] sm:flex-initial px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/50 shadow-sm text-red-600 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Удалить сотрудника
                    </button>
                </div>
                {hasMoreRows && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        {isExpanded ? 'Свернуть таблицу' : 'Развернуть таблицу'}
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-base">
                    <thead className="border-b border-gray-200 bg-gray-50 text-sm font-semibold tracking-wider text-gray-700 uppercase">
                        <tr>
                            {columns.map((col) => {
                                const hasFilter = columnsWithFilter.includes(col.key as SortableKey);
                                const currentFilter = col.key === 'role' ? filters.role :
                                        undefined;

                                const isSorted = sortConfig?.key === col.key;

                                return (
                                    <th
                                        key={col.key}
                                        className={`relative px-5 py-4 transition-colors select-none whitespace-nowrap ${columnWidthClass(col.key)} 'cursor-pointer hover:bg-gray-100'}`}
                                        onClick={() => {
                                            if (hasFilter) {
                                                setOpenFilterMenu(openFilterMenu === col.key ? null : (col.key as SortableKey));
                                            } else {
                                                requestSort(col.key as SortableKey);
                                            }
                                        }}
                                    >
                                        <>
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-1">
                                                    {col.label}
                                                    {currentFilter !== undefined && <span className="text-blue-600 text-xs">●</span>}
                                                </div>

                                                {hasFilter ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenFilterMenu(openFilterMenu === col.key ? null : (col.key as SortableKey));
                                                        }}
                                                        className="text-gray-400 hover:text-gray-600 text-xs ml-2"
                                                    >
                                                        ▼
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        {isSorted ? (sortConfig!.direction === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                                                    </span>
                                                )}
                                            </div>

                                            {hasFilter && openFilterMenu === col.key && (
                                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[200px] max-h-[320px] overflow-auto">
                                                    <div
                                                        className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer text-gray-500"
                                                        onClick={() => clearFilter(col.key as keyof typeof filters)}
                                                    >
                                                        Все значения
                                                    </div>

                                                    {col.key === 'role' && uniqueValues.roles.map(r => (
                                                        <div
                                                            key={r}
                                                            className={`px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${filters.role === r ? 'bg-blue-50 text-blue-700' : ''}`}
                                                            onClick={() => setFilter('role', r)}
                                                        >
                                                            {r}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[15px] text-gray-700">
                        {filteredAndSortedItems.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center text-base text-gray-400">
                                    Нет сотрудников по выбранным фильтрам
                                </td>
                            </tr>
                        ) : (
                            visibleItems.map((row) => (
                                <tr key={row.id} className="transition-colors hover:bg-gray-50/70">
                                    {columns.map((col) => (
                                        <td key={col.key} className={`px-5 py-4 ${columnWidthClass(col.key)} ${col.key === 'fullname' ? 'font-mono text-sm break-all select-all' : 'max-w-[140px] truncate'}`} >
                                            {col.key === 'fullname' ? (
                                                row.fullname
                                            ) : col.key === 'role' ? (
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${row.role === 'Admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {row.role}
                                                </span>
                                            ) : (
                                                String(row[col.key] ?? '—')
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isExpanded && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Свернуть таблицу
                    </button>
                </div>
            )}

            <CreateUserModal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} onSuccess={fetchAllData} />
            <DeleteUserModal isOpen={isDeleteUserModalOpen} onClose={() => setIsDeleteUserModalOpen(false)} onSuccess={fetchAllData} />

        </div>
    );
}
