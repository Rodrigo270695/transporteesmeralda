import { useState, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    DeliveryPoint,
    PointUpdateRequest,
    LocationUpdate,
    ImageUpload,
    ApiResponse,
    DriverLocation
} from '@/types/driver';

interface UseDriverOptions {
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
    enableLocationTracking?: boolean;
    locationUpdateInterval?: number;
}

export function useDriver(options: UseDriverOptions = {}) {
    const {
        onSuccess,
        onError,
        enableLocationTracking = false,
        locationUpdateInterval = 30000 // 30 segundos
    } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<DriverLocation | null>(null);
    const [locationWatchId, setLocationWatchId] = useState<number | null>(null);

    // Actualizar estado de punto de entrega
    const updatePoint = useCallback(async (
        pointId: number,
        data: PointUpdateRequest
    ): Promise<ApiResponse<DeliveryPoint>> => {
        setIsLoading(true);

        try {
            const response = await fetch(route('conductor.actualizar-punto', { deliveryPoint: pointId }), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(data)
            });

            const result: ApiResponse<DeliveryPoint> = await response.json();

            if (result.success) {
                onSuccess?.(result.message);

                // Recargar la página para actualizar el estado
                router.reload({ preserveScroll: true });
            } else {
                onError?.(result.message);
            }

            return result;
        } catch (error) {
            const errorMessage = 'Error al actualizar el punto de entrega';
            onError?.(errorMessage);
            return {
                success: false,
                message: errorMessage,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        } finally {
            setIsLoading(false);
        }
    }, [onSuccess, onError]);

    // Subir imágenes
    const uploadImages = useCallback(async (data: ImageUpload): Promise<ApiResponse> => {
        setIsLoading(true);

        try {
            const response = await fetch(route('conductor.subir-imagenes'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(data)
            });

            const result: ApiResponse = await response.json();

            if (result.success) {
                onSuccess?.(result.message);
            } else {
                onError?.(result.message);
            }

            return result;
        } catch (error) {
            const errorMessage = 'Error al subir las imágenes';
            onError?.(errorMessage);
            return {
                success: false,
                message: errorMessage,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        } finally {
            setIsLoading(false);
        }
    }, [onSuccess, onError]);

    // Actualizar ubicación del conductor
    const updateLocation = useCallback(async (location: LocationUpdate): Promise<ApiResponse> => {
        try {
            const response = await fetch(route('conductor.actualizar-ubicacion'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(location)
            });

            const result: ApiResponse = await response.json();

            // Actualizar ubicación local
            setCurrentLocation({
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            return {
                success: false,
                message: 'Error al actualizar ubicación',
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }, []);

    // Obtener ubicación actual
    const getCurrentLocation = useCallback((): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no soportada'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000 // 1 minuto
                }
            );
        });
    }, []);

    // Iniciar seguimiento de ubicación
    const startLocationTracking = useCallback(() => {
        if (!navigator.geolocation || locationWatchId !== null) return;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                updateLocation(location);
            },
            (error) => {
                console.error('Error de geolocalización:', error);
                onError?.('Error al obtener ubicación GPS');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000 // 30 segundos
            }
        );

        setLocationWatchId(watchId);
    }, [locationWatchId, updateLocation, onError]);

    // Detener seguimiento de ubicación
    const stopLocationTracking = useCallback(() => {
        if (locationWatchId !== null) {
            navigator.geolocation.clearWatch(locationWatchId);
            setLocationWatchId(null);
        }
    }, [locationWatchId]);

    // Convertir imagen a base64
    const convertImageToBase64 = useCallback((file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }, []);

    // Capturar imagen desde cámara (PWA)
    const captureImage = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Crear input de archivo temporal
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'camera';

            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    try {
                        const base64 = await convertImageToBase64(file);
                        resolve(base64);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error('No se seleccionó imagen'));
                }
            };

            input.click();
        });
    }, [convertImageToBase64]);

    // Marcar punto como "en ruta"
    const markAsInRoute = useCallback(async (pointId: number) => {
        try {
            const position = await getCurrentLocation();

            return await updatePoint(pointId, {
                status: 'en_ruta',
                current_latitude: position.coords.latitude,
                current_longitude: position.coords.longitude
            });
        } catch (error) {
            // Si no se puede obtener ubicación, marcar sin coordenadas
            return await updatePoint(pointId, {
                status: 'en_ruta'
            });
        }
    }, [updatePoint, getCurrentLocation]);

    // Completar entrega
    const completeDelivery = useCallback(async (
        pointId: number,
        paymentMethodId: number,
        amountCollected: number,
        options: {
            paymentImage?: string;
            deliveryImage?: string;
            paymentReference?: string;
            paymentNotes?: string;
            observation?: string;
            customerRating?: number;
        } = {}
    ) => {
        try {
            const position = await getCurrentLocation();

            return await updatePoint(pointId, {
                status: 'entregado',
                payment_method_id: paymentMethodId,
                amount_collected: amountCollected,
                current_latitude: position.coords.latitude,
                current_longitude: position.coords.longitude,
                ...options
            });
        } catch (error) {
            // Si no se puede obtener ubicación, completar sin coordenadas
            return await updatePoint(pointId, {
                status: 'entregado',
                payment_method_id: paymentMethodId,
                amount_collected: amountCollected,
                ...options
            });
        }
    }, [updatePoint, getCurrentLocation]);

    // Cancelar o reagendar punto
    const cancelOrReschedulePoint = useCallback(async (
        pointId: number,
        status: 'cancelado' | 'reagendado',
        reason: string
    ) => {
        return await updatePoint(pointId, {
            status,
            cancellation_reason: reason
        });
    }, [updatePoint]);

    // Efecto para iniciar tracking automático
    useEffect(() => {
        if (enableLocationTracking) {
            startLocationTracking();
        }

        return () => {
            stopLocationTracking();
        };
    }, [enableLocationTracking, startLocationTracking, stopLocationTracking]);

    return {
        // Estado
        isLoading,
        currentLocation,

        // Acciones principales
        updatePoint,
        uploadImages,
        updateLocation,

        // Helpers de ubicación
        getCurrentLocation,
        startLocationTracking,
        stopLocationTracking,

        // Helpers de imagen
        convertImageToBase64,
        captureImage,

        // Acciones específicas
        markAsInRoute,
        completeDelivery,
        cancelOrReschedulePoint
    };
}
