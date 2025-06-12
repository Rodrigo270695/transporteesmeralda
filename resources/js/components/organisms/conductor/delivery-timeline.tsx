import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/atoms/conductor';
import { DeliveryPoint } from '@/types/driver';
import { MapPin, CheckCircle, Clock, Navigation } from 'lucide-react';

interface DeliveryTimelineProps {
    points: DeliveryPoint[];
    onPointClick?: (point: DeliveryPoint) => void;
    className?: string;
}

export const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({
    points = [],
    onPointClick,
    className
}) => {
    const sortedPoints = [...points].sort((a, b) => (a.route_order || 0) - (b.route_order || 0));

    const getIcon = (status: string) => {
        switch (status) {
            case 'entregado':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'en_ruta':
                return <Navigation className="h-4 w-4 text-blue-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Timeline de Entrega
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    {sortedPoints.map((point) => (
                        <div
                            key={point.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                                onPointClick ? 'cursor-pointer hover:bg-gray-50' : ''
                            }`}
                            onClick={() => onPointClick?.(point)}
                        >
                            <div className="flex-shrink-0">
                                {getIcon(point.status)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm font-medium truncate">
                                        #{point.route_order} {point.customer_name || 'Cliente'}
                                    </h3>
                                    <StatusBadge status={point.status} size="sm" />
                                </div>

                                <p className="text-xs text-gray-500 truncate">
                                    {point.address}
                                </p>

                                {point.amount_to_collect && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        S/ {point.amount_to_collect.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default DeliveryTimeline;
