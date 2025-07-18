import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import {
    DocumentationCard,
    DailyPaymentsCard,
    RoutesStatusCard,
    ClientRejectionsChart,
    AdminStatsCards
} from '@/components/organisms/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Activity } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    user: any;
    documentationStats?: any;
    dailyPayments?: any;
    todayRoutes?: any;
    clientRejections?: any[];
    mobilityStats?: any;
    clientsStats?: any;
    driversStats?: any;
}

export default function Dashboard() {
    const { props } = usePage<SharedData & DashboardProps>();
    const { auth } = props;
    const {
        documentationStats,
        dailyPayments,
        todayRoutes,
        clientRejections,
        mobilityStats,
        clientsStats,
        driversStats
    } = props;

    // Verificar roles del usuario
    const userRoles = (auth.user as any)?.roles || [];
    const isAdmin = Array.isArray(userRoles) && userRoles.some((role: any) => role.name === 'admin');
    const isConductor = Array.isArray(userRoles) && userRoles.some((role: any) => role.name === 'conductor');

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const getUserRoleText = () => {
        if (isAdmin) return 'Administrador';
        if (isConductor) return 'Conductor';
        return 'Usuario';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-8 px-4">
                {/* Header de Bienvenida */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-6 shadow-lg my-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">
                                {getGreeting()}, {auth.user?.first_name} {auth.user?.last_name}
                            </h1>
                            <p className="text-blue-100 flex items-center">
                                {isAdmin && <Crown className="h-4 w-4 mr-1" />}
                                <Activity className="h-4 w-4 mr-1" />
                                {getUserRoleText()} • {new Date().toLocaleDateString('es-PE', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    timeZone: 'America/Lima'
                                })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-blue-200">Sistema de Transporte</p>
                            <p className="text-lg font-semibold">Esmeralda</p>
                        </div>
                    </div>
                </div>

                {/* Estadísticas Solo para Admin */}
                {isAdmin && mobilityStats && clientsStats && driversStats && (
                    <div className="space-y-6">
                        <div className="flex items-center">
                            <Crown className="h-5 w-5 text-yellow-600 mr-2" />
                            <h2 className="text-lg font-semibold text-gray-900">Panel de Administración</h2>
                        </div>
                        <AdminStatsCards
                            mobilityStats={mobilityStats}
                            clientsStats={clientsStats}
                            driversStats={driversStats}
                        />
                    </div>
                )}

                {/* Estadísticas Generales (Para todos) */}
                <div className="space-y-6">
                    <div className="flex items-center">
                        <Activity className="h-5 w-5 text-blue-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Actividad del Día</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Primera fila: Documentación y Pagos */}
                        {documentationStats && (
                            <DocumentationCard stats={documentationStats} />
                        )}

                        {dailyPayments && (
                            <DailyPaymentsCard stats={dailyPayments} />
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Segunda fila: Estados de Rutas y Rechazos */}
                        {todayRoutes && (
                            <RoutesStatusCard stats={todayRoutes} />
                        )}

                        {clientRejections && (
                            <ClientRejectionsChart data={clientRejections} />
                        )}
                    </div>
                </div>

                {/* Mensaje si no hay datos */}
                {!documentationStats && !dailyPayments && !todayRoutes && !clientRejections && (
                    <Card className="text-center p-8">
                        <CardContent>
                            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Bienvenido al Dashboard
                            </h3>
                            <p className="text-gray-500">
                                Las estadísticas aparecerán aquí conforme haya actividad en el sistema.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Footer con información adicional */}
                <div className="text-center text-sm text-gray-500 border-t pt-4">
                    <p>
                        Dashboard actualizado en tiempo real •
                        Último acceso: {new Date().toLocaleTimeString('es-PE', {
                            timeZone: 'America/Lima'
                        })}
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
