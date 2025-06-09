import { useState, useCallback, useEffect } from 'react';
import { usePage } from '@inertiajs/react';

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

    // Manejar flash messages automáticamente
    useEffect(() => {
        const flash = props.flash as any;

        if (flash?.success) {
            success('¡Éxito!', flash.success);
        }

        if (flash?.error) {
            error('Error', flash.error);
        }

        if (flash?.warning) {
            warning('Advertencia', flash.warning);
        }

        if (flash?.info) {
            info('Información', flash.info);
        }
    }, [props.flash, success, error, warning, info]);

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
