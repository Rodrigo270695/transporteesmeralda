import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    onRemove: (id: string) => void;
}

const toastConfig = {
    success: {
        icon: CheckCircle,
        className: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200',
        iconClassName: 'text-green-500 dark:text-green-400'
    },
    error: {
        icon: XCircle,
        className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200',
        iconClassName: 'text-red-500 dark:text-red-400'
    },
    warning: {
        icon: AlertTriangle,
        className: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
        iconClassName: 'text-yellow-500 dark:text-yellow-400'
    },
    info: {
        icon: Info,
        className: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
        iconClassName: 'text-blue-500 dark:text-blue-400'
    }
};

export function Toast({ id, type, title, message, duration = 5000, onRemove }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const config = toastConfig[type];
    const Icon = config.icon;

    useEffect(() => {
        // Entrada animada
        const showTimer = setTimeout(() => setIsVisible(true), 100);

        // Auto-dismiss
        const hideTimer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(() => onRemove(id), 300);
        }, duration);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [id, duration, onRemove]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => onRemove(id), 300);
    };

    return (
        <div
            className={cn(
                "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-in-out",
                config.className,
                isVisible && !isLeaving
                    ? "translate-x-0 opacity-100"
                    : "translate-x-full opacity-0"
            )}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon className={cn("h-5 w-5", config.iconClassName)} />
                    </div>

                    <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium">
                            {title}
                        </p>
                        {message && (
                            <p className="mt-1 text-sm opacity-90">
                                {message}
                            </p>
                        )}
                    </div>

                    <div className="ml-4 flex flex-shrink-0">
                        <button
                            type="button"
                            className="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:hover:bg-white/5"
                            onClick={handleClose}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
