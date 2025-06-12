import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatsCard } from '@/components/atoms/conductor';
import { DeliveryCard } from '@/components/molecules/conductor';
import { DriverDashboardProps, DriverDelivery } from '@/types/driver';
import AppLayout from '@/layouts/app-layout';
import {
    Calendar,
    Truck,
    MapPin,
    Package,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    Filter,
    Search,
    TrendingUp
} from 'lucide-react';
import { DriverStats, MapView } from '@/components/organisms/conductor';
import {
    useAdvancedGeolocation,
    useBackgroundSync
} from '@/hooks';

export default function Dashboard({
    deliveries,
    mobilities,
    filters,
    user,
    message
}: DriverDashboardProps) {

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(filters?.date || new Date().toISOString().split('T')[0]);

    // PWA Hooks
    const {
        location,
        isTracking,
        startTracking,
        stopTracking,
        battery,
        syncStatus
    } = useAdvancedGeolocation({
        autoSync: true,
        batteryOptimization: true
    });

    const {
        isOnline,
        isSyncing,
        pendingItems
    } = useBackgroundSync();

    // Configuración de notificaciones con manejo de errores mejorado
    const [notificationState, setNotificationState] = useState({
        isSupported: false,
        permission: 'default' as NotificationPermission,
        isSubscribed: false,
        error: null as string | null,
        isLoading: false
    });

    // Verificar soporte básico de notificaciones
    useEffect(() => {
        const checkNotificationSupport = () => {
            const basicSupport = 'Notification' in window;
            const serviceWorkerSupport = 'serviceWorker' in navigator;
            const pushSupport = 'PushManager' in window;

            if (!basicSupport) {
                setNotificationState(prev => ({
                    ...prev,
                    error: 'Notificaciones no soportadas en este navegador'
                }));
                return;
            }

            if (!serviceWorkerSupport) {
                setNotificationState(prev => ({
                    ...prev,
                    error: 'Service Workers no soportados'
                }));
                return;
            }

            if (!pushSupport) {
                setNotificationState(prev => ({
                    ...prev,
                    error: 'Push notifications no soportadas'
                }));
                return;
            }

            setNotificationState(prev => ({
                ...prev,
                isSupported: true,
                permission: Notification.permission,
                error: 'Notificaciones disponibles pero requieren configuración del servidor'
            }));
        };

        checkNotificationSupport();
    }, []);

    const handleNotificationRequest = async () => {
        if (!notificationState.isSupported) return;

        setNotificationState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Solo solicitar permisos básicos por ahora
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                setNotificationState(prev => ({
                    ...prev,
                    permission,
                    isLoading: false,
                    error: 'Permisos concedidos. Push notifications requieren configuración adicional del servidor.'
                }));
            } else {
                setNotificationState(prev => ({
                    ...prev,
                    permission,
                    isLoading: false,
                    error: 'Permisos de notificación denegados'
                }));
            }
        } catch (error) {
            setNotificationState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Error solicitando permisos de notificación'
            }));
        }
    };

    // Usar el estado local en lugar del hook
    const notificationsSupported = notificationState.isSupported;
    const notificationPermission = notificationState.permission;
    const notificationSubscribed = notificationState.isSubscribed;
    const notificationError = notificationState.error;
    const notificationLoading = notificationState.isLoading;

    // Calcular estadísticas globales
    const globalStats = React.useMemo(() => {
        const allDeliveries = deliveries?.data || [];

        return {
            totalDeliveries: allDeliveries.length,
            totalPoints: allDeliveries.reduce((sum, d) => sum + (d.stats?.total_points || 0), 0),
            completedPoints: allDeliveries.reduce((sum, d) => sum + (d.stats?.completed_points || 0), 0),
            pendingPoints: allDeliveries.reduce((sum, d) => sum + (d.stats?.pending_points || 0), 0),
            totalToCollect: allDeliveries.reduce((sum, d) => sum + (d.stats?.total_to_collect || 0), 0),
            totalCollected: allDeliveries.reduce((sum, d) => sum + (d.stats?.total_collected || 0), 0),
            completedDeliveries: allDeliveries.filter(d => d.status === 'completado').length,
            inProgressDeliveries: allDeliveries.filter(d => d.status === 'en_proceso').length,
        };
    }, [deliveries?.data]);

    // Filtrar entregas
    const filteredDeliveries = React.useMemo(() => {
        return deliveries?.data?.filter(delivery =>
            delivery.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];
    }, [deliveries?.data, searchTerm]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsRefreshing(false)
        });
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        router.get(route('conductor.dashboard'), { date }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleViewDelivery = (delivery: DriverDelivery) => {
        router.visit(route('conductor.entrega', { delivery: delivery.id }));
    };

    const handleDeliverySelect = (deliveryId: number) => {
        window.location.href = `/conductor/entrega/${deliveryId}`;
    };

    const handleLocationUpdate = (newLocation: any) => {
        // Aquí podrías enviar la ubicación al servidor
        console.log('Nueva ubicación:', newLocation);
    };

    const stats = {
        total: deliveries?.data?.length || 0,
        entregados: deliveries?.data?.filter(d => d.stats?.entregados > 0).length || 0,
        en_ruta: deliveries?.data?.filter(d => d.stats?.en_ruta > 0).length || 0,
        pendientes: deliveries?.data?.filter(d => d.stats?.pendientes > 0).length || 0,
        cancelados: deliveries?.data?.filter(d => d.stats?.cancelados > 0).length || 0,
        monto_total: deliveries?.data?.reduce((sum, d) => sum + (d.stats?.monto_total || 0), 0) || 0,
        monto_cobrado: deliveries?.data?.reduce((sum, d) => sum + (d.stats?.monto_cobrado || 0), 0) || 0,
        progreso: deliveries?.data?.length > 0
            ? Math.round((deliveries.data.filter(d => d.stats?.entregados > 0).length / deliveries.data.length) * 100)
            : 0
    };

    return (
        <AppLayout>
            <Head title="Dashboard Conductor" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            ¡Hola, {user?.name || 'Conductor'}!
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {filters?.date ? new Date(filters.date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) : 'Hoy'}
                        </p>
                    </div>

                    {/* Estadísticas principales */}
                    <div className="mb-8">
                        <DriverStats stats={stats} />
                </div>

                    {/* Contenido principal */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Entregas del día */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            <Package className="h-5 w-5" />
                                            Entregas de Hoy
                                        </h2>
                                        <span className="text-sm text-gray-500">
                                            {deliveries?.data?.length || 0} entregas
                                        </span>
                                    </div>
                </div>

                                <div className="p-6">
                                    {deliveries?.data && deliveries.data.length > 0 ? (
                                        <div className="space-y-4">
                                            {deliveries.data.map((delivery) => (
                                                <DeliveryCard
                                                    key={delivery.id}
                                                    delivery={delivery}
                                                    onViewDetails={() => handleDeliverySelect(delivery.id)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-500">No hay entregas asignadas para hoy</p>
                            </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Mapa */}
                            <MapView
                                points={deliveries?.data?.flatMap(d => d.points || []) || []}
                                currentLocation={location || undefined}
                                onPointClick={(point) => {
                                    const delivery = deliveries?.data?.find(d =>
                                        d.points?.some(p => p.id === point.id)
                                    );
                                    if (delivery) {
                                        handleDeliverySelect(delivery.id);
                                    }
                                }}
                                onLocationUpdate={handleLocationUpdate}
                            />

                            {/* PWA Status */}
                            <div className="bg-white shadow rounded-lg p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <RefreshCw className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
                                    Estado de Conexión
                                </h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Estado:</span>
                                        <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                                            {isOnline ? 'En línea' : 'Sin conexión'}
                                        </span>
                                    </div>

                                    {isSyncing && (
                                        <div className="flex justify-between">
                                            <span>Sincronizando:</span>
                                            <span className="text-blue-600 font-medium">Activo</span>
                                        </div>
                                    )}

                                    {pendingItems > 0 && (
                                        <div className="flex justify-between">
                                            <span>Pendientes:</span>
                                            <span className="text-orange-600 font-medium">{pendingItems}</span>
                                        </div>
                                    )}

                                    {battery && (
                                        <div className="flex justify-between">
                                            <span>Batería:</span>
                                            <span className={`font-medium ${
                                                battery.level > 0.5 ? 'text-green-600' :
                                                battery.level > 0.2 ? 'text-orange-600' : 'text-red-600'
                                            }`}>
                                                {Math.round(battery.level * 100)}%
                                            </span>
                                        </div>
                                    )}

                                    {notificationsSupported && (
                                        <div className="flex justify-between">
                                            <span>Notificaciones:</span>
                                            <span className={`font-medium ${
                                                notificationSubscribed ? 'text-green-600' : 'text-gray-600'
                                            }`}>
                                                {notificationSubscribed ? 'Activas' : 'Inactivas'}
                                            </span>
                        </div>
                    )}
                </div>

                                <div className="mt-4 space-y-2">
                                    {notificationError && (
                                        <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                                            <div className="font-medium mb-1">ℹ️ Estado de Notificaciones</div>
                                            <div>{notificationError}</div>
                                        </div>
                                    )}

                                    {notificationsSupported && notificationPermission !== 'granted' && (
                                        <Button
                                            onClick={handleNotificationRequest}
                                            size="sm"
                                            className="w-full"
                                            disabled={notificationLoading}
                                        >
                                            {notificationLoading ? 'Solicitando...' : 'Solicitar Permisos'}
                                        </Button>
                                    )}

                                    {notificationPermission === 'granted' && (
                                        <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                                            ✅ Permisos de notificación concedidos
                                        </div>
                                    )}

                                    {!notificationsSupported && (
                                        <div className="text-xs text-gray-500 text-center">
                                            Notificaciones no disponibles en este navegador
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Estado de ubicación */}
                            <div className="bg-white shadow rounded-lg p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Ubicación GPS
                                </h3>

                                {location ? (
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estado:</span>
                                            <span className={`font-medium ${isTracking ? 'text-green-600' : 'text-gray-600'}`}>
                                                {isTracking ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Precisión:</span>
                                            <span className="font-medium">
                                                {location.accuracy ? `±${Math.round(location.accuracy)}m` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Última actualización:</span>
                                            <span className="font-medium">
                                                {location.timestamp.toLocaleTimeString('es-ES', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Ubicación no disponible
                                    </p>
                                )}

                                <button
                                    onClick={isTracking ? stopTracking : startTracking}
                                    className={`w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isTracking
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                >
                                    {isTracking ? 'Detener Seguimiento' : 'Iniciar Seguimiento'}
                                </button>
                            </div>

                            {/* Vehículos disponibles */}
                            {mobilities && mobilities.length > 0 && (
                                <div className="bg-white shadow rounded-lg p-4">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Vehículos
                                    </h3>
                                    <div className="space-y-2">
                                        {mobilities.map((mobility) => (
                                            <div key={mobility.id} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">{mobility.plate}</span>
                                                <span className="font-medium">{mobility.brand} {mobility.model}</span>
                                            </div>
                            ))}
                        </div>
                    </div>
                )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
