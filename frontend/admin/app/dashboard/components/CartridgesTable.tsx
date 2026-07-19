'use client';
import { useState, useMemo } from 'react';
import { adminApi } from '../../api/adminApi';

import CreateCartridgeModal from './CreateCartridgeModal';
import DeleteCartridgeModal from './DeleteCartridgeModal';

interface CartridgeRow {
    id: number;
    guid: string;
    model: string;
    status: string;
    isdefective: boolean
    lastchangeby?: string;
    lastchangedata?: string;
    comment?: string;
}

interface RequestHistoryItem {
    id: number;
    data: string;
    employee_name: string;
    type: string;
    status: string;
    isdefective: boolean;
    comment: string;
}

interface CartridgesTableProps {
    title: string;
    tableData: CartridgeRow[];
    rowsCollapsedLimit?: number;
    fetchAllData: () => Promise<void>;
}

type SortableKey = keyof CartridgeRow;
type ColumnKey = SortableKey | 'history';

export default function CartridgesTable({ title, tableData, rowsCollapsedLimit, fetchAllData }: CartridgesTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [openFilterMenu, setOpenFilterMenu] = useState<SortableKey | null>(null);

    const [isCreateCartridgeModalOpen, setIsCreateCartridgeModalOpen] = useState(false);
    const [isDeleteCartridgeModalOpen, setIsDeleteCartridgeModalOpen] = useState(false);

    const [requestsHistoryModal, setRequestsHistoryModal] = useState<{
        isOpen: boolean;
        guid: string | null;
        isLoading: boolean;
        error: string;
        items: RequestHistoryItem[];
    }>({ isOpen: false, guid: null, isLoading: false, error: '', items: [] });

    const openRequestsHistory = async (guid: string) => {
        setRequestsHistoryModal({ isOpen: true, guid, isLoading: true, error: '', items: [] });
        try {
            const items = await adminApi.getRequestsByGuid(guid);
            setRequestsHistoryModal({ isOpen: true, guid, isLoading: false, error: '', items });
        } catch (err) {
            const error = err as Error;
            setRequestsHistoryModal({ isOpen: true, guid, isLoading: false, error: error.message, items: [] });
        }
    };

    const closeRequestsHistoryModal = () => {
        setRequestsHistoryModal({ isOpen: false, guid: null, isLoading: false, error: '', items: [] });
    };

    const [filters, setFilters] = useState<{
        model?: string;
        status?: string;
        lastchangeby?: string;
        isdefective?: boolean;
    }>({});

    const uniqueValues = useMemo(() => {
        const models = [...new Set(tableData.map(item => item.model).filter(Boolean))].sort();
        const statuses = [...new Set(tableData.map(item => item.status).filter(Boolean))].sort();
        const lastchangeemployers = [...new Set(tableData.map(item => item.lastchangeby).filter(Boolean))].sort();
        return { models, statuses, lastchangeemployers };
    }, [tableData]);

    const filteredAndSortedItems = useMemo(() => {
        let result = [...tableData];

        if (filters.model) {
            result = result.filter(item => item.model === filters.model);
        }
        if (filters.status) {
            result = result.filter(item => item.status === filters.status);
        }
        if (filters.isdefective !== undefined) {
            result = result.filter(item => item.isdefective === filters.isdefective);
        }
        if (filters.lastchangeby) {
            result = result.filter(item => item.lastchangeby === filters.lastchangeby);
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

    const columnsWithFilter: SortableKey[] = ['model', 'isdefective', 'status', 'lastchangeby' ];

    const columns: { key: ColumnKey; label: string }[] = [
        { key: 'id', label: '№' },
        { key: 'guid', label: 'GUID' },
        { key: 'model', label: 'Модель' },
        { key: 'isdefective', label: 'Дефект' },
        { key: 'status', label: 'Статус' },
        { key: 'lastchangeby', label: 'Ответственный' },
        { key: 'lastchangedata', label: 'Изменён' },
        { key: 'comment', label: 'Комментарий' },
        { key: 'history', label: ' ' },
    ];

    const limit = rowsCollapsedLimit ?? 5;

    // Ширины колонок: GUID — широкий, чтобы помещался целиком и было удобно копировать;
    // остальные — уже, чтобы освободить ему место.
    const columnWidthClass = (key: ColumnKey): string => {
        switch (key) {
            case 'id': return 'w-10';
            case 'guid': return 'w-[360px] max-w-[360px]';
            case 'model': return 'w-28';
            case 'isdefective': return 'w-20';
            case 'status': return 'w-48';
            case 'lastchangeby': return 'w-32';
            case 'lastchangedata': return 'w-40';
            case 'comment': return 'w-auto flex-1';
            case 'history': return 'w-28';
            default: return '';
        }
    };

    const visibleItems = isExpanded
        ? filteredAndSortedItems
        : filteredAndSortedItems.slice(0, limit);

    const hasMoreRows = filteredAndSortedItems.length > limit;

    const formatFIO = (fullName: string): string => {
        if (!fullName) return '';

        // Разбиваем строку по пробелам и убираем лишние пробелы
        const parts = fullName.trim().split(/\s+/);

        // Если имя состоит только из одного слова (например, только Фамилия)
        if (parts.length === 1) return parts[0];

        const lastName = parts[0];
        const firstNameLetter = parts[1] ? ` ${parts[1][0]}.` : '';
        const middleNameLetter = parts[2] ? ` ${parts[2][0]}.` : '';

        return `${lastName}${firstNameLetter}${middleNameLetter}`;
    };


    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <div className="flex flex-wrap items-center gap-3 sm:mr-auto sm:ml-4 w-full sm:w-auto">
                    <button
                        onClick={() => setIsCreateCartridgeModalOpen(true)}
                        className="flex-1 min-w-[160px] sm:flex-initial px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/50 shadow-sm text-slate-700 rounded-xl font-medium transition-all active:scale-95"
                    >
                        Добавить картридж
                    </button>
                    <button
                        onClick={() => setIsDeleteCartridgeModalOpen(true)}
                        className="flex-1 min-w-[160px] sm:flex-initial px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-md border border-white/50 shadow-sm text-red-600 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Списать картридж
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
                                const isActionColumn = col.key === 'history';
                                const hasFilter = !isActionColumn && columnsWithFilter.includes(col.key as SortableKey);
                                const currentFilter = col.key === 'model' ? filters.model :
                                    col.key === 'status' ? filters.status :
                                        col.key === 'isdefective' ? filters.isdefective :
                                            col.key === 'lastchangeby' ? filters.lastchangeby :
                                                undefined;

                                const isSorted = sortConfig?.key === col.key;

                                return (
                                    <th
                                        key={col.key}
                                        className={`relative px-5 py-4 transition-colors select-none whitespace-nowrap ${columnWidthClass(col.key)} ${isActionColumn ? '' : 'cursor-pointer hover:bg-gray-100'}`}
                                        onClick={() => {
                                            if (isActionColumn) return;
                                            if (hasFilter) {
                                                setOpenFilterMenu(openFilterMenu === col.key ? null : (col.key as SortableKey));
                                            } else {
                                                requestSort(col.key as SortableKey);
                                            }
                                        }}
                                    >
                                        {isActionColumn ? (
                                            <div className="flex items-center">{col.label}</div>
                                        ) : (
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

                                                {col.key === 'model' && uniqueValues.models.map(m => (
                                                    <div
                                                        key={m}
                                                        className={`px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${filters.model === m ? 'bg-blue-50 text-blue-700' : ''}`}
                                                        onClick={() => setFilter('model', m)}
                                                    >
                                                        {m}
                                                    </div>
                                                ))}

                                                {col.key === 'status' && uniqueValues.statuses.map(s => (
                                                    <div
                                                        key={s}
                                                        className={`px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${filters.status === s ? 'bg-blue-50 text-blue-700' : ''}`}
                                                        onClick={() => setFilter('status', s)}
                                                    >
                                                        {s}
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

                                                {col.key === 'lastchangeby' && uniqueValues.lastchangeemployers.map(l => (
                                                    <div
                                                        key={l}
                                                        className={`px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${filters.status === l ? 'bg-blue-50 text-blue-700' : ''}`}
                                                        onClick={() => setFilter('lastchangeby', l)}
                                                    >
                                                        {l}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        </>
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
                                    Нет картриджей по выбранным фильтрам
                                </td>
                            </tr>
                        ) : (
                            visibleItems.map((row) => (
                                <tr key={row.id} className="transition-colors hover:bg-gray-50/70">
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`px-5 py-4 ${columnWidthClass(col.key)} ${col.key === 'guid' ? 'font-mono text-sm break-all select-all' : 'max-w-[140px] truncate'}`}
                                        >
                                            {col.key === 'guid' ? (
                                                row.guid
                                            ) : col.key === 'isdefective' ? (
                                                row.isdefective ? (
                                                    <span className="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700">Брак</span>
                                                ) : (
                                                    <span className="rounded bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Нет</span>
                                                )
                                            ) : col.key === 'status' ? (
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${row.status === 'Готов к выдаче' || row.status === 'Выдан' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                    {row.status}
                                                </span>
                                            ) : col.key === 'lastchangeby' ? (
                                                    row.lastchangeby ? <span className="font-medium">{formatFIO(row.lastchangeby)}</span> : <span className="text-gray-400 italic">—</span>
                                            ) : col.key === 'comment' ? (
                                                    row.comment ? <span className="font-medium">{row.comment}</span> : <span className="text-gray-400 italic">—</span>
                                            ) : col.key === 'lastchangedata' ? (
                                                    row.lastchangedata ? <span className="font-medium">{String(row[col.key])}</span> : <span className="text-gray-400 italic">—</span>
                                            ) : col.key === 'history' ? (
                                                <button
                                                    onClick={() => openRequestsHistory(row.guid)}
                                                    className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                                                >
                                                    История
                                                </button>
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

            {/* Модалка с историей заявок по конкретному GUID картриджа */}
            {requestsHistoryModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                История заявок картриджа
                                <span className="ml-2 font-mono text-xs font-normal text-gray-400 break-all">
                                    {requestsHistoryModal.guid}
                                </span>
                            </h3>
                            <button
                                onClick={closeRequestsHistoryModal}
                                className="text-2xl leading-none text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        {requestsHistoryModal.isLoading ? (
                            <div className="py-12 text-center text-gray-500">Загрузка заявок...</div>
                        ) : requestsHistoryModal.error ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
                                {requestsHistoryModal.error}
                            </div>
                        ) : requestsHistoryModal.items.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">Этот картридж ещё не привязывался ни к одной заявке</div>
                        ) : (
                            <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">№</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">Тип</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">Кто создал</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">Когда создал</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">Комментарий</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                        {requestsHistoryModal.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3">{item.id}</td>
                                                <td className="px-4 py-3">{item.type}</td>
                                                <td className="px-4 py-3">{item.employee_name}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{item.data}</td>
                                                <td className="px-4 py-3">
                                                    {item.comment ? item.comment : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <CreateCartridgeModal isOpen={isCreateCartridgeModalOpen} onClose={() => setIsCreateCartridgeModalOpen(false)} onSuccess={fetchAllData} />
            <DeleteCartridgeModal isOpen={isDeleteCartridgeModalOpen} onClose={() => setIsDeleteCartridgeModalOpen(false)} onSuccess={fetchAllData} />

        </div>
    );
}
