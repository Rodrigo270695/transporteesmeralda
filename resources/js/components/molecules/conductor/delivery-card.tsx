import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, ProgressBar, StatsCard } from '@/components/atoms/conductor';
import { DriverDelivery } from '@/types/driver';
import {
    MapPin,
    Calendar,
    Package,
    DollarSign,
    Clock,
    ArrowRight,
    Truck
} from 'lucide-react';

interface DeliveryCardProps {
    delivery: DriverDelivery;
    onViewDetails: (delivery: DriverDelivery) => void;
    isLoading?: boolean;
    className?: string;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
    delivery,
    onViewDetails,
    isLoading = false,
    className
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return `S/ ${amount.toFixed(2)}`;
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completado':
                return 'success';
            case 'en_proceso':
                return 'info';
            case 'programado':
                return 'warning';
            case 'cancelado':
                return 'danger';
            default:
                return 'default';
        }
    };

    if (isLoading) {
        return (
            <Card className={cn("animate-pulse", className)}>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-200 rounded w-48"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "transition-all duration-200 hover:shadow-lg border-l-4",
            delivery.status === 'completado' && "border-l-green-500",
            delivery.status === 'en_proceso' && "border-l-blue-500",
            delivery.status === 'programado' && "border-l-yellow-500",
            delivery.status === 'cancelado' && "border-l-red-500",
            className
        )}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Package className="h-5 w-5 text-gray-600" />
                            {delivery.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(delivery.delivery_date)}
                        </p>
                    </div>

                    <StatusBadge
                        status={delivery.status as any}
                        variant={getStatusVariant(delivery.status)}
                    />
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Progreso general */}
                <div className="space-y-2">
                    <ProgressBar
                        current={delivery.stats.completed_points}
                        total={delivery.stats.total_points}
                        label="Progreso de Entrega"
                        showNumbers
                        variant={delivery.stats.progress_percentage >= 100 ? 'success' : 'default'}
                    />
                </div>

                {/* Estadísticas en grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-gray-600" />
                            <span className="text-xs font-medium text-gray-600">Puntos</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                            {delivery.stats.completed_points}/{delivery.stats.total_points}
                        </p>
                        <p className="text-xs text-gray-500">
                            {delivery.stats.pending_points} pendientes
                        </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-gray-600" />
                            <span className="text-xs font-medium text-gray-600">Cobrado</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(delivery.stats.total_collected)}
                        </p>
                        <p className="text-xs text-gray-500">
                            de {formatCurrency(delivery.stats.total_to_collect)}
                        </p>
                    </div>
                </div>

                {/* Información adicional */}
                {delivery.stats.in_route_points > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                                {delivery.stats.in_route_points} puntos en ruta
                            </span>
                        </div>
                    </div>
                )}

                {/* Tiempo estimado (si está disponible) */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Última actualización: Hace 5 min</span>
                    </div>
                    <span className="text-xs">
                        ID: #{delivery.id}
                    </span>
                </div>

                {/* Botón de acción */}
                <Button
                    onClick={() => onViewDetails(delivery)}
                    className="w-full"
                    variant={delivery.status === 'completado' ? 'outline' : 'default'}
                >
                    <span>
                        {delivery.status === 'completado' ? 'Ver Resumen' : 'Iniciar Entrega'}
                    </span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </CardContent>
        </Card>
    );
};

export default DeliveryCard;
