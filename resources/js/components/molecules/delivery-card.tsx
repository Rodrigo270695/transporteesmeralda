import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeliveryCardProps } from '@/types/driver';
import { StatusBadge } from '@/components/atoms/conductor';
import { ProgressBar } from '@/components/atoms/progress-bar';
import { cn } from '@/lib/utils';
import {
    Calendar,
    MapPin,
    Package,
    DollarSign,
    Clock,
    ArrowRight,
    Truck
} from 'lucide-react';

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
    delivery,
    onViewDetails,
    isLoading = false,
    className,
    ...props
}) => {
    const { stats } = delivery;

    // Validación de stats con valores por defecto
    const safeStats = stats || {
        total_points: 0,
        completed_points: 0,
        pending_points: 0,
        in_route_points: 0,
        total_to_collect: 0,
        total_collected: 0,
        progress_percentage: 0
    };
    const deliveryDate = new Date(delivery.delivery_date);
    const isToday = deliveryDate.toDateString() === new Date().toDateString();

    // Validación y valor por defecto para status
    const deliveryStatus = delivery.status || 'programado';

    return (
        <Card className={cn(
            'transition-all duration-300 hover:shadow-lg border-l-4',
            deliveryStatus === 'completado' && 'border-l-green-500 bg-green-50/50',
            deliveryStatus === 'en_proceso' && 'border-l-blue-500 bg-blue-50/50',
            deliveryStatus === 'programado' && 'border-l-yellow-500 bg-yellow-50/50',
            deliveryStatus === 'cancelado' && 'border-l-red-500 bg-red-50/50',
            className
        )} {...props}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Truck className="h-5 w-5 text-primary" />
                            {delivery.name}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {deliveryDate.toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                                {isToday && (
                                    <span className="ml-1 text-blue-600 font-medium">(Hoy)</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <StatusBadge status={deliveryStatus} size="sm" />
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Estadísticas principales */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Package className="h-5 w-5 text-blue-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {safeStats.total_points}
                            </p>
                            <p className="text-xs text-gray-500">Puntos totales</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                S/ {safeStats.total_to_collect.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">Por cobrar</p>
                        </div>
                    </div>
                </div>

                {/* Progreso de entregas */}
                <div className="space-y-2">
                    <ProgressBar
                        current={safeStats.completed_points}
                        total={safeStats.total_points}
                        label="Progreso de entregas"
                        variant={
                            safeStats.progress_percentage === 100 ? 'success' :
                            safeStats.progress_percentage >= 50 ? 'default' : 'warning'
                        }
                        size="md"
                    />
                </div>

                {/* Estado de puntos */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-green-50 rounded">
                        <p className="font-semibold text-green-700">{safeStats.completed_points}</p>
                        <p className="text-green-600">Entregados</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="font-semibold text-blue-700">{safeStats.in_route_points}</p>
                        <p className="text-blue-600">En ruta</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                        <p className="font-semibold text-yellow-700">{safeStats.pending_points}</p>
                        <p className="text-yellow-600">Pendientes</p>
                    </div>
                </div>

                {/* Monto cobrado vs pendiente */}
                {safeStats.total_collected > 0 && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                            <p className="text-sm font-medium text-green-900">
                                S/ {safeStats.total_collected.toFixed(2)} cobrado
                            </p>
                            <p className="text-xs text-green-600">
                                Falta: S/ {(safeStats.total_to_collect - safeStats.total_collected).toFixed(2)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-green-700">
                                {Math.round((safeStats.total_collected / safeStats.total_to_collect) * 100)}%
                            </p>
                            <p className="text-xs text-green-600">del total</p>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter>
                <Button
                    onClick={() => onViewDetails(delivery)}
                    disabled={isLoading}
                    className="w-full"
                    variant="default"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Cargando...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Ver en mapa
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default DeliveryCard;
