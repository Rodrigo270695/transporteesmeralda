import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LocationPin } from '@/components/atoms/conductor';
import { DeliveryPoint, DriverLocation } from '@/types/driver';
import { useAdvancedGeolocation } from '@/hooks/useAdvancedGeolocation';
import {
    MapPin,
    Navigation,
    AlertTriangle,
    Maximize2,
    Minimize2,
    LocateFixed,
    Route,
    Target,
    RefreshCw
} from 'lucide-react';

interface MapViewProps {
    points: DeliveryPoint[];
    currentLocation?: DriverLocation;
    onPointClick: (point: DeliveryPoint) => void;
    onLocationUpdate?: (location: DriverLocation) => void;
    className?: string;
    showRoute?: boolean;
    autoCenter?: boolean;
}

// Extender tipo global de Window para Leaflet
declare global {
    interface Window {
        L: any;
    }
}

export const MapView: React.FC<MapViewProps> = ({
    points = [],
    currentLocation,
    onPointClick,
    onLocationUpdate,
    className,
    showRoute = true,
    autoCenter = true
}) => {
    const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showRoutes, setShowRoutes] = useState(showRoute);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    // Referencias para el mapa
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const routeLinesRef = useRef<any[]>([]);
    const currentLocationMarkerRef = useRef<any>(null);

    // Usar el hook de geolocalización avanzado
    const {
        location: gpsLocation,
        error: gpsError,
        isLoading: gpsLoading,
        isTracking,
        startTracking,
        stopTracking,
        getCurrentLocation: getGPSLocation
    } = useAdvancedGeolocation({
        autoSync: true,
        batteryOptimization: true,
        trackingInterval: 5000 // Actualizar cada 5 segundos
    });

    // Usar la ubicación del GPS si está disponible, sino la prop
    const effectiveLocation = gpsLocation || currentLocation;

    // Cargar Leaflet dinámicamente
    useEffect(() => {
        const loadLeaflet = async () => {
            if (typeof window !== 'undefined' && !window.L) {
                // Cargar CSS
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                link.crossOrigin = '';
                document.head.appendChild(link);

                // Cargar JS
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
                script.crossOrigin = '';
                script.onload = () => {
                    setMapLoaded(true);
                };
                document.head.appendChild(script);
            } else if (window.L) {
                setMapLoaded(true);
            }
        };

        loadLeaflet();
    }, []);

    // Inicializar mapa
    useEffect(() => {
        if (mapLoaded && mapRef.current && !mapInstance.current) {
            // Ubicación por defecto: Maracaibo, Venezuela
            const defaultLocation = effectiveLocation
                ? [effectiveLocation.latitude, effectiveLocation.longitude]
                : [10.6666, -71.6167];

            mapInstance.current = window.L.map(mapRef.current, {
                center: defaultLocation,
                zoom: 13,
                zoomControl: true,
                attributionControl: false
            });

            // Agregar capa de mapa
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstance.current);

            // Agregar control de zoom personalizado
            const zoomControl = window.L.control.zoom({
                position: 'bottomright'
            });
            zoomControl.addTo(mapInstance.current);
        }
    }, [mapLoaded, effectiveLocation]);

    // Actualizar marcador de ubicación actual
    useEffect(() => {
        if (mapInstance.current && effectiveLocation) {
            // Remover marcador anterior
            if (currentLocationMarkerRef.current) {
                mapInstance.current.removeLayer(currentLocationMarkerRef.current);
            }

            // Crear icono personalizado para ubicación actual
            const currentLocationIcon = window.L.divIcon({
                html: `
                    <div class="flex items-center justify-center w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg">
                        <div class="w-2 h-2 bg-white rounded-full ${isTracking ? 'animate-pulse' : ''}"></div>
                    </div>
                    ${isTracking ? `
                        <div class="absolute -inset-2 border-2 border-blue-400 rounded-full animate-ping opacity-75"></div>
                    ` : ''}
                `,
                className: 'current-location-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            // Agregar marcador de ubicación actual
            currentLocationMarkerRef.current = window.L.marker(
                [effectiveLocation.latitude, effectiveLocation.longitude],
                { icon: currentLocationIcon }
            ).addTo(mapInstance.current);

            currentLocationMarkerRef.current.bindPopup(`
                <div class="text-sm">
                    <strong>📍 Tu Ubicación</strong><br>
                    <span class="text-gray-600">Lat: ${effectiveLocation.latitude.toFixed(6)}</span><br>
                    <span class="text-gray-600">Lng: ${effectiveLocation.longitude.toFixed(6)}</span><br>
                    ${effectiveLocation.accuracy ? `<span class="text-gray-600">Precisión: ±${Math.round(effectiveLocation.accuracy)}m</span><br>` : ''}
                    <span class="text-${isTracking ? 'green' : 'gray'}-600">
                        ${isTracking ? '🟢 Seguimiento activo' : '⚪ Seguimiento inactivo'}
                    </span>
                </div>
            `);

            // Auto-centrar si está habilitado
            if (autoCenter) {
                mapInstance.current.setView([effectiveLocation.latitude, effectiveLocation.longitude], 15);
            }

            // Notificar cambio de ubicación
            onLocationUpdate?.(effectiveLocation);
        }
    }, [effectiveLocation, isTracking, autoCenter, onLocationUpdate]);

    // Función para obtener ruta entre dos puntos usando OSRM
    const getRouteCoordinates = async (startPoint: {lat: number, lng: number}, endPoint: {lat: number, lng: number}) => {
        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}?overview=full&geometries=geojson`
            );

            if (!response.ok) throw new Error('Error al obtener la ruta');

            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                return data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
            }
            return null;
        } catch (error) {
            console.warn('Error obteniendo ruta:', error);
            return null;
        }
    };

    // Dibujar rutas reales entre los puntos
    const drawRealRoutes = async (sortedPoints: DeliveryPoint[]) => {
        if (sortedPoints.length < 2 || !showRoutes) return;

        setLoadingRoutes(true);

        // Agregar la ubicación actual como punto de inicio si existe
        let routePoints = sortedPoints;
        if (effectiveLocation) {
            const currentLocationPoint = {
                coordinates: { latitude: effectiveLocation.latitude, longitude: effectiveLocation.longitude },
                route_order: 0
            };
            routePoints = [currentLocationPoint as any, ...sortedPoints];
        }

        // Dibujar ruta entre cada par de puntos consecutivos
        for (let i = 0; i < routePoints.length - 1; i++) {
            const currentPoint = routePoints[i];
            const nextPoint = routePoints[i + 1];

            if (currentPoint.coordinates && nextPoint.coordinates) {
                const startCoords = {
                    lat: currentPoint.coordinates.latitude,
                    lng: currentPoint.coordinates.longitude
                };
                const endCoords = {
                    lat: nextPoint.coordinates.latitude,
                    lng: nextPoint.coordinates.longitude
                };

                const routeCoordinates = await getRouteCoordinates(startCoords, endCoords);

                if (routeCoordinates) {
                    const routeLine = window.L.polyline(routeCoordinates, {
                        color: i === 0 && effectiveLocation ? '#10b981' : '#6366f1',
                        weight: 4,
                        opacity: 0.8,
                        dashArray: i === 0 && effectiveLocation ? '5, 5' : undefined
                    }).addTo(mapInstance.current);

                    const segmentInfo = effectiveLocation && i === 0
                        ? `Ruta desde tu ubicación → Punto ${nextPoint.route_order}`
                        : `Ruta: Punto ${currentPoint.route_order} → Punto ${nextPoint.route_order}`;

                    routeLine.bindPopup(`
                        <div class="text-sm">
                            <strong>${segmentInfo}</strong>
                        </div>
                    `);

                    routeLinesRef.current.push(routeLine);
                }
            }
        }

        setLoadingRoutes(false);
    };

    // Actualizar marcadores de puntos de entrega
    useEffect(() => {
        if (mapInstance.current && points.length > 0) {
            // Limpiar marcadores existentes
            markersRef.current.forEach(marker => {
                mapInstance.current.removeLayer(marker);
            });
            markersRef.current = [];

            // Limpiar rutas existentes
            routeLinesRef.current.forEach(line => {
                mapInstance.current.removeLayer(line);
            });
            routeLinesRef.current = [];

            const validPoints = points.filter(p => p.coordinates?.latitude && p.coordinates?.longitude);

            // Función para obtener color por estado
            const getStatusColor = (status: string) => {
                switch (status) {
                    case 'entregado': return '#10b981';
                    case 'en_ruta': return '#3b82f6';
                    case 'cancelado': return '#ef4444';
                    case 'reagendado': return '#8b5cf6';
                    default: return '#f59e0b';
                }
            };

            // Agregar marcadores de puntos
            validPoints.forEach((point, index) => {
                const color = getStatusColor(point.status);

                const marker = window.L.circleMarker(
                    [point.coordinates.latitude, point.coordinates.longitude],
                    {
                        color: '#ffffff',
                        fillColor: color,
                        fillOpacity: 0.8,
                        radius: 12,
                        weight: 3
                    }
                ).addTo(mapInstance.current);

                // Agregar número del punto
                const numberIcon = window.L.divIcon({
                    html: `<div class="flex items-center justify-center w-6 h-6 text-white font-bold text-sm">${point.route_order}</div>`,
                    className: 'point-number-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                const numberMarker = window.L.marker(
                    [point.coordinates.latitude, point.coordinates.longitude],
                    { icon: numberIcon }
                ).addTo(mapInstance.current);

                // Popup con información detallada
                marker.bindPopup(`
                    <div class="text-sm min-w-[200px]">
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="font-bold text-base">${point.route_order}. ${point.customer_name || 'Cliente'}</h3>
                            <span class="px-2 py-1 rounded text-xs ${
                                point.status === 'entregado' ? 'bg-green-100 text-green-800' :
                                point.status === 'en_ruta' ? 'bg-blue-100 text-blue-800' :
                                point.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }">${point.status}</span>
                        </div>
                        <p class="text-gray-600 mb-2">${point.address}</p>
                        <div class="space-y-1">
                            <div class="flex justify-between">
                                <span class="text-gray-500">Monto:</span>
                                <span class="font-medium">S/ ${point.amount_to_collect || 0}</span>
                            </div>
                            ${point.estimated_delivery_time ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Hora:</span>
                                    <span class="font-medium">${point.estimated_delivery_time}</span>
                                </div>
                            ` : ''}
                        </div>
                        <button
                            onclick="window.selectPoint(${point.id})"
                            class="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Ver Detalles
                        </button>
                    </div>
                `);

                marker.on('click', () => {
                    setSelectedPointId(point.id);
                    onPointClick(point);
                });

                markersRef.current.push(marker);
                markersRef.current.push(numberMarker);
            });

            // Dibujar rutas si está habilitado
            if (validPoints.length > 0 && showRoutes) {
                const sortedPoints = validPoints.sort((a, b) => a.route_order - b.route_order);
                drawRealRoutes(sortedPoints);
            }

            // Ajustar vista para mostrar todos los puntos
            if (validPoints.length > 0) {
                const group = new window.L.featureGroup(markersRef.current);
                mapInstance.current.fitBounds(group.getBounds().pad(0.1));
            }
        }
    }, [points, mapInstance.current, showRoutes]);

    // Función global para seleccionar punto desde popup
    useEffect(() => {
        (window as any).selectPoint = (pointId: number) => {
            const point = points.find(p => p.id === pointId);
            if (point) {
                setSelectedPointId(pointId);
                onPointClick(point);
            }
        };

        return () => {
            delete (window as any).selectPoint;
        };
    }, [points, onPointClick]);

    const handleGetCurrentLocation = useCallback(async () => {
        try {
            const location = await getGPSLocation();
            if (mapInstance.current) {
                mapInstance.current.setView([location.latitude, location.longitude], 16);
            }
        } catch (error) {
            console.error('Error obteniendo ubicación:', error);
        }
    }, [getGPSLocation]);

    const toggleTracking = () => {
        if (isTracking) {
            stopTracking();
        } else {
            startTracking();
        }
    };

    const toggleRoutes = () => {
        setShowRoutes(!showRoutes);
    };

    const centerOnPoints = () => {
        if (mapInstance.current && markersRef.current.length > 0) {
            const group = new window.L.featureGroup(markersRef.current);
            mapInstance.current.fitBounds(group.getBounds().pad(0.1));
        }
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

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleTracking}
                            className={`flex-shrink-0 ${isTracking ? 'bg-green-100 text-green-700' : ''}`}
                        >
                            <LocateFixed className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGetCurrentLocation}
                            disabled={gpsLoading}
                            className="flex-shrink-0"
                        >
                            <Navigation className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleRoutes}
                            disabled={loadingRoutes}
                            className={`flex-shrink-0 ${showRoutes ? 'bg-blue-100 text-blue-700' : ''}`}
                        >
                            {loadingRoutes ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={centerOnPoints}
                            className="flex-shrink-0"
                        >
                            <Target className="h-4 w-4" />
                        </Button>
                    </div>
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

                {/* Estado de conexión */}
                <div className="flex items-center gap-2 mb-4 text-sm">
                    <Badge variant={effectiveLocation ? "default" : "secondary"}>
                        {effectiveLocation ? "📍 GPS Conectado" : "📍 GPS Desconectado"}
                    </Badge>

                    {isTracking && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            🔄 Seguimiento Activo
                        </Badge>
                    )}

                    {showRoutes && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            🛣️ Rutas Visibles
                        </Badge>
                    )}

                    {loadingRoutes && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                            ⏳ Cargando Rutas
                        </Badge>
                    )}
                </div>

                {/* Contenedor del mapa */}
                <div className="relative conductor-map">
                    <div
                        ref={mapRef}
                        className="w-full h-64 sm:h-80"
                        style={{ minHeight: '300px' }}
                    />

                    {!mapLoaded && (
                        <div className="map-loading-overlay">
                            <div className="text-center">
                                <div className="map-loading-spinner"></div>
                                <p className="text-sm text-gray-500 mt-2">Cargando mapa...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Información de estado */}
                {effectiveLocation && (
                    <div className="mt-4 text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                            <span>Ubicación:</span>
                            <span>{effectiveLocation.latitude.toFixed(6)}, {effectiveLocation.longitude.toFixed(6)}</span>
                        </div>
                        {effectiveLocation.accuracy && (
                            <div className="flex justify-between">
                                <span>Precisión:</span>
                                <span>±{Math.round(effectiveLocation.accuracy)}m</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>Puntos de entrega:</span>
                            <span>{points.length} puntos</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MapView;
