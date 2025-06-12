import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocationPin } from '@/components/atoms/conductor';
import { DeliveryPoint, DriverLocation } from '@/types/driver';
import { useAdvancedGeolocation } from '@/hooks/useAdvancedGeolocation';
import { MapPin, Navigation, AlertTriangle } from 'lucide-react';

interface MapViewProps {
    points: DeliveryPoint[];
    currentLocation?: DriverLocation;
    onPointClick: (point: DeliveryPoint) => void;
    onLocationUpdate?: (location: DriverLocation) => void;
    className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
    points = [],
    currentLocation,
    onPointClick,
    onLocationUpdate,
    className
}) => {
    const [selectedPointId, setSelectedPointId] = useState<number | null>(null);

    // Usar el hook de geolocalización avanzado
    const {
        location: gpsLocation,
        error: gpsError,
        isLoading: gpsLoading,
        isTracking,
        getCurrentLocation: getGPSLocation
    } = useAdvancedGeolocation({
        autoSync: false, // No sincronizar automáticamente desde el mapa
        batteryOptimization: true
    });

    // Usar la ubicación del GPS si está disponible, sino la prop
    const effectiveLocation = gpsLocation || currentLocation;

    const handleGetCurrentLocation = useCallback(async () => {
        try {
            const location = await getGPSLocation();
            onLocationUpdate?.(location);
        } catch (error) {
            console.error('Error obteniendo ubicación:', error);
        }
    }, [getGPSLocation, onLocationUpdate]);



    const handlePointClick = (point: DeliveryPoint) => {
        setSelectedPointId(point.id);
        onPointClick(point);
    };

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4" />
                        <span className="hidden sm:inline">Mapa de Entregas</span>
                        <span className="sm:hidden">Mapa</span>
                    </CardTitle>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGetCurrentLocation}
                        disabled={gpsLoading}
                        className="flex-shrink-0"
                    >
                        <Navigation className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">
                            {gpsLoading ? 'Obteniendo...' : 'Mi Ubicación'}
                        </span>
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {/* Mostrar errores de GPS */}
                {gpsError && (
                    <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="whitespace-pre-line">{gpsError}</div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="relative bg-gradient-to-br from-blue-50 to-green-50 h-48 sm:h-64 rounded-lg border overflow-hidden">
                    {/* Ubicación actual */}
                    {effectiveLocation && (
                        <div className="absolute top-4 left-4">
                            <LocationPin
                                latitude={effectiveLocation.latitude}
                                longitude={effectiveLocation.longitude}
                                isCurrentLocation={true}
                                title={`Tu ubicación ${isTracking ? '(Seguimiento activo)' : ''}`}
                                size="md"
                            />
                        </div>
                    )}

                    {/* Indicador de seguimiento */}
                    {isTracking && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            📍 Seguimiento GPS
                        </div>
                    )}

                    {/* Puntos de entrega */}
                    <div className="p-4 space-y-2">
                        {points.slice(0, 6).map((point, index) => (
                            <div
                                key={point.id}
                                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                    selectedPointId === point.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => handlePointClick(point)}
                            >
                                <LocationPin
                                    latitude={point.latitude || 0}
                                    longitude={point.longitude || 0}
                                    status={point.status as any}
                                    size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {point.route_order}. {point.customer_name || 'Cliente'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {point.address}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {points.length > 6 && (
                        <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            +{points.length - 6} más
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default MapView;
