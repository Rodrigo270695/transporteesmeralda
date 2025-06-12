import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    define: {
        // Claves VAPID de prueba para desarrollo
        'import.meta.env.VITE_VAPID_PUBLIC_KEY': JSON.stringify('BEl62iUYgUivxIkv69yViEuiBIa40HI2PjWeWkS8vatOCA4MGvOV4F9wH8JKEjhA5GX5-rXW6cO7-VvPgAW0MZY'),
        'import.meta.env.VITE_APP_NAME': JSON.stringify('Transporte Esmeralda'),
    },
});
