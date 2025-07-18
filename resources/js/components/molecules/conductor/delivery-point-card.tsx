import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DriverDeliveryPoint } from '@/types/driver';
import {
    Navigation,
    CheckCircle,
    Phone,
    MapPin,
    Clock,
    DollarSign,
    MessageCircle,
    MoreVertical,
    XCircle,
    RotateCcw
} from 'lucide-react';

interface DeliveryPointCardProps {
    point: DriverDeliveryPoint;
    priority: 'high' | 'normal' | 'completed';
    onAction: (action: string, point: DriverDeliveryPoint) => void;
}

const DeliveryPointCard: React.FC<DeliveryPointCardProps> = ({
    point,
    priority,
    onAction
}) => {
    const getBorderColor = () => {
        switch (priority) {
            case 'high': return 'border-l-orange-500 bg-orange-50';
            case 'completed': return 'border-l-green-500 bg-green-50';
            default: return 'border-l-blue-500 bg-blue-50';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'entregado': return 'bg-green-100 text-green-800';
            case 'en_ruta': return 'bg-blue-100 text-blue-800';
            case 'cancelado': return 'bg-red-100 text-red-800';
            case 'reagendado': return 'bg-purple-100 text-purple-800';
            case 'pendiente':
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '';
        return new Date(timeString).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCall = () => {
        if (point.client.phone) {
            window.open(`tel:${point.client.phone}`, '_self');
        }
    };

    const handleWhatsApp = () => {
        if (point.client.phone) {
            // Limpiar el número (quitar espacios, guiones, etc.)
            const cleanPhone = point.client.phone.replace(/\D/g, '');

            // Mensaje predefinido para el conductor
            const message = encodeURIComponent(
                `Hola ${point.client.name}, soy tu conductor de Transporte Esmeralda. Me dirijo a tu dirección: ${point.address}. ¿Hay alguna referencia adicional que deba conocer?`
            );

            // Abrir WhatsApp
            window.open(`https://wa.me/51${cleanPhone}?text=${message}`, '_blank');
        }
    };

    return (
        <Card className={`border-l-4 ${getBorderColor()} cursor-pointer transition-all hover:shadow-md overflow-hidden`}>
            <CardContent className="p-3 w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {point.route_order}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm truncate">{point.client.name}</h4>
                            <p className="text-xs text-gray-600 truncate leading-tight" title={point.address}>
                                {point.address}
                            </p>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-bold text-green-600 text-sm">
                            S/ {point.amount_to_collect.toFixed(2)}
                        </div>
                        <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(point.status)}`}
                        >
                            {point.status_label}
                        </Badge>
                    </div>
                </div>

                {/* Información adicional para puntos activos */}
                {priority === 'high' && (
                    <div className="mb-2 p-2 bg-orange-100 rounded text-xs space-y-1">
                        {point.estimated_delivery_time && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">ETA: {point.estimated_delivery_time}</span>
                            </div>
                        )}
                        {point.delivery_instructions && (
                            <div className="text-gray-700">
                                <span className="font-medium">Instrucciones:</span>
                                <p className="break-words text-xs mt-1">{point.delivery_instructions}</p>
                            </div>
                        )}
                        {point.reference && (
                            <div className="text-gray-700">
                                <span className="font-medium">Referencia:</span>
                                <p className="break-words text-xs mt-1">{point.reference}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions según estado */}
                <div className="flex gap-2 mt-2">
                    {point.status === 'pendiente' && (
                        <>
                            <Button
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => onAction('start', point)}
                            >
                                <Navigation className="h-3 w-3 mr-1" />
                                Iniciar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handleCall}
                                disabled={!point.client.phone}
                                title="Llamar al cliente"
                            >
                                <Phone className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-500 hover:text-green-600"
                                onClick={handleWhatsApp}
                                disabled={!point.client.phone}
                                title="Contactar por WhatsApp"
                            >
                                <MessageCircle className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onAction('navigate', point)}
                            >
                                <MapPin className="h-3 w-3" />
                            </Button>
                            {/* Menú para cambiar estado */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        title="Cambiar estado"
                                    >
                                        <MoreVertical className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                        onClick={() => onAction('cancel', point)}
                                        className="text-red-600 cursor-pointer"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancelar entrega
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onAction('reschedule', point)}
                                        className="text-purple-600 cursor-pointer"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Reagendar entrega
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}

                    {point.status === 'en_ruta' && (
                        <>
                            <Button
                                size="sm"
                                className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                                onClick={() => onAction('complete', point)}
                            >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handleCall}
                                disabled={!point.client.phone}
                                title="Llamar al cliente"
                            >
                                <Phone className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-500 hover:text-green-600"
                                onClick={handleWhatsApp}
                                disabled={!point.client.phone}
                                title="Contactar por WhatsApp"
                            >
                                <MessageCircle className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onAction('navigate', point)}
                            >
                                <MapPin className="h-3 w-3" />
                            </Button>
                            {/* Menú para cambiar estado */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        title="Cambiar estado"
                                    >
                                        <MoreVertical className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                        onClick={() => onAction('cancel', point)}
                                        className="text-red-600 cursor-pointer"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancelar entrega
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onAction('reschedule', point)}
                                        className="text-purple-600 cursor-pointer"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Reagendar entrega
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}

                    {point.status === 'entregado' && (
                        <div className="flex-1 text-center">
                            <div className="text-xs space-y-1">
                                <div className="flex items-center justify-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Completado</span>
                                </div>
                                {point.delivered_at && (
                                    <div className="text-gray-600">
                                        {formatTime(point.delivered_at)}
                                    </div>
                                )}
                                {point.amount_collected && (
                                    <div className="flex items-center justify-center gap-1 text-green-700 font-medium">
                                        <DollarSign className="h-3 w-3" />
                                        <span>S/ {point.amount_collected.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {point.status === 'cancelado' && (
                        <div className="flex-1 text-center">
                            <span className="text-xs text-red-600">
                                ❌ Cancelado
                            </span>
                            {point.cancellation_reason && (
                                <div className="text-xs text-gray-600 mt-1">
                                    {point.cancellation_reason}
                                </div>
                            )}
                        </div>
                    )}

                    {point.status === 'reagendado' && (
                        <div className="flex-1 text-center">
                            <span className="text-xs text-purple-600">
                                🔄 Reagendado
                            </span>
                        </div>
                    )}
                </div>

                {/* Info del vendedor y entrega para contexto */}
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    <div className="flex justify-between items-start gap-2">
                        <span className="truncate flex-1" title={`Vendedor: ${point.seller?.name || 'No asignado'}`}>
                            Vendedor: {point.seller?.name || 'No asignado'}
                        </span>
                        <span className="text-right flex-shrink-0 font-mono">
                            #{point.delivery.name}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DeliveryPointCard;
