import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
    interface Window {
        showToast?: {
            success: (title: string, message?: string) => void;
            error: (title: string, message?: string) => void;
            warning: (title: string, message?: string) => void;
            info: (title: string, message?: string) => void;
        };
    }
}
