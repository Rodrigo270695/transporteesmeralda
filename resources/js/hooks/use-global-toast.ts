import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

let toastId = 0;

export function useGlobalToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

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

    const success = (title: string, message?: string) => {
        if (window.showToast) {
            window.showToast.success(title, message);
        }
    };

    const error = (title: string, message?: string) => {
        if (window.showToast) {
            window.showToast.error(title, message);
        }
    };

    const warning = (title: string, message?: string) => {
        if (window.showToast) {
            window.showToast.warning(title, message);
        }
    };

    const info = (title: string, message?: string) => {
        if (window.showToast) {
            window.showToast.info(title, message);
        }
    };

    const clearAll = useCallback(() => {
        setToasts([]);
    }, []);

    // Los flash messages se manejan automáticamente en GlobalToastManager
    // Este hook solo proporciona métodos para mostrar toasts manuales

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
        clearAll
    };
}
