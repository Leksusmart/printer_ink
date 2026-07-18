'use client';
import { useState, useMemo } from 'react';
import { adminApi } from '../../api/adminApi';

interface AdminRequestRow {
    id: number;
    data: string;
    employee_name: string;
    type: string;
    status: string;
    cartridges_count: number;
    isdefective: boolean;
    comment: string;
    lastchangeby_name: string;
    lastchangedata: string;
}

interface CartridgeDetail {
    model: string;
    guid: string;
}

interface RequestsTableProps {
    title: string;
    data: AdminRequestRow[];
    showType?: boolean;
    showStatus?: boolean;
    showDefect?: boolean;
}

const ROWS_COLLAPSED_LIMIT = 3;
type SortableKey = keyof AdminRequestRow;

export default function RequestsTable({ title, data, showType, showStatus, showDefect }: RequestsTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [openFilterMenu, setOpenFilterMenu] = useState<SortableKey | null>(null);

    const [filters, setFilters] = useState<{
        employee_name?: string;
        type?: string;
        isdefective?: boolean;
    }>({});

    const [cartridgeDetailsModal, setCartridgeDetailsModal] = useState<{
        isOpen: boolean;
        requestId: number | null;
        isLoading: boolean;
        error: string;
        items: CartridgeDetail[];
    }>({ isOpen: false, requestId: null, isLoading: false, error: '', items: [] });

    const openCartridgeDetails = async (requestId: number) => {
        setCartridgeDetailsModal({ isOpen: true, requestId, isLoading: true, error: '', items: [] });
        try {
            const items = await adminApi.getCartridgesForRequest(requestId);
            setCartridgeDetailsModal({ isOpen: true, requestId, isLoading: false, error: '', items });
        } catch (err) {
            const error = err as Error;
            setCartridgeDetailsModal({ isOpen: true, requestId, isLoading: false, error: error.message, items: [] });
        }
    };

    const closeCartridgeDetailsModal = () => {
        setCartridgeDetailsModal({ isOpen: false, requestId: null, isLoading: false, error: '', items: [] });
    };

    const uniqueValues = useMemo(() => {
        const employees = [...new Set(data.map(item => item.employee_name).filter(Boolean))].sort();
        const types = [...new Set(data.map(item => item.type).filter(Boolean))].sort();
        return { employees, types };
    }, [data]);

    // Применяем фильтры + сортировку
    const filteredAndSortedItems = useMemo(() => {
        let result = [...data];

        // Применяем фильтры
        if (filters.employee_name) {
            result = result.filter(item => item.employee_name === filters.employee_name);
        }
        if (filters.type) {
            result = result.filter(item => item.type === filters.type);
        }
        if (filters.isdefective !== undefined) {
            result = result.filter(item => item.isdefective === filters.isdefective);
        }

        // Сортировка
        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, filters, sortConfig]);


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

    const columnsWithFilter: SortableKey[] = ['employee_name', 'type', 'isdefective'];

    const columns: { key: SortableKey; label: string }[] = [
        { key: 'id', label: '№' },
        { key: 'data', label: 'Дата создания' },
        { key: 'employee_name', label: 'Кто создал' },
        ...(showType ? [{ key: 'type' as SortableKey, label: 'Тип' }] : []),
        { key: 'cartridges_count', label: 'Картриджи (шт)' },
        ...(showDefect ? [{ key: 'isdefective' as SortableKey, label: 'Дефект' }] : []),
        { key: 'comment', label: 'Комментарий' },
    ];

    const visibleItems = isExpanded
        ? filteredAndSortedItems
        : filteredAndSortedItems.slice(0, ROWS_COLLAPSED_LIMIT);

    const hasMoreRows = filteredAndSortedItems.length > ROWS_COLLAPSED_LIMIT;

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
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
                                const hasFilter = columnsWithFilter.includes(col.key);
                                const currentFilter = col.key === 'employee_name' ? filters.employee_name :
                                    col.key === 'type' ? filters.type :
                                        col.key === 'isdefective' ? filters.isdefective : undefined;

                                const isSorted = sortConfig?.key === col.key;

                                return (
                                    <th
                                        key={col.key}
                                        className="relative px-5 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none whitespace-nowrap"
                                        onClick={() => {
                                            if (hasFilter) {
                                                setOpenFilterMenu(openFilterMenu === col.key ? null : col.key);
                                            } else {
                                                requestSort(col.key);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-1">
                                                {col.label}
                                                {currentFilter !== undefined && <span className="text-blue-600 text-xs">●</span>}
                                            </div>

                                            {hasFilter ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenFilterMenu(openFilterMenu === col.key ? null : col.key);
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
                                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[200px] max-h-[320px] overflow-auto"><div
                                                className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer text-gray-500"
                                                onClick={() => clearFilter(col.key as keyof typeof filters)}
                                            >
                                                Все значения
                                            </div>

                                                {col.key === 'employee_name' && uniqueValues.employees.map(name => (
                                                    <div
                                                        key={name}
                                                        className={`px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${filters.employee_name === name ? 'bg-blue-50 text-blue-700' : ''}`}
                                                        onClick={() => setFilter('employee_name', name)}
                                                    >
                                                        {name}
                                                    </div>
                                                ))}

                                                {col.key === 'type' && uniqueValues.types.map(t => (
                                                    <div
                                                        key={t}
                                                        className={`px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${filters.type === t ? 'bg-blue-50 text-blue-700' : ''}`}
                                                        onClick={() => setFilter('type', t)}
                                                    >
                                                        {t}
                                                    </div>
                                                ))}

                                                {col.key === 'isdefective' && (
                                                    <>
                                                        <div
                                                            className={`px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${filters.isdefective === true ? 'bg-blue-50 text-blue-700' : ''}`}
                                                            onClick={() => setFilter('isdefective', true)}
                                                        >
                                                            Брак
                                                        </div>
                                                        <div
                                                            className={`px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${filters.isdefective === false ? 'bg-blue-50 text-blue-700' : ''}`}
                                                            onClick={() => setFilter('isdefective', false)}
                                                        >
                                                            Нет
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[15px] text-gray-700">
                        {filteredAndSortedItems.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center text-base text-gray-400">
                                    Нет заявок по выбранным фильтрам
                                </td>
                            </tr>
                        ) : (
                            visibleItems.map((row) => (
                                <tr key={row.id} className="transition-colors hover:bg-gray-50/70">
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`px-5 py-4 ${col.key === 'comment' ? 'max-w-[260px] whitespace-normal break-words' : 'max-w-xs truncate'}`}
                                        >
                                            {col.key === 'cartridges_count' ? (
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium">{row.cartridges_count}</span>
                                                    <button
                                                        onClick={() => openCartridgeDetails(row.id)}
                                                        className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                                                    >
                                                        Подробнее
                                                    </button>
                                                </div>
                                            ) : col.key === 'isdefective' ? (
                                                row.isdefective ? (
                                                    <span className="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700">Брак</span>
                                                ) : (
                                                    <span className="rounded bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Нет</span>
                                                )
                                            ) : col.key === 'status' ? (
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${row.status === 'Завершен' || row.status === 'Завершена' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                    {row.status}
                                                </span>
                                            ) : col.key === 'employee_name' || col.key === 'lastchangeby_name' ? (
                                                row[col.key] ? <span className="font-medium">{row[col.key]}</span> : <span className="text-gray-400 italic">—</span>
                                            ) : (col.key === 'data' || col.key === 'lastchangedata') ? (
                                                row[col.key] ? (() => {
                                                    const parsedDate = new Date(String(row[col.key]));
                                                    if (isNaN(parsedDate.getTime())) return <span>{String(row[col.key])}</span>;
                                                    const day = String(parsedDate.getDate()).padStart(2, '0');
                                                    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                                                    const year = String(parsedDate.getFullYear()).slice(-2);
                                                    const hours = String(parsedDate.getHours()).padStart(2, '0');
                                                    const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
                                                    return <span>{`${day}.${month}.${year} ${hours}:${minutes}`}</span>;
                                                })() : <span className="text-gray-400 italic">—</span>
                                            ) : (
                                                String(row[col.key] || '—')
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

            {/* Модалка с картриджами */}
            {cartridgeDetailsModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Картриджи заявки #{cartridgeDetailsModal.requestId}
                            </h3>
                            <button
                                onClick={closeCartridgeDetailsModal}
                                className="text-2xl leading-none text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        {cartridgeDetailsModal.isLoading ? (
                            <div className="py-12 text-center text-gray-500">Загрузка картриджей...</div>
                        ) : cartridgeDetailsModal.error ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
                                {cartridgeDetailsModal.error}
                            </div>
                        ) : cartridgeDetailsModal.items.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">Картриджи не найдены</div>
                        ) : (
                            <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">Модель</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">GUID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                        {cartridgeDetailsModal.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3">{item.model}</td>
                                                <td className="px-4 py-3 font-mono text-xs break-all">{item.guid}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}