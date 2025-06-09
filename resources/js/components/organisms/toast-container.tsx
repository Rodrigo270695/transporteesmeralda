import React from 'react';
import { Toast } from '@/components/molecules/toast';
import { ToastItem } from '@/hooks/use-global-toast';

interface ToastContainerProps {
    toasts: ToastItem[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-end p-6 sm:p-6">
            <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        type={toast.type}
                        title={toast.title}
                        message={toast.message}
                        duration={toast.duration}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        </div>
    );
}
