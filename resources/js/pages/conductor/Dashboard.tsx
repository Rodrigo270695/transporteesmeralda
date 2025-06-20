import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DeliveryCard } from '@/components/molecules/conductor';
import { DriverDashboardProps, DriverDelivery } from '@/types/driver';
import AppLayout from '@/layouts/app-layout';
import {
    MapPin,
    Package,
    DollarSign,
    CheckCircle,
    Navigation,
    RefreshCw
} from 'lucide-react';
import { MapView } from '@/components/organisms/conductor';
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

    // Calcular estadísticas simples
    const stats = React.useMemo(() => {
        const allDeliveries = deliveries?.data || [];
        return {
            total_deliveries: allDeliveries.length,
            completed_deliveries: allDeliveries.filter(d => d.status === 'completado').length,
            in_progress_deliveries: allDeliveries.filter(d => d.status === 'en_proceso').length,
            total_collected: allDeliveries.reduce((sum, d) => sum + (d.stats?.total_collected || 0), 0),
        };
    }, [deliveries?.data]);

    const handleDeliverySelect = (deliveryId: number) => {
        window.location.href = `/conductor/entrega/${deliveryId}`;
    };

    const handleLocationUpdate = (newLocation: any) => {
        // Manejar actualización de ubicación si es necesario
    };

    return (
        <AppLayout>
            <Head title="Dashboard Conductor" />

            <div className="py-6">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    {/* Header simplificado */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            ¡Hola, {user?.name || 'Conductor'}!
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {(() => {
                                // Crear fecha en zona horaria de Lima
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

                            {/* Estado básico */}
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
                            </div>
                        </div>
                    </div>

                    {/* Resumen rápido de entregas */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-blue-500" />
                                <div className="ml-3">
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {stats?.total_deliveries || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Entregas</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                                <div className="ml-3">
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {stats?.completed_deliveries || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Completadas</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <Navigation className="h-8 w-8 text-orange-500" />
                                <div className="ml-3">
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {stats?.in_progress_deliveries || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">En Ruta</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <DollarSign className="h-8 w-8 text-green-600" />
                                <div className="ml-3">
                                    <p className="text-2xl font-semibold text-gray-900">
                                        S/ {stats?.total_collected?.toFixed(2) || '0.00'}
                                    </p>
                                    <p className="text-sm text-gray-600">Cobrado</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenido principal - Mapa y Entregas */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Mapa - Ocupará toda la altura disponible */}
                        <div className="xl:col-span-2 bg-white shadow rounded-lg p-6" style={{ minHeight: '600px' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Mapa de Rutas
                                </h2>
                                <Button
                                    onClick={() => isTracking ? stopTracking() : startTracking()}
                                    size="sm"
                                    variant={isTracking ? "destructive" : "default"}
                                >
                                    {isTracking ? 'Detener' : 'Iniciar'} GPS
                                </Button>
                            </div>

                            <div style={{ height: '520px' }}>
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
                            </div>
                </div>

                        {/* Entregas del día */}
                        <div className="xl:col-span-1 bg-white shadow rounded-lg">
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

                            <div className="p-6" style={{ maxHeight: '520px', overflowY: 'auto' }}>
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
                                    <div className="text-center py-12">
                                        <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-gray-500 text-lg">No hay entregas asignadas para hoy</p>
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
        </AppLayout>
    );
}
