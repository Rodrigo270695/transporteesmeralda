import { useState, useCallback } from 'react';
import { ToastItem, ToastType } from '@/components/organisms/toast-container';

let toastId = 0;

export function useToast() {
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

    const success = useCallback((title: string, message?: string, duration?: number) => {
        return addToast('success', title, message, duration);
    }, [addToast]);

    const error = useCallback((title: string, message?: string, duration?: number) => {
        return addToast('error', title, message, duration);
    }, [addToast]);

    const warning = useCallback((title: string, message?: string, duration?: number) => {
        return addToast('warning', title, message, duration);
    }, [addToast]);

    const info = useCallback((title: string, message?: string, duration?: number) => {
        return addToast('info', title, message, duration);
    }, [addToast]);

    const clearAll = useCallback(() => {
        setToasts([]);
    }, []);

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
