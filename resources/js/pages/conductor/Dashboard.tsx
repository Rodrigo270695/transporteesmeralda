import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DeliveryPointCard } from '@/components/molecules/conductor';
import { DriverDashboardProps, DriverDeliveryPoint } from '@/types/driver';
import AppLayout from '@/layouts/app-layout';
import PointFormModal from '@/components/organisms/point-form-modal';
import {
    MapPin,
    Package,
    DollarSign,
    CheckCircle,
    Navigation,
    RefreshCw,
    Phone,
    ChevronDown
} from 'lucide-react';
import { MapView, StatusChangeModal } from '@/components/organisms/conductor';
import {
    useAdvancedGeolocation,
    useBackgroundSync
} from '@/hooks';
import { useGlobalToast } from '@/hooks/use-global-toast';
import { useDriver } from '@/hooks/useDriver';

export default function Dashboard({
    deliveryPoints,
    stats,
    paymentMethods,
    filters,
    user,
    message
}: DriverDashboardProps) {

    // Estados
    const [selectedPoint, setSelectedPoint] = useState<DriverDeliveryPoint | null>(null);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'cancelado' | 'reagendado' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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

    const { success, error } = useGlobalToast();

    // Hook del conductor para funcionalidades específicas
    const driverHook = useDriver({
        onSuccess: (message) => success(message),
        onError: (error) => console.error('Error:', error),
    });

    // Agrupar puntos por estado
    const groupedPoints = useMemo(() => ({
        en_ruta: deliveryPoints.filter(p => p.status === 'en_ruta'),
        pendiente: deliveryPoints.filter(p => p.status === 'pendiente'),
        entregado: deliveryPoints.filter(p => p.status === 'entregado'),
        cancelado: deliveryPoints.filter(p => p.status === 'cancelado'),
        reagendado: deliveryPoints.filter(p => p.status === 'reagendado'),
    }), [deliveryPoints]);

    // Encontrar próximo punto sugerido
    const nextPoint = useMemo(() => {
        return groupedPoints.en_ruta[0] || groupedPoints.pendiente[0] || null;
    }, [groupedPoints]);

    const handlePointAction = async (action: string, point: DriverDeliveryPoint) => {
        setIsLoading(true);

        try {
            switch (action) {
                case 'start':
                    router.post(route('conductor.punto.iniciar', point.id), {}, {
                        preserveScroll: true,
                        preserveState: true,
                        only: ['deliveryPoints', 'stats'],
                        onSuccess: () => {
                            success('¡Punto iniciado!', 'Has marcado el punto como en ruta.');
                        },
                        onError: (errors) => {
                            console.error('Errores:', errors);
                            const errorMessage = Object.values(errors)[0] as string || 'No se pudo iniciar el punto.';
                            error('Error', errorMessage);
                        },
                        onFinish: () => {
                            setIsLoading(false);
                        }
                    });
                    return; // Salir temprano para evitar setIsLoading(false) al final

                case 'complete':
                    setSelectedPoint(point);
                    setShowCompletionModal(true);
                    break;

                case 'cancel':
                    setSelectedPoint(point);
                    setSelectedStatus('cancelado');
                    setShowStatusChangeModal(true);
                    break;

                case 'reschedule':
                    setSelectedPoint(point);
                    setSelectedStatus('reagendado');
                    setShowStatusChangeModal(true);
                    break;

                case 'call':
                    if (point.client.phone) {
                        window.open(`tel:${point.client.phone}`);
                    } else {
                        error('Sin teléfono', 'Este cliente no tiene número de teléfono registrado.');
                    }
                    break;

                case 'navigate':
                    const coords = `${point.coordinates.latitude},${point.coordinates.longitude}`;
                    window.open(`https://maps.google.com/maps?q=${coords}&navigate=yes`);
                    break;
            }
        } catch (err) {
            console.error('Error en acción:', err);
            error('Error', 'Ocurrió un error inesperado. Inténtalo nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteSubmit = async (data: any) => {
        if (!selectedPoint) return;

        setIsLoading(true);

        router.post(route('conductor.punto.completar', selectedPoint.id), data, {
            preserveScroll: true,
            preserveState: true,
            only: ['deliveryPoints', 'stats'],
            onSuccess: () => {
                setShowCompletionModal(false);
                setSelectedPoint(null);
                success('¡Punto completado!', 'El punto se ha marcado como entregado exitosamente.');
            },
            onError: (errors) => {
                console.error('Errores:', errors);
                const errorMessage = Object.values(errors)[0] as string || 'No se pudo completar el punto.';
                error('Error', errorMessage);
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    const handleStatusChangeSubmit = async (data: { status: string; observations: string; rescheduled_date?: string }) => {
        if (!selectedPoint) return;

        setIsLoading(true);

        router.post(route('conductor.punto.cambiar-estado', selectedPoint.id), data, {
            preserveScroll: true,
            preserveState: true,
            only: ['deliveryPoints', 'stats'],
            onSuccess: () => {
                setShowStatusChangeModal(false);
                setSelectedPoint(null);
                setSelectedStatus(null);
                const statusLabel = data.status === 'cancelado' ? 'cancelado' : 'reagendado';
                success(`¡Punto ${statusLabel}!`, `El punto se ha marcado como ${statusLabel} exitosamente.`);
            },
            onError: (errors) => {
                console.error('Errores:', errors);
                const errorMessage = Object.values(errors)[0] as string || 'No se pudo cambiar el estado del punto.';
                error('Error', errorMessage);
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Dashboard Conductor" />

            <div className="py-6">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    ¡Hola, {user?.name || 'Conductor'}!
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {(() => {
                                        const date = filters?.date ? new Date(filters.date + 'T12:00:00') : new Date();
                                        return date.toLocaleDateString('es-PE', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            timeZone: 'America/Lima'
                                        });
                                    })()}
                                </p>
                            </div>

                            {/* Estado del sistema */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-sm text-gray-600">
                                        {isOnline ? 'En línea' : 'Sin conexión'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className={`h-4 w-4 ${isTracking ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span className="text-sm text-gray-600">
                                        GPS {isTracking ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                                {isSyncing && (
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                                        <span className="text-sm text-blue-600">
                                            Sincronizando...
                                        </span>
                                    </div>
                                )}
                                {pendingItems > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                                        <span className="text-sm text-orange-600">
                                            {pendingItems} pendiente{pendingItems > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}
                                <Button
                                    onClick={() => router.reload()}
                                    variant="outline"
                                    size="sm"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <Package className="h-8 w-8 text-blue-500" />
                                    <div className="ml-3">
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {stats?.total_points || 0}
                                        </p>
                                        <p className="text-sm text-gray-600">Total Puntos</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                    <div className="ml-3">
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {stats?.completed_points || 0}
                                        </p>
                                        <p className="text-sm text-gray-600">Completados</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <Navigation className="h-8 w-8 text-orange-500" />
                                    <div className="ml-3">
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {stats?.in_route_points || 0}
                                        </p>
                                        <p className="text-sm text-gray-600">En Ruta</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <DollarSign className="h-8 w-8 text-green-600" />
                                    <div className="ml-3">
                                        <p className="text-2xl font-semibold text-gray-900">
                                            S/ {stats?.total_collected?.toFixed(2) || '0.00'}
                                        </p>
                                        <p className="text-sm text-gray-600">Cobrado</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contenido principal */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Mapa */}
                        <div className="xl:col-span-2 bg-white shadow rounded-lg p-6" style={{ minHeight: '600px' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Mapa de Rutas
                                </h2>
                                <Button
                                    onClick={async () => {
                                        if (isTracking) {
                                            stopTracking();
                                            success('GPS detenido', 'El seguimiento GPS ha sido detenido correctamente.');
                                        } else {
                                            try {
                                                await startTracking();
                                                success('GPS iniciado', 'El seguimiento GPS ha sido iniciado correctamente.');
                                            } catch (gpsError) {
                                                console.error('Error GPS:', gpsError);
                                                error('Permisos de GPS',
                                                    'Para usar el GPS, haz clic en el ícono de ubicación 📍 en la barra del navegador y selecciona "Permitir". Si el problema persiste, verifica que el GPS esté activado en tu dispositivo.'
                                                );
                                            }
                                        }
                                    }}
                                    size="sm"
                                    variant={isTracking ? "destructive" : "default"}
                                    disabled={!location && isTracking}
                                >
                                    {isTracking ? 'Detener' : 'Iniciar'} GPS
                                </Button>
                            </div>

                            <div style={{ height: '520px' }}>
                                <MapView
                                    points={deliveryPoints}
                                    currentLocation={location || undefined}
                                    onPointClick={(point) => {
                                        setSelectedPoint(point as DriverDeliveryPoint);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Lista de Puntos */}
                        <div className="xl:col-span-1 bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Puntos de Hoy
                                    </h2>
                                    <span className="text-sm text-gray-500">
                                        {deliveryPoints.length} puntos
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 space-y-4" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                                {/* Próximo punto destacado */}
                                {nextPoint && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-1">
                                            <Navigation className="h-4 w-4" />
                                            Próximo Punto
                                        </h3>
                                        <DeliveryPointCard
                                            point={nextPoint}
                                            priority="high"
                                            onAction={handlePointAction}
                                        />
                                    </div>
                                )}

                                {/* Puntos En Ruta */}
                                {groupedPoints.en_ruta.length > 0 && nextPoint?.status !== 'en_ruta' && (
                                    <div>
                                        <h3 className="text-sm font-medium text-orange-600 mb-2">
                                            🚛 En Ruta ({groupedPoints.en_ruta.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {groupedPoints.en_ruta.map(point => (
                                                <DeliveryPointCard
                                                    key={point.id}
                                                    point={point}
                                                    priority="high"
                                                    onAction={handlePointAction}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Puntos Pendientes */}
                                {groupedPoints.pendiente.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-600 mb-2">
                                            📋 Pendientes ({groupedPoints.pendiente.filter(p => p.id !== nextPoint?.id).length})
                                        </h3>
                                        <div className="space-y-2">
                                            {groupedPoints.pendiente
                                                .filter(p => p.id !== nextPoint?.id)
                                                .map(point => (
                                                    <DeliveryPointCard
                                                        key={point.id}
                                                        point={point}
                                                        priority="normal"
                                                        onAction={handlePointAction}
                                                    />
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                                {/* Puntos Completados - Colapsado */}
                                {groupedPoints.entregado.length > 0 && (
                                    <Collapsible>
                                        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-green-600 w-full text-left">
                                            <ChevronDown className="h-4 w-4" />
                                            ✅ Completados ({groupedPoints.entregado.length})
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="space-y-2 mt-2">
                                            {groupedPoints.entregado.map(point => (
                                                <DeliveryPointCard
                                                    key={point.id}
                                                    point={point}
                                                    priority="completed"
                                                    onAction={handlePointAction}
                                                />
                                            ))}
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {/* Estado vacío */}
                                {deliveryPoints.length === 0 && (
                                    <div className="text-center py-12">
                                        <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-gray-500 text-lg">No hay puntos asignados para hoy</p>
                                        <p className="text-gray-400 text-sm mt-2">
                                            Contacta con tu supervisor para nuevas asignaciones
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de completar punto */}
            <PointFormModal
                point={selectedPoint}
                paymentMethods={paymentMethods || []}
                isOpen={showCompletionModal}
                onClose={() => {
                    setShowCompletionModal(false);
                    setSelectedPoint(null);
                }}
                onSubmit={handleCompleteSubmit}
                isLoading={isLoading}
                captureImage={driverHook.captureImage}
            />

            {/* Modal de cambio de estado */}
            <StatusChangeModal
                point={selectedPoint}
                isOpen={showStatusChangeModal}
                selectedStatus={selectedStatus}
                onClose={() => {
                    setShowStatusChangeModal(false);
                    setSelectedPoint(null);
                    setSelectedStatus(null);
                }}
                onSubmit={handleStatusChangeSubmit}
                isLoading={isLoading}
            />
        </AppLayout>
    );
}
