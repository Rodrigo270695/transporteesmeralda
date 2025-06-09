import { Head } from '@inertiajs/react';
import { Truck, MapPin, Route, Package, Clock, Shield, Navigation } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <>
            <Head title="TRANSPORTES Y DISTRIBUCIONES ESMERALDA" />
            <div className="min-h-screen bg-gradient-to-b from-sky-100 to-emerald-50 dark:from-slate-900 dark:to-emerald-950 text-foreground relative overflow-hidden">

                {/* Carretera principal - Elemento visual dominante */}
                <div className="absolute inset-0">
                    {/* Carretera diagonal principal */}
                    <div className="absolute inset-0">
                        <svg viewBox="0 0 1200 800" className="w-full h-full opacity-20 dark:opacity-10">
                            {/* Carretera base */}
                            <path
                                d="M-100 600 Q300 500 600 400 Q900 300 1300 200"
                                stroke="currentColor"
                                strokeWidth="120"
                                fill="none"
                                className="text-slate-400 dark:text-slate-600"
                            />
                            {/* Líneas divisorias */}
                            <path
                                d="M-100 600 Q300 500 600 400 Q900 300 1300 200"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray="40 30"
                                className="text-yellow-400 dark:text-yellow-600"
                            />
                            {/* Bordes de carretera */}
                            <path
                                d="M-100 600 Q300 500 600 400 Q900 300 1300 200"
                                stroke="currentColor"
                                strokeWidth="124"
                                fill="none"
                                className="text-slate-300 dark:text-slate-700"
                                opacity="0.5"
                            />
                        </svg>
                    </div>

                    {/* Paisaje de fondo */}
                    <div className="absolute inset-0">
                        {/* Montañas estilizadas */}
                        <svg viewBox="0 0 1200 800" className="w-full h-full opacity-15 dark:opacity-8">
                            <polygon points="0,400 200,200 400,350 600,150 800,300 1000,100 1200,250 1200,800 0,800"
                                     fill="currentColor" className="text-emerald-300 dark:text-emerald-800"/>
                            <polygon points="100,450 300,250 500,400 700,200 900,350 1100,150 1200,300 1200,800 0,800"
                                     fill="currentColor" className="text-emerald-400 dark:text-emerald-700" opacity="0.7"/>
                        </svg>

                        {/* Nubes */}
                        <div className="absolute top-10 left-1/4 w-20 h-12 bg-white/30 dark:bg-white/10 rounded-full"></div>
                        <div className="absolute top-16 left-1/3 w-16 h-10 bg-white/25 dark:bg-white/8 rounded-full"></div>
                        <div className="absolute top-8 right-1/4 w-24 h-14 bg-white/35 dark:bg-white/12 rounded-full"></div>
                        <div className="absolute top-20 right-1/6 w-18 h-11 bg-white/28 dark:bg-white/9 rounded-full"></div>
                    </div>

                    {/* Señales de tráfico y elementos de carretera */}
                    <div className="absolute inset-0">
                        {/* Señal de tráfico izquierda */}
                        <div className="absolute bottom-32 left-16 opacity-40 dark:opacity-60">
                            <div className="w-2 h-20 bg-slate-400 dark:bg-slate-600 mx-auto"></div>
                            <div className="w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center transform -rotate-12">
                                <Navigation className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* Señal de límite de velocidad */}
                        <div className="absolute top-1/3 right-20 opacity-35 dark:opacity-55">
                            <div className="w-2 h-16 bg-slate-400 dark:bg-slate-600 mx-auto"></div>
                            <div className="w-14 h-14 bg-red-500 dark:bg-red-600 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">80</span>
                            </div>
                        </div>

                        {/* Poste kilométrico */}
                        <div className="absolute bottom-1/4 right-1/3 opacity-30 dark:opacity-50">
                            <div className="w-3 h-24 bg-slate-400 dark:bg-slate-600"></div>
                            <div className="w-12 h-8 bg-white dark:bg-slate-200 border-2 border-slate-400 flex items-center justify-center">
                                <span className="text-slate-700 text-xs font-mono">KM 45</span>
                            </div>
                        </div>
                    </div>

                    {/* Elementos de transporte en movimiento */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Camión en carretera */}
                        <div className="absolute bottom-1/3 left-1/5 opacity-25 dark:opacity-40 animate-pulse" style={{ animationDuration: '3s' }}>
                            <div className="flex items-end gap-1">
                                <div className="w-8 h-6 bg-blue-600 dark:bg-blue-700 rounded-t-lg"></div>
                                <div className="w-12 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                                <div className="w-2 h-2 bg-slate-800 dark:bg-slate-400 rounded-full"></div>
                                <div className="w-2 h-2 bg-slate-800 dark:bg-slate-400 rounded-full ml-2"></div>
                                <div className="w-2 h-2 bg-slate-800 dark:bg-slate-400 rounded-full ml-4"></div>
                                <div className="w-2 h-2 bg-slate-800 dark:bg-slate-400 rounded-full"></div>
                            </div>
                        </div>

                        {/* Edificios en el horizonte */}
                        <div className="absolute bottom-0 left-0 w-full opacity-20 dark:opacity-10">
                            <div className="flex items-end justify-center gap-2 h-32">
                                <div className="w-8 h-16 bg-slate-400 dark:bg-slate-600"></div>
                                <div className="w-6 h-20 bg-slate-500 dark:bg-slate-700"></div>
                                <div className="w-4 h-12 bg-slate-400 dark:bg-slate-600"></div>
                                <div className="w-10 h-24 bg-slate-500 dark:bg-slate-700"></div>
                                <div className="w-5 h-18 bg-slate-400 dark:bg-slate-600"></div>
                                <div className="w-7 h-22 bg-slate-500 dark:bg-slate-700"></div>
                                <div className="w-6 h-14 bg-slate-400 dark:bg-slate-600"></div>
                            </div>
                        </div>
                    </div>

                    {/* Overlay gradiente para profundidad */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-background/20"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20"></div>
                </div>


                {/* Card de login centrado */}
                <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                        {/* Floating login card */}
                        <div className="relative">
                            {/* Card shadow/glow effect con colores de transporte */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-primary/20 to-emerald-500/15 rounded-2xl blur-xl transform scale-105 opacity-60"></div>

                            {/* Main card */}
                            <div className="relative bg-card/90 backdrop-blur-xl border border-border/60 rounded-2xl p-8 shadow-2xl">
                                {/* Card header con iconografía de transporte */}
                                <div className="text-center mb-8">
                                    {/* Logo con múltiples iconos de transporte */}
                                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 mb-6 shadow-lg">
                                        <Truck className="w-8 h-8 text-primary" />
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500/80 rounded-full flex items-center justify-center">
                                            <Package className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    </div>

                                    {/* Nombre de la empresa */}
                                    <div>
                                        <h1 className="text-lg font-bold text-foreground leading-tight">TRANSPORTES Y DISTRIBUCIONES</h1>
                                        <h2 className="text-xl font-bold text-primary leading-tight">ESMERALDA</h2>
                                    </div>
                                </div>

                                {/* Form content */}
                                <div className="space-y-6">
                                    {children}
                                </div>

                                {/* Card footer con información de transporte */}
                                <div className="mt-8 pt-6 border-t border-border/50">
                                    {/* Indicadores de servicio */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-2">
                                                <Clock className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <p className="text-xs text-muted-foreground">24/7</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-2">
                                                <MapPin className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <p className="text-xs text-muted-foreground">GPS</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-2">
                                                <Shield className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Seguro</p>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">
                                            🚛 Conexión segura SSL • Rastreo en tiempo real
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional info específica de transporte */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-muted-foreground">
                                📍 Cobertura nacional • Soporte: <span className="text-primary font-medium">soporte@esmeralda.pe</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
