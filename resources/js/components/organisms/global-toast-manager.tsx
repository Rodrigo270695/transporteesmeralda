import React, { useState, useCallback, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { ToastContainer } from './toast-container';
import { ToastItem, ToastType } from '@/hooks/use-global-toast';

let toastId = 0;

interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

export function GlobalToastManager() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const { props } = usePage();

    const addToast = useCallback((
        type: ToastType,
        title: string,
        message?: string,
        duration?: number
    ) => {
        const id = `toast-${++toastId}`;
        const newToast: ToastItem = {
            id,
            type,
            title,
            message,
            duration
        };

        setToasts(prev => [...prev, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Manejar flash messages del servidor automáticamente
    useEffect(() => {
        const flash = props.flash as FlashMessages;
        console.log('Flash messages:', flash); // Debug log

        if (flash?.success) {
            addToast('success', '¡Éxito!', flash.success);
        }

        if (flash?.error) {
            addToast('error', 'Error', flash.error);
        }

        if (flash?.warning) {
            addToast('warning', 'Advertencia', flash.warning);
        }

        if (flash?.info) {
            addToast('info', 'Información', flash.info);
        }
    }, [props.flash, addToast]);

    // Exponer funciones globalmente para que otros componentes puedan usarlas
    useEffect(() => {
        window.showToast = {
            success: (title: string, message?: string) => addToast('success', title, message),
            error: (title: string, message?: string) => addToast('error', title, message),
            warning: (title: string, message?: string) => addToast('warning', title, message),
            info: (title: string, message?: string) => addToast('info', title, message)
        };

        return () => {
            if (window.showToast) {
                delete window.showToast;
            }
        };
    }, [addToast]);

    return (
        <ToastContainer
            toasts={toasts}
            onRemove={removeToast}
        />
    );
}
