'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    onScanSuccess: (text: string) => void;
    onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const elementId = 'html5qr-code-full-region';

    useEffect(() => {
        // Инициализируем сканер при монтировании компонента
        scannerRef.current = new Html5Qrcode(elementId);

        // Запускаем сканирование с принудительным выбором фронтальной камеры
        scannerRef.current
            .start(
                { facingMode: 'user' }, // 'user' гарантирует использование фронтальной камеры
                {
                    fps: 10,             // Количество кадров в секунду
                    qrbox: { width: 250, height: 250 }, // Размер области сканирования
                },
                (decodedText) => {
                    // 1. Сначала останавливаем камеру
                    if (scannerRef.current && scannerRef.current.isScanning) {
                        scannerRef.current.stop().then(() => {
                            // 2. Только после успешной остановки шлем данные родителю
                            onScanSuccess(decodedText);
                        }).catch((err) => {
                            console.error("Ошибка остановки:", err);
                            // Если упало, всё равно шлем данные
                            onScanSuccess(decodedText);
                        });
                    } else {
                        onScanSuccess(decodedText);
                    }
                },
                () => {
                    // Игнорируем ошибки непрерывного поиска кода на кадре
                }
            )
            .catch((err) => {
                console.error('Ошибка запуска камеры:', err);
                setError('Не удалось получить доступ к фронтальной камере.');
            });

        // Очистка при размонтировании
        return () => {
            handleStop();
        };
    }, []);

    const handleStop = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
            } catch (err) {
                console.error('Ошибка остановки сканера:', err);
            }
        }
        onClose();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', textAlign: 'center' }}>
                <h3>Сканирование QR</h3>
                {error && <p style={{ color: 'red' }}>{error}</p>}

                {/* Контейнер для видеопотока */}
                <div id={elementId} style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>

                <button onClick={handleStop} style={{ marginTop: '20px', padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Закрыть
                </button>
            </div>
        </div>
    );
}
