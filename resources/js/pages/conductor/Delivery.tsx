import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge, ProgressBar, StatsCard } from '@/components/atoms/conductor';
import { DriverDeliveryProps, DeliveryPoint } from '@/types/driver';
import { useDriver } from '@/hooks/useDriver';
import AppLayout from '@/layouts/app-layout';
import PointFormModal from '@/components/organisms/point-form-modal';
import {
    MapPin,
    Navigation,
    ArrowLeft,
    Phone,
    User,
    Package,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Route,
    Camera,
    CreditCard
} from 'lucide-react';

// Función auxiliar para formatear montos de manera segura
const formatAmount = (amount: any): string => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
};

export default function Delivery({
    delivery,
    points,
    stats,
    payment_methods,
    user
}: DriverDeliveryProps) {
    const [selectedPoint, setSelectedPoint] = useState<DeliveryPoint | null>(null);
    const [showPointForm, setShowPointForm] = useState(false);
    const [activePointId, setActivePointId] = useState<number | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const driverHook = useDriver({
        enableLocationTracking: true,
        onSuccess: (msg) => {
            setMessage({ type: 'success', text: msg });
            setTimeout(() => setMessage(null), 5000);
        },
        onError: (error) => {
            setMessage({ type: 'error', text: error });
            setTimeout(() => setMessage(null), 5000);
        }
    });

        const groupedPoints = useMemo(() => {
        // Verificar que points es un array
        const safePoints = Array.isArray(points) ? points : [];

        return {
            pendiente: safePoints.filter(p => p.status === 'pendiente'),
            en_ruta: safePoints.filter(p => p.status === 'en_ruta'),
            entregado: safePoints.filter(p => p.status === 'entregado')
        };
    }, [points]);

    const handleBackToDashboard = () => {
        router.visit(route('conductor.dashboard'));
    };

    const handlePointClick = (point: DeliveryPoint) => {
        setSelectedPoint(point);
        setActivePointId(point.id);
    };

    const handleStartRoute = async (point: DeliveryPoint) => {
        setActivePointId(point.id);
        await driverHook.markAsInRoute(point.id);
    };

    const handleCompletePoint = (point: DeliveryPoint) => {
        if (point.status !== 'en_ruta') return;

        setSelectedPoint(point);
        setShowPointForm(true);
    };

    const handleFormSubmit = async (data: any) => {
        if (!selectedPoint) return;

        try {
            await driverHook.completeDelivery(
                selectedPoint.id,
                data.payment_method_id,
                data.amount_collected,
                {
                    paymentImage: data.payment_image,
                    deliveryImage: data.delivery_image,
                    paymentReference: data.payment_reference,
                    paymentNotes: data.payment_notes,
                    observation: data.observation,
                    customerRating: data.customer_rating
                }
            );

            setShowPointForm(false);
            setSelectedPoint(null);
        } catch (error) {
            console.error('Error al completar entrega:', error);
        }
    };

    const getPointStatusColor = (status: string) => {
        switch (status) {
            case 'pendiente': return 'bg-yellow-100 border-yellow-300';
            case 'en_ruta': return 'bg-blue-100 border-blue-300';
            case 'entregado': return 'bg-green-100 border-green-300';
            case 'cancelado': return 'bg-red-100 border-red-300';
            case 'reagendado': return 'bg-orange-100 border-orange-300';
            default: return 'bg-gray-100 border-gray-300';
        }
    };

    const renderPointCard = (point: DeliveryPoint) => (
        <Card
            key={point.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                activePointId === point.id ? 'ring-2 ring-blue-400' : ''
            } ${getPointStatusColor(point.status)}`}
            onClick={() => handlePointClick(point)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {point.route_order}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {point.client?.name || 'Cliente'}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {point.seller?.name || 'Sin vendedor'}
                            </p>
                        </div>
                    </div>
                                                            <StatusBadge status={point.status} size="sm" />
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Información del cliente */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                            {point.address || 'Dirección no especificada'}
                        </span>
                    </div>

                    {point.client?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <a
                                href={`tel:${point.client.phone}`}
                                className="text-blue-600 hover:text-blue-800"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {point.client.phone}
                            </a>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Información del pedido */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span>{point.quantity} productos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>S/ {formatAmount(point.amount_to_collect)}</span>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-2">
                    {point.status === 'pendiente' && (
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStartRoute(point);
                            }}
                            disabled={driverHook.isLoading && activePointId === point.id}
                            className="flex-1"
                            size="sm"
                        >
                            <Navigation className="h-4 w-4 mr-2" />
                            Iniciar Ruta
                        </Button>
                    )}

                    {point.status === 'en_ruta' && (
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCompletePoint(point);
                            }}
                            className="flex-1"
                            size="sm"
                            variant="default"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completar
                        </Button>
                    )}

                    {point.status === 'entregado' && (
                        <div className="flex-1 text-center">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                ✓ Completado
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Información adicional para puntos completados */}
                {point.status === 'entregado' && (
                    <div className="pt-2 border-t bg-green-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                        <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                            <div>Cobrado: S/ {formatAmount(point.amount_collected)}</div>
                            <div>Método: {point.payment_method?.name}</div>
                        </div>
                        {point.delivered_at && (
                            <div className="text-xs text-green-600 mt-1">
                                Entregado: {new Date(point.delivered_at).toLocaleString('es-ES')}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <AppLayout>
            <Head title={`Entrega: ${delivery?.name || 'Entrega'}`} />

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleBackToDashboard}
                        variant="outline"
                        size="sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>

                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {delivery?.name || 'Entrega'}
                        </h1>
                        <p className="text-gray-600">
                            {delivery?.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) : 'Fecha no disponible'}
                        </p>
                    </div>

                    <Button
                        onClick={() => router.reload({ preserveScroll: true })}
                        variant="outline"
                        size="sm"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                {/* Mensaje de estado */}
                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                {/* Estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Puntos"
                        value={stats?.total || 0}
                        icon={Package}
                        variant="info"
                    />

                    <StatsCard
                        title="Entregados"
                        value={stats?.entregados || 0}
                        subtitle={stats?.total ? `${Math.round(((stats?.entregados || 0) / stats.total) * 100)}%` : '0%'}
                        icon={CheckCircle}
                        variant="success"
                    />

                    <StatsCard
                        title="En Ruta"
                        value={stats?.en_ruta || 0}
                        icon={Navigation}
                        variant="default"
                    />

                    <StatsCard
                        title="Monto Cobrado"
                        value={`S/ ${formatAmount(stats?.monto_cobrado || 0)}`}
                        subtitle={`de S/ ${formatAmount(stats?.monto_total || 0)}`}
                        icon={DollarSign}
                        variant="success"
                    />
                </div>

                {/* Progreso general */}
                <Card>
                    <CardHeader>
                        <CardTitle>Progreso de Entrega</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProgressBar
                            current={stats?.entregados || 0}
                            total={stats?.total || 0}
                            label="Puntos completados"
                            variant={(stats?.progreso || 0) === 100 ? 'success' : 'default'}
                        />
                    </CardContent>
                </Card>

                {/* Lista de puntos por estado */}
                <div className="space-y-6">
                    {/* En Ruta */}
                    {groupedPoints.en_ruta.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-700">
                                    <Navigation className="h-5 w-5" />
                                    En Ruta ({groupedPoints.en_ruta.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {groupedPoints.en_ruta.map(renderPointCard)}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pendientes */}
                    {groupedPoints.pendiente.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-700">
                                    <Clock className="h-5 w-5" />
                                    Pendientes ({groupedPoints.pendiente.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {groupedPoints.pendiente.map(renderPointCard)}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Entregados */}
                    {groupedPoints.entregado.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="h-5 w-5" />
                                    Entregados ({groupedPoints.entregado.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {groupedPoints.entregado.map(renderPointCard)}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Modal de formulario */}
            <PointFormModal
                point={selectedPoint}
                paymentMethods={payment_methods || []}
                isOpen={showPointForm}
                onClose={() => {
                    setShowPointForm(false);
                    setSelectedPoint(null);
                }}
                onSubmit={handleFormSubmit}
                isLoading={driverHook.isLoading}
                captureImage={driverHook.captureImage}
            />
        </AppLayout>
    );
}
