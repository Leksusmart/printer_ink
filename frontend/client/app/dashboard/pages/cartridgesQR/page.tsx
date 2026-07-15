'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Один созданный картридж, для которого нужно показать QR-код
interface GeneratedCartridge {
    guid: string;
    model: string;
    isDefective: boolean;
}

// Рисуем QR-код через бесплатный сервис goqr.me — картинка по URL, без установки библиотек.
// Если в проекте уже используется своя генерация QR (например, qrcode.react), можно заменить
// эту функцию на локальный рендер без изменения остальной логики страницы.
const qrImageUrl = (data: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;

function PrintContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userPhone = searchParams.get('phone') || '';

    const [cartridges, setCartridges] = useState<GeneratedCartridge[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const raw = sessionStorage.getItem('generatedCartridges');
        if (raw) {
            try {
                const parsed: GeneratedCartridge[] = JSON.parse(raw);
                setCartridges(parsed);
            } catch {
                setCartridges([]);
            }
        }
        setIsLoading(false);
    }, []);

    // Заглушка — реальная отправка на принтер будет подключена позже
    const handlePrint = (guid: string) => {
        console.log(`Отправка на печать (пока не реализовано): ${guid}`);
    };

    const goBackToDashboard = () => {
        router.push(`/dashboard?phone=${encodeURIComponent(userPhone)}`);
    };

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center text-gray-500">Загрузка...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 font-sans">
            <div className="mx-auto max-w-2xl space-y-4">

                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={goBackToDashboard}
                        className="text-xs text-gray-400 hover:text-blue-500 font-medium tracking-wide uppercase transition-colors duration-200 flex items-center gap-1"
                    >
                        ← Вернуться к заявкам
                    </button>

                    <h1 className="text-xl font-normal text-gray-800">QR-коды новых картриджей</h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Отсканируйте и наклейте QR-код на соответствующий картридж
                    </p>
                </div>

                {cartridges.length === 0 ? (
                    <div className="rounded border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
                        Нет данных для отображения. Возможно, страница была открыта напрямую
                        или данные уже были очищены.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {cartridges.map((item, index) => (
                            <div
                                key={item.guid || index}
                                className="flex flex-col items-center gap-3 rounded border border-blue-400 bg-white p-4 shadow-sm"
                            >
                                <img
                                    src={qrImageUrl(item.guid)}
                                    alt={`QR-код картриджа ${item.guid}`}
                                    className="h-40 w-40"
                                />

                                <div className="w-full space-y-1 text-center">
                                    <p className="text-xs text-gray-500">
                                        Модель: <span className="font-medium text-gray-700">{item.model}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Состояние:{' '}
                                        <span className={`font-medium ${item.isDefective ? 'text-red-600' : 'text-gray-700'}`}>
                                            {item.isDefective ? 'Неисправен' : 'Исправен'}
                                        </span>
                                    </p>
                                    <p className="text-xs break-all text-gray-500">
                                        GUID: <span className="font-medium text-gray-700">{item.guid}</span>
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled
                                    title="Печать пока не подключена"
                                    onClick={() => handlePrint(item.guid)}
                                    className="w-full cursor-not-allowed rounded border border-gray-300 bg-gray-100 py-2 text-xs font-bold tracking-wider text-gray-400 uppercase"
                                >
                                    Отправить на печать
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PrintPage() {
    return (
        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>}>
            <PrintContent />
        </Suspense>
    );
}