import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    MapPin,
    User,
    DollarSign,
    Truck,
    Clock,
    Star,
    Image as ImageIcon,
    FileText,
    Calendar,
    Phone,
    CreditCard
} from 'lucide-react';
import { type DeliveryPoint } from '@/types/delivery-points';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    point: DeliveryPoint | null;
}

export default function ViewDeliveryPointModal({ isOpen, onClose, point }: Props) {
    if (!point) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'No registrado';
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

                    const formatTime = (timeString?: string) => {
        if (!timeString) return 'No asignada';

        try {
            // Si es un timestamp completo (ISO), extraer solo la hora
            if (timeString.includes('T') && (timeString.includes('Z') || timeString.includes('+'))) {
                const date = new Date(timeString);
                const hours = date.getHours();
                const minutes = date.getMinutes();

                // Convertir a formato 12h
                let result;
                if (hours === 0) {
                    result = `12:${minutes.toString().padStart(2, '0')} AM`;
                } else if (hours < 12) {
                    result = `${hours}:${minutes.toString().padStart(2, '0')} AM`;
                } else if (hours === 12) {
                    result = `12:${minutes.toString().padStart(2, '0')} PM`;
                } else {
                    result = `${hours - 12}:${minutes.toString().padStart(2, '0')} PM`;
                }

                return result;
            }

            // Si viene en formato HH:MM:SS o HH:MM, convertir a formato 12h
            if (timeString.includes(':')) {
                const parts = timeString.split(':');

                if (parts.length >= 2) {
                    let hours = parseInt(parts[0]);
                    const minutes = parts[1];

                    // Asegurar que hours sea un número válido entre 0-23
                    if (isNaN(hours) || hours < 0 || hours > 23) {
                        return 'No asignada';
                    }

                    let result;
                    if (hours === 0) {
                        result = `12:${minutes} AM`;
                    } else if (hours < 12) {
                        result = `${hours}:${minutes} AM`;
                    } else if (hours === 12) {
                        result = `12:${minutes} PM`;
                    } else {
                        result = `${hours - 12}:${minutes} PM`;
                    }

                    return result;
                }
            }
        } catch (error) {
            return 'No asignada';
        }

        return timeString;
    };

    return (
        <div className="view-delivery-point-modal">
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
            >
                <DialogContent
                    className="w-[95vw] max-w-[1400px] sm:max-w-[1400px] max-h-[90vh] overflow-y-auto z-[9999]"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={onClose}
                >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Detalles del Punto de Entrega
                    </DialogTitle>
                    <DialogDescription>
                        Información completa del punto: {point.point_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información Principal */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="h-4 w-4" />
                                <h3 className="font-semibold">Información del Punto</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Nombre del Punto</label>
                                    <p className="text-sm mt-1">{point.point_name}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Orden de Ruta</label>
                                    <p className="text-sm mt-1">#{point.route_order}</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-600">Dirección Completa</label>
                                    <p className="text-sm mt-1">{point.address}</p>
                                </div>

                                {point.reference && (
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-600">Punto de Referencia</label>
                                        <p className="text-sm mt-1">{point.reference}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Coordenadas</label>
                                    <p className="text-sm mt-1">
                                        Lat: {point.coordinates?.latitude}, Lng: {point.coordinates?.longitude}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Estado</label>
                                    <div className="mt-1">
                                        <Badge className={point.status_color}>
                                            {point.status_label}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personas Involucradas */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4" />
                                <h3 className="font-semibold">Personas Involucradas</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Cliente</label>
                                    <p className="text-sm mt-1">{point.client.name}</p>
                                    {point.client.phone && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <Phone className="h-3 w-3" />
                                            {point.client.phone}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Vendedor</label>
                                    <p className="text-sm mt-1">{point.seller?.name || 'No asignado'}</p>
                                    {point.seller?.phone && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <Phone className="h-3 w-3" />
                                            {point.seller.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información Comercial */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="h-4 w-4" />
                                <h3 className="font-semibold">Información Comercial</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Monto a Cobrar</label>
                                    <p className="text-lg font-bold text-green-600 mt-1">
                                        {point.amount_to_collect.formatted}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Monto Cobrado</label>
                                    <p className={`text-lg font-bold mt-1 ${
                                        point.amount_collected?.amount ? 'text-green-600' : 'text-gray-400'
                                    }`}>
                                        {point.amount_collected?.formatted || 'Pendiente'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Prioridad</label>
                                    <div className="mt-1">
                                        <Badge
                                            variant={
                                                point.priority === 'alta' ? 'destructive' :
                                                point.priority === 'media' ? 'default' : 'secondary'
                                            }
                                        >
                                            {point.priority_label}
                                        </Badge>
                                    </div>
                                </div>

                                {point.payment_method && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Método de Pago</label>
                                        <p className="text-sm mt-1 flex items-center gap-1">
                                            <CreditCard className="h-3 w-3" />
                                            {point.payment_method.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logística */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Truck className="h-4 w-4" />
                                <h3 className="font-semibold">Logística</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Vehículo</label>
                                    <p className="text-sm mt-1">
                                        {point.mobility?.plate_number} - {point.mobility?.brand}
                                    </p>
                                    {point.mobility?.driver_name && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Conductor: {point.mobility.driver_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Hora Estimada</label>
                                    <p className="text-sm mt-1 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(point.estimated_delivery_time)}
                                    </p>
                                </div>

                                {point.delivery_instructions && (
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-600">Instrucciones de Entrega</label>
                                        <p className="text-sm mt-1 bg-blue-50 p-2 rounded">
                                            {point.delivery_instructions}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Control de Tiempos */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="h-4 w-4" />
                                <h3 className="font-semibold">Control de Tiempos</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Hora de Llegada</label>
                                    <p className="text-sm mt-1">{formatDate(point.times.arrival_time)}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Hora de Salida</label>
                                    <p className="text-sm mt-1">{formatDate(point.times.departure_time)}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Entregado en</label>
                                    <p className="text-sm mt-1">{formatDate(point.times.delivered_at)}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Creado</label>
                                    <p className="text-sm mt-1">{formatDate(point.times.created_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Observaciones y Calificación */}
                    {(point.observation || point.cancellation_reason || point.customer_rating) && (
                        <Card className="lg:col-span-2">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="h-4 w-4" />
                                    <h3 className="font-semibold">Observaciones</h3>
                                </div>

                                <div className="space-y-4">
                                    {point.observation && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Observación</label>
                                            <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{point.observation}</p>
                                        </div>
                                    )}

                                    {point.cancellation_reason && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Motivo de Cancelación</label>
                                            <p className="text-sm mt-1 bg-red-50 text-red-700 p-2 rounded">
                                                {point.cancellation_reason}
                                            </p>
                                        </div>
                                    )}

                                    {point.customer_rating && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Calificación del Cliente</label>
                                            <div className="flex items-center gap-1 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${
                                                            i < point.customer_rating!
                                                                ? 'text-yellow-400 fill-current'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                                <span className="ml-2 text-sm">
                                                    {point.customer_rating}/5
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Separator />

                <DialogFooter>
                    <div className="flex justify-end w-full">
                        <Button onClick={onClose} variant="outline" className="min-w-[100px]">
                            Cerrar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </div>
    );
}
