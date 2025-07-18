import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, MapPin, Clock, DollarSign, User, Truck, CreditCard, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useGlobalToast } from '@/hooks/use-global-toast';
import {
    type DeliveryPoint,
    type User as ClientUser,
    type Seller,
    type Mobility,
} from '@/types/delivery-points';

// Schema de validación con Zod
const deliveryPointSchema = z.object({
    point_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
    address: z.string().min(10, 'La dirección debe ser más específica').max(255),
    reference: z.string().optional().or(z.literal('')),
    client_user_id: z.number({ required_error: 'Debe seleccionar un cliente' }),
    seller_id: z.number({ required_error: 'Debe seleccionar un vendedor' }),
    mobility_id: z.number({ required_error: 'Debe seleccionar un vehículo' }),
    amount_to_collect: z.number().min(0.01, 'El monto debe ser mayor a 0'),
    priority: z.enum(['alta', 'media', 'baja']),
    estimated_delivery_time: z.string().optional().or(z.literal('')),
    delivery_instructions: z.string().optional().or(z.literal('')),
    latitude: z.number().optional().or(z.undefined()).or(z.null()),
    longitude: z.number().optional().or(z.undefined()).or(z.null()),
});

type DeliveryPointFormData = z.infer<typeof deliveryPointSchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    deliveryId: number;
    clients: ClientUser[];
    sellers: Seller[];
    mobilities: Mobility[];
    initialCoordinates?: { lat: number; lng: number };
    onSuccess?: (point: DeliveryPoint) => void;
}

