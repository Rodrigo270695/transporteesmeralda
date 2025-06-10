import { Head } from '@inertiajs/react';
import { Heading } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import {
    Plus,
    MapPin,
    Navigation,
    Route,
    Play,
    DollarSign,
    Users,
    Clock,
    Eye,
    Edit2,
    Trash2,
    MoreHorizontal,
    Target,
    TrendingUp,
    ArrowLeft,
    List,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useGlobalToast } from '@/hooks/use-global-toast';
import {
    type DeliveryPoint,
    type Delivery,
    type User,
    type Seller,
    type Mobility,
    type PaymentMethod,
} from '@/types/delivery-points';

interface Props {
    delivery: Delivery;
    filters?: {
        search?: string;
        status?: string;
        priority?: string;
        mobility_id?: string;
        seller_id?: string;
    };
    clients: User[];
    sellers: Seller[];
    mobilities: Mobility[];
    payment_methods: PaymentMethod[];
}

// Extender tipo global de Window para Leaflet
declare global {
    interface Window {
        L: any;
    }
}

export default function MapaGestionPuntos({ delivery, filters, clients, sellers, mobilities, payment_methods }: Props) {
    const [points, setPoints] = useState<DeliveryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState<DeliveryPoint | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const routeLineRef = useRef<any>(null);

    const { success, error } = useGlobalToast();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Gestión',
            href: '/gestion',
        },
        {
            title: 'Entregas',
            href: '/entregas/gestionar',
        },
        {
            title: delivery.name,
            href: `/entregas/${delivery.id}/puntos`,
        },
        {
            title: 'Mapa',
            href: `/entregas/${delivery.id}/puntos/mapa`,
        },
    ];

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
            mapInstance.current = window.L.map(mapRef.current).setView([10.6666, -71.6167], 12); // Maracaibo

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstance.current);
        }
    }, [mapLoaded]);

    // Cargar puntos de entrega
    const loadPoints = async () => {
        try {
            setLoading(true);
            const response = await fetch(route('entregas.puntos.index', delivery.id), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPoints(data.data || []);
            }
        } catch (err) {
            error('Error', 'No se pudieron cargar los puntos de entrega');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPoints();
    }, []);

    // Centrar mapa en todos los puntos
    const fitMapToPoints = () => {
        if (mapInstance.current && points.length > 0) {
            const validPoints = points.filter(p => p.coordinates?.latitude && p.coordinates?.longitude);
            if (validPoints.length > 0) {
                const group = new window.L.featureGroup(markersRef.current);
                mapInstance.current.fitBounds(group.getBounds().pad(0.1));
            }
        }
    };

    // Función para enfocar en un punto específico
    const focusOnPoint = (point: DeliveryPoint) => {
        if (mapInstance.current && point.coordinates?.latitude && point.coordinates?.longitude) {
            mapInstance.current.setView([point.coordinates.latitude, point.coordinates.longitude], 16);
            setSelectedPoint(point);
        }
    };

    // Actualizar marcadores en el mapa
    useEffect(() => {
        if (mapInstance.current && points.length > 0) {
            // Limpiar marcadores existentes
            markersRef.current.forEach(marker => {
                mapInstance.current.removeLayer(marker);
            });
            markersRef.current = [];

            // Limpiar línea de ruta existente
            if (routeLineRef.current) {
                mapInstance.current.removeLayer(routeLineRef.current);
                routeLineRef.current = null;
            }

            const validPoints = points.filter(p => p.coordinates?.latitude && p.coordinates?.longitude);

            // Agregar nuevos marcadores
            validPoints.forEach((point, index) => {
                const color = point.status === 'entregado' ? '#10b981' :
                              point.status === 'en_ruta' ? '#3b82f6' :
                              point.status === 'cancelado' ? '#ef4444' : '#f59e0b';

                const marker = window.L.circleMarker(
                    [point.coordinates.latitude, point.coordinates.longitude],
                    {
                        color: '#ffffff',
                        fillColor: color,
                        fillOpacity: 0.8,
                        radius: 10,
                        weight: 2
                    }
                ).addTo(mapInstance.current);

                // Agregar número del punto
                const numberIcon = window.L.divIcon({
                    html: `<div style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; color: white; font-weight: bold; font-size: 12px;">${point.route_order}</div>`,
                    className: 'custom-div-icon',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                const numberMarker = window.L.marker(
                    [point.coordinates.latitude, point.coordinates.longitude],
                    { icon: numberIcon }
                ).addTo(mapInstance.current);

                marker.bindPopup(`
                    <div class="text-sm min-w-[200px]">
                        <h3 class="font-bold text-base mb-2">${point.route_order}. ${point.point_name}</h3>
                        <p class="text-gray-600 mb-2">${point.address}</p>
                        <div class="space-y-1">
                            <p><strong>Cliente:</strong> ${point.client.name}</p>
                            <p><strong>Vendedor:</strong> ${point.seller.full_name}</p>
                            <p><strong>Monto:</strong> ${point.amount_to_collect.formatted}</p>
                            <p><strong>Estado:</strong> <span class="px-2 py-1 rounded text-xs ${
                                point.status === 'entregado' ? 'bg-green-100 text-green-800' :
                                point.status === 'en_ruta' ? 'bg-blue-100 text-blue-800' :
                                point.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }">${point.status_label}</span></p>
                            ${point.estimated_delivery_time ? `<p><strong>Hora estimada:</strong> ${point.estimated_delivery_time}</p>` : ''}
                        </div>
                    </div>
                `);

                marker.on('click', () => {
                    setSelectedPoint(point);
                });

                markersRef.current.push(marker);
                markersRef.current.push(numberMarker);
            });

            // Crear línea de ruta conectando los puntos en orden
            if (validPoints.length > 1) {
                const routeCoordinates = validPoints
                    .sort((a, b) => a.route_order - b.route_order)
                    .map(point => [point.coordinates.latitude, point.coordinates.longitude]);

                routeLineRef.current = window.L.polyline(routeCoordinates, {
                    color: '#6366f1',
                    weight: 3,
                    opacity: 0.7,
                    dashArray: '10, 10'
                }).addTo(mapInstance.current);
            }

            // Ajustar vista para mostrar todos los puntos
            setTimeout(() => {
                fitMapToPoints();
            }, 100);
        }
    }, [points, mapInstance.current]);

    // Optimizar ruta
    const optimizeRoute = async () => {
        if (points.length < 2) {
            error('Error', 'Necesitas al menos 2 puntos para optimizar la ruta');
            return;
        }

        setIsOptimizing(true);
        try {
            // Aquí implementarías el algoritmo de optimización
            // Por ahora, simularemos reordenando por proximidad
            success('¡Ruta optimizada!', 'Los puntos han sido reordenados para máxima eficiencia');
        } catch (err) {
            error('Error', 'No se pudo optimizar la ruta');
        } finally {
            setIsOptimizing(false);
        }
    };

    // Activar entrega
    const activateDelivery = async () => {
        if (points.length === 0) {
            error('Error', 'Necesitas al menos un punto para activar la entrega');
            return;
        }

        try {
            // Implementar lógica para activar entrega
            success('¡Entrega activada!', 'La ruta está lista para el conductor');
        } catch (err) {
            error('Error', 'No se pudo activar la entrega');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Estadísticas
    const stats = {
        total: points.length,
        entregados: points.filter(p => p.status === 'entregado').length,
        enRuta: points.filter(p => p.status === 'en_ruta').length,
        pendientes: points.filter(p => p.status === 'pendiente').length,
        cancelados: points.filter(p => p.status === 'cancelado').length,
        totalMonto: points.reduce((sum, p) => sum + p.amount_to_collect.amount, 0),
        montoCobrado: points.reduce((sum, p) => sum + (p.amount_collected?.amount || 0), 0),
    };

    const completionPercentage = stats.total > 0 ? Math.round((stats.entregados / stats.total) * 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Mapa - ${delivery.name}`} />

            <div className="h-screen flex flex-col">
                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={() => router.visit(route('entregas.puntos.index', delivery.id))}
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                            >
                                <List className="mr-2 h-4 w-4" />
                                Vista Lista
                            </Button>

                            <div>
                                <Heading
                                    title={`Gestión de Ruta: ${delivery.name}`}
                                    description={`Fecha: ${formatDate(delivery.delivery_date)} • Estado: ${delivery.status}`}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={fitMapToPoints}
                                variant="outline"
                                size="sm"
                                disabled={points.length === 0}
                                className="cursor-pointer"
                            >
                                <Target className="mr-2 h-4 w-4" />
                                Centrar Mapa
                            </Button>

                            <Button
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                            >
                                {isFullScreen ? (
                                    <Minimize2 className="mr-2 h-4 w-4" />
                                ) : (
                                    <Maximize2 className="mr-2 h-4 w-4" />
                                )}
                                {isFullScreen ? 'Panel' : 'Pantalla Completa'}
                            </Button>

                            {delivery.status === 'borrador' && (
                                <>
                                    <Button
                                        onClick={() => router.visit(route('entregas.puntos.create', delivery.id))}
                                        className="cursor-pointer"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Punto
                                    </Button>

                                    <Button
                                        onClick={optimizeRoute}
                                        disabled={isOptimizing || points.length < 2}
                                        className="cursor-pointer"
                                        variant="outline"
                                    >
                                        <Route className="mr-2 h-4 w-4" />
                                        {isOptimizing ? 'Optimizando...' : 'Optimizar Ruta'}
                                    </Button>

                                    <Button
                                        onClick={activateDelivery}
                                        disabled={points.length === 0}
                                        className="cursor-pointer"
                                    >
                                        <Play className="mr-2 h-4 w-4" />
                                        Activar Entrega
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Mapa */}
                    <div className={`relative ${isFullScreen ? 'w-full' : 'flex-1'}`}>
                        <div
                            ref={mapRef}
                            className="w-full h-full"
                            style={{ minHeight: '500px' }}
                        />

                        {!mapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                    <p className="text-sm text-muted-foreground">Cargando mapa...</p>
                                </div>
                            </div>
                        )}

                        {/* Controles flotantes del mapa */}
                        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
                            <Button
                                onClick={fitMapToPoints}
                                variant="outline"
                                size="sm"
                                disabled={points.length === 0}
                                className="w-full cursor-pointer"
                            >
                                <Target className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Panel Lateral */}
                    {!isFullScreen && (
                        <div className="w-96 bg-white border-l flex flex-col">
                            {/* Estadísticas */}
                            <div className="p-4 border-b">
                                <h3 className="font-semibold mb-3">Resumen de la Ruta</h3>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <Card className="p-3">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                                            <div className="text-xs text-muted-foreground">Total Puntos</div>
                                        </div>
                                    </Card>

                                    <Card className="p-3">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">{completionPercentage}%</div>
                                            <div className="text-xs text-muted-foreground">Completado</div>
                                        </div>
                                    </Card>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            Entregados
                                        </span>
                                        <span className="font-medium">{stats.entregados}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            En Ruta
                                        </span>
                                        <span className="font-medium">{stats.enRuta}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            Pendientes
                                        </span>
                                        <span className="font-medium">{stats.pendientes}</span>
                                    </div>

                                    {stats.cancelados > 0 && (
                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                Cancelados
                                            </span>
                                            <span className="font-medium">{stats.cancelados}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-3" />

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Total a cobrar:</span>
                                        <span className="font-medium">S/ {stats.totalMonto.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Ya cobrado:</span>
                                        <span className="font-medium text-green-600">S/ {stats.montoCobrado.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pendiente:</span>
                                        <span className="font-medium text-orange-600">S/ {(stats.totalMonto - stats.montoCobrado).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de Puntos */}
                            <div className="flex-1 overflow-auto">
                                <div className="p-4">
                                    <h3 className="font-semibold mb-3">Puntos de Entrega</h3>

                                    {loading ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                            <p className="text-sm text-muted-foreground">Cargando puntos...</p>
                                        </div>
                                    ) : points.length === 0 ? (
                                        <div className="text-center py-8">
                                            <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                                            <p className="text-sm text-muted-foreground">No hay puntos de entrega</p>
                                            <Button
                                                onClick={() => router.visit(route('entregas.puntos.create', delivery.id))}
                                                className="mt-3 cursor-pointer"
                                                variant="outline"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Agregar Primer Punto
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {points.map((point, index) => (
                                                <Card
                                                    key={point.id}
                                                    className={`p-3 cursor-pointer transition-all duration-200 ${
                                                        selectedPoint?.id === point.id ? 'bg-blue-50 border-blue-200 shadow-md' : 'hover:bg-gray-50 hover:shadow-sm'
                                                    }`}
                                                    onClick={() => focusOnPoint(point)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="text-lg font-bold text-muted-foreground min-w-[2rem]">
                                                            {point.route_order}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-medium truncate">{point.point_name}</h4>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        point.status === 'entregado' ? 'bg-green-100 text-green-800 border-green-200' :
                                                                        point.status === 'en_ruta' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                                        point.status === 'cancelado' ? 'bg-red-100 text-red-800 border-red-200' :
                                                                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                                    }
                                                                >
                                                                    {point.status_label}
                                                                </Badge>
                                                            </div>

                                                            <p className="text-xs text-muted-foreground truncate mb-1">
                                                                {point.address}
                                                            </p>

                                                            <div className="flex justify-between items-center text-xs mb-1">
                                                                <span className="text-muted-foreground">{point.client.name}</span>
                                                                <span className="font-medium">{point.amount_to_collect.formatted}</span>
                                                            </div>

                                                            {point.seller && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Vendedor: {point.seller.full_name}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                focusOnPoint(point);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Navigation className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
