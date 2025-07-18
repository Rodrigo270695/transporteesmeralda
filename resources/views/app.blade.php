<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        {{-- PWA Meta Tags --}}
        <meta name="description" content="Aplicación móvil para conductores de Transporte Esmeralda">
        <meta name="theme-color" content="#059669">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="Esmeralda Driver">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="application-name" content="Esmeralda Driver">

        {{-- Manifest --}}
        <link rel="manifest" href="/manifest.json">

        {{-- Icons --}}
        <link rel="icon" href="/logo.png" sizes="any">
        <link rel="icon" href="/icons/icon-96x96.png" sizes="96x96" type="image/png">
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" type="image/png">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png">

        {{-- iOS Splash Screens --}}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png">

        {{-- Microsoft --}}
        <meta name="msapplication-TileColor" content="#059669">
        <meta name="msapplication-config" content="/browserconfig.xml">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