export default function DeliveryPointModal({
    isOpen,
    onClose,
    deliveryId,
    clients,
    sellers,
    mobilities,
    initialCoordinates,
    onSuccess
}: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodedAddress, setGeocodedAddress] = useState<string>('');
    const { success, error } = useGlobalToast();

    // Debug: Ver datos recibidos
    useEffect(() => {
        // Logs removidos - funcionalidad completa
    }, [clients, sellers, mobilities]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isValid }
    } = useForm<DeliveryPointFormData>({
        resolver: zodResolver(deliveryPointSchema),
        mode: 'onChange',
        defaultValues: {
            priority: 'media',
            latitude: initialCoordinates?.lat,
            longitude: initialCoordinates?.lng,
        }
    });

    // Debug temporal: Ver estado del formulario
    useEffect(() => {
        // Debug removido - solo modo creación
    }, [isValid, errors, watch]);

    const watchedAddress = watch('address');
    const watchedLatitude = watch('latitude');
    const watchedLongitude = watch('longitude');

    // Limpiar formulario al abrir/cerrar
    useEffect(() => {
        if (isOpen) {
            // Modo creación
            reset({
                priority: 'media',
                latitude: initialCoordinates?.lat,
                longitude: initialCoordinates?.lng,
            });

            // Si hay coordenadas iniciales, hacer geocodificación reversa
            if (initialCoordinates) {
                reverseGeocode(initialCoordinates.lat, initialCoordinates.lng);
            }
        } else {
            reset();
            setGeocodedAddress('');
        }
    }, [isOpen, initialCoordinates, reset]);

    // Geocodificación reversa (coordenadas → dirección)
    const reverseGeocode = async (lat: number, lng: number) => {
        setIsGeocoding(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await response.json();

            if (data.display_name) {
                setGeocodedAddress(data.display_name);
                setValue('address', data.display_name);
            }
        } catch (err) {
            console.error('Error en geocodificación reversa:', err);
        } finally {
            setIsGeocoding(false);
        }
    };

    // Geocodificación directa (dirección → coordenadas)
    const geocodeAddress = async (address: string) => {
        if (!address || address.length < 10) return;

        setIsGeocoding(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );
            const data = await response.json();

            if (data[0]) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setValue('latitude', lat);
                setValue('longitude', lng);
            }
        } catch (err) {
            console.error('Error en geocodificación:', err);
        } finally {
            setIsGeocoding(false);
        }
    };

    // Debounce para geocodificación automática
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (watchedAddress && watchedAddress.length > 10 && !watchedLatitude && !watchedLongitude) {
                geocodeAddress(watchedAddress);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [watchedAddress, watchedLatitude, watchedLongitude]);

    const onSubmit = async (data: DeliveryPointFormData) => {


        setIsSubmitting(true);

        try {
            const url = route('entregas.puntos.store', deliveryId);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                onSuccess?.(result.data);
                onClose();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al procesar la solicitud');
            }
        } catch (err: any) {
            error('Error', err.message || 'No se pudo guardar el punto de entrega');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    // Debug: Handler para el botón
    const handleButtonClick = (e: React.MouseEvent) => {

    };

    return (
        <div className="delivery-point-modal">
            <Dialog open={isOpen} onOpenChange={handleClose}>
                                                <DialogContent
                    className="w-[95vw] max-w-[1200px] sm:max-w-[1200px] max-h-[90vh] overflow-y-auto z-[9999]"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={handleClose}
                >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Nuevo Punto de Entrega
                    </DialogTitle>
                    <DialogDescription>
                        Completa la información para crear un nuevo punto de entrega
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna Izquierda - Información Principal */}
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="h-4 w-4" />
                                        <h3 className="font-semibold">Información del Punto</h3>
                                    </div>

                                    <div>
                                        <Label htmlFor="point_name">
                                            Nombre del Punto <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="point_name"
                                            {...register('point_name')}
                                            placeholder="Ej: Casa de María González"
                                            className={errors.point_name ? 'border-red-500' : ''}
                                        />
                                        {errors.point_name && (
                                            <p className="text-sm text-red-500 mt-1">
                                                {errors.point_name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="address">
                                            Dirección Completa <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="address"
                                            {...register('address')}
                                            placeholder="Av. Principal #123, Sector Centro, Ciudad"
                                            className={errors.address ? 'border-red-500' : ''}
                                            rows={2}
                                        />
                                        {errors.address && (
                                            <p className="text-sm text-red-500 mt-1">
                                                {errors.address.message}
                                            </p>
                                        )}
                                        {isGeocoding && (
                                            <p className="text-sm text-blue-600 mt-1">
                                                🌍 Obteniendo coordenadas...
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="reference">Punto de Referencia</Label>
                                        <Input
                                            id="reference"
                                            {...register('reference')}
                                            placeholder="Ej: Frente al supermercado, casa azul"
                                        />
                                    </div>

                                    {/* Coordenadas */}
                                    {(watchedLatitude && watchedLongitude &&
                                      typeof watchedLatitude === 'number' &&
                                      typeof watchedLongitude === 'number') && (
                                        <div className="bg-green-50 p-3 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin className="h-4 w-4 text-green-600" />
                                                <span className="text-sm font-medium text-green-800">
                                                    Ubicación Confirmada
                                                </span>
                                            </div>
                                            <p className="text-xs text-green-700">
                                                Lat: {watchedLatitude.toFixed(6)}, Lng: {watchedLongitude.toFixed(6)}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="h-4 w-4" />
                                        <h3 className="font-semibold">Personas Involucradas</h3>
                                    </div>

                                                                        <div>
                                        <Label htmlFor="client_user_id">
                                            Cliente <span className="text-red-500">*</span>
                                        </Label>
                                                                                                                        <Select
                                            disabled={false}
                                            onValueChange={(value) => {
                                                setValue('client_user_id', parseInt(value), { shouldValidate: true });
                                            }}
                                            onOpenChange={(open) => {
                                                // Debug removido
                                            }}
                                            value={watch('client_user_id')?.toString() || ""}
                                        >
                                            <SelectTrigger
                                                className={errors.client_user_id ? 'border-red-500' : ''}
                                            >
                                                <SelectValue placeholder={
                                                    clients.length === 0
                                                        ? "No hay clientes disponibles"
                                                        : "Seleccionar cliente"
                                                } />
                                            </SelectTrigger>
                                            <SelectContent
                                                className="z-[10000] bg-white border shadow-lg"
                                                style={{ zIndex: 10000 }}
                                            >
                                                {clients.length > 0 ? (
                                                    clients.map((client) => (
                                                        <SelectItem key={client.id} value={client.id.toString()}>
                                                            {client.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-clients" disabled>
                                                        No hay clientes disponibles
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.client_user_id && (
                                            <p className="text-sm text-red-500 mt-1">
                                                {errors.client_user_id.message}
                                            </p>
                                        )}
                                    </div>

                                                                        <div>
                                        <Label htmlFor="seller_id">
                                            Vendedor <span className="text-red-500">*</span>
                                        </Label>
                                                                                                                        <Select
                                            disabled={false}
                                            onValueChange={(value) => {
                                                setValue('seller_id', parseInt(value), { shouldValidate: true });
                                            }}
                                            value={watch('seller_id')?.toString() || ""}
                                        >
                                            <SelectTrigger className={errors.seller_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder={
                                                    sellers.length === 0
                                                        ? "No hay vendedores disponibles"
                                                        : "Seleccionar vendedor"
                                                } />
                                            </SelectTrigger>
                                            <SelectContent
                                                className="z-[10000] bg-white border shadow-lg"
                                                style={{ zIndex: 10000 }}
                                            >
                                                {sellers.length > 0 ? (
                                                    sellers.map((seller) => (
                                                        <SelectItem key={seller.id} value={seller.id.toString()}>
                                                            {seller.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-sellers" disabled>
                                                        No hay vendedores disponibles
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.seller_id && (
                                            <p className="text-sm text-red-500 mt-1">
                                                {errors.seller_id.message}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Columna Derecha - Detalles de Entrega */}
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <DollarSign className="h-4 w-4" />
                                        <h3 className="font-semibold">Detalles Comerciales</h3>
                                    </div>

                                    <div>
                                        <Label htmlFor="amount_to_collect">
                                            Monto a Cobrar (S/) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="amount_to_collect"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register('amount_to_collect', { valueAsNumber: true })}
                                            placeholder="0.00"
                                            className={errors.amount_to_collect ? 'border-red-500' : ''}
                                        />
                                        {errors.amount_to_collect && (
                                            <p className="text-sm text-red-500 mt-1">
                                                {errors.amount_to_collect.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="priority">
                                            Prioridad <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            onValueChange={(value) => setValue('priority', value as 'alta' | 'media' | 'baja', { shouldValidate: true })}
                                            value={watch('priority') || ''}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar prioridad" />
                                            </SelectTrigger>
                                            <SelectContent
                                                className="z-[10000] bg-white border shadow-lg"
                                                style={{ zIndex: 10000 }}
                                            >
                                                <SelectItem value="alta">
                                                    <Badge variant="destructive" className="mr-2">Alta</Badge>
                                                    Urgente
                                                </SelectItem>
                                                <SelectItem value="media">
                                                    <Badge variant="outline" className="mr-2">Media</Badge>
                                                    Normal
                                                </SelectItem>
                                                <SelectItem value="baja">
                                                    <Badge variant="secondary" className="mr-2">Baja</Badge>
                                                    Flexible
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Truck className="h-4 w-4" />
                                        <h3 className="font-semibold">Logística</h3>
                                    </div>

                                    <div>
                                        <Label htmlFor="mobility_id">
                                            Vehículo <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            disabled={false}
                                            onValueChange={(value) => {
                                                setValue('mobility_id', parseInt(value), { shouldValidate: true });
                                            }}
                                            value={watch('mobility_id')?.toString() || ""}
                                        >
                                            <SelectTrigger className={errors.mobility_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder={
                                                    mobilities.length === 0
                                                        ? "No hay vehículos disponibles"
                                                        : "Seleccionar vehículo"
                                                } />
                                            </SelectTrigger>
                                            <SelectContent
                                                className="z-[10000] bg-white border shadow-lg"
                                                style={{ zIndex: 10000 }}
                                            >
                                                {mobilities.length > 0 ? (
                                                    mobilities.map((mobility) => (
                                                        <SelectItem key={mobility.id} value={mobility.id.toString()}>
                                                            {mobility.plate_number} - {mobility.driver_name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-mobilities" disabled>
                                                        No hay vehículos disponibles
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.mobility_id && (
                                            <p className="text-sm text-red-500 mt-1">
                                                {errors.mobility_id.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="estimated_delivery_time">Hora Estimada</Label>
                                        <Input
                                            id="estimated_delivery_time"
                                            type="time"
                                            {...register('estimated_delivery_time')}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="delivery_instructions">Instrucciones de Entrega</Label>
                                        <Textarea
                                            id="delivery_instructions"
                                            {...register('delivery_instructions')}
                                            placeholder="Instrucciones especiales para el conductor..."
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Separator />

                    <DialogFooter>
                        <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {!isValid && (
                                    <>
                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                        <span>Completa todos los campos obligatorios</span>
                                    </>
                                )}
                            </div>



                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!isValid || isSubmitting || isGeocoding}
                                    className="min-w-[120px]"
                                    onClick={handleButtonClick}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            Guardando...
                                        </>
                                    ) : (
                                        'Crear Punto'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </div>
    );
}
