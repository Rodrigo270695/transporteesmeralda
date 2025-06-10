import { Head } from '@inertiajs/react';
import { Heading } from '@/components/molecules';
import { DeliveryStatsGrid, DeliveryFiltersBar } from '@/components/molecules';
import { DeliveryPointsTable, DeleteConfirmationModal } from '@/components/organisms';
import DeliveryPointModal from '@/components/organisms/DeliveryPointModal';
import ViewDeliveryPointModal from '@/components/organisms/ViewDeliveryPointModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Plus,
    MapPin,
    Navigation,
    Maximize2,
    Minimize2,
    LocateFixed
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useGlobalToast } from '@/hooks/use-global-toast';
import DraggablePointsList from '@/components/molecules/DraggablePointsList';
import {
    type DeliveryPoint,
    type Delivery,
    type User,
    type Seller,
    type Mobility,
    type PaymentMethod,
} from '@/types/delivery-points';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
}

// Extender tipo global de Window para Leaflet
declare global {
    interface Window {
        L: any;
    }
}

export default function GestionarPuntosEntrega({
    delivery,
    filters,
    clients,
    sellers,
    mobilities
}: Props) {
    const [points, setPoints] = useState<DeliveryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [priorityFilter, setPriorityFilter] = useState(filters?.priority || '');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState<DeliveryPoint | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [clickedCoordinates, setClickedCoordinates] = useState<{lat: number, lng: number} | null>(null);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        point: DeliveryPoint | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        point: null,
        isDeleting: false
    });
    const [showRoutes, setShowRoutes] = useState(true);
    const [loadingRoutes, setLoadingRoutes] = useState(false);
    const [showLegend, setShowLegend] = useState(true);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const routeLineRef = useRef<any>(null);
    const routeLinesRef = useRef<any[]>([]); // Para múltiples segmentos de ruta

    const { success, error } = useGlobalToast();

    // Función para obtener ruta entre dos puntos usando OSRM
    const getRouteCoordinates = async (startPoint: {lat: number, lng: number}, endPoint: {lat: number, lng: number}) => {
        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}?overview=full&geometries=geojson`
            );

            if (!response.ok) {
                throw new Error('Error al obtener la ruta');
            }

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                // Convertir coordenadas de [lng, lat] a [lat, lng] para Leaflet
                return data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
            }

            return null;
        } catch (error) {
            console.warn('Error obteniendo ruta:', error);
            return null;
        }
    };

    // Función para dibujar rutas reales entre los puntos
    const drawRealRoutes = async (sortedPoints: DeliveryPoint[]) => {
        if (sortedPoints.length < 2 || !showRoutes) return;

        setLoadingRoutes(true);

        // Agregar la ubicación actual como punto de inicio si existe
        let routePoints = sortedPoints;
        if (userLocation) {
            // Crear punto virtual para la ubicación actual
            const currentLocationPoint = {
                coordinates: { latitude: userLocation.lat, longitude: userLocation.lng },
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

                // Obtener ruta real entre los puntos
                const routeCoordinates = await getRouteCoordinates(startCoords, endCoords);

                if (routeCoordinates) {
                    // Dibujar segmento de ruta
                    const routeLine = window.L.polyline(routeCoordinates, {
                        color: i === 0 && userLocation ? '#10b981' : '#6366f1', // Verde para la primera ruta desde ubicación actual
                        weight: 4,
                        opacity: 0.8,
                        dashArray: i === 0 && userLocation ? '5, 5' : undefined // Línea punteada para la ruta desde ubicación actual
                    }).addTo(mapInstance.current);

                    // Agregar popup con información del segmento
                    const segmentInfo = userLocation && i === 0
                        ? `Ruta desde tu ubicación → ${nextPoint.point_name || `Punto ${nextPoint.route_order}`}`
                        : `Ruta: ${currentPoint.point_name || `Punto ${currentPoint.route_order}`} → ${nextPoint.point_name || `Punto ${nextPoint.route_order}`}`;

                    routeLine.bindPopup(`
                        <div class="text-sm">
                            <strong>${segmentInfo}</strong>
                        </div>
                    `);

                    routeLinesRef.current.push(routeLine);
                } else {
                    // Si no se puede obtener la ruta, dibujar línea recta como fallback
                    const fallbackLine = window.L.polyline([
                        [startCoords.lat, startCoords.lng],
                        [endCoords.lat, endCoords.lng]
                    ], {
                        color: '#ef4444',
                        weight: 2,
                        opacity: 0.6,
                        dashArray: '10, 10'
                    }).addTo(mapInstance.current);

                    fallbackLine.bindPopup(`
                        <div class="text-sm">
                            <strong>Ruta no disponible</strong><br>
                            <span class="text-red-600">Línea recta aproximada</span>
                        </div>
                    `);

                    routeLinesRef.current.push(fallbackLine);
                }

                // Pequeña pausa para no sobrecargar la API
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        setLoadingRoutes(false);
    };

    // Función para alternar la visualización de rutas
    const toggleRoutes = () => {
        if (showRoutes) {
            // Ocultar rutas
            routeLinesRef.current.forEach(line => {
                mapInstance.current.removeLayer(line);
            });
            routeLinesRef.current = [];
        }
        setShowRoutes(!showRoutes);
    };

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
    ];

    // Obtener ubicación del usuario
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log('Error getting location:', error);
                    // Ubicación por defecto: Maracaibo, Venezuela
                    setUserLocation({ lat: 10.6666, lng: -71.6167 });
                }
            );
        } else {
            // Ubicación por defecto: Maracaibo, Venezuela
            setUserLocation({ lat: 10.6666, lng: -71.6167 });
        }
    }, []);

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

        // Siempre cargar Leaflet para la vista de mapa
        loadLeaflet();
    }, []);

    // Inicializar mapa
    useEffect(() => {
        if (mapLoaded && mapRef.current && !mapInstance.current && userLocation) {
            mapInstance.current = window.L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 13);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstance.current);

            // Agregar marcador de ubicación actual
            window.L.marker([userLocation.lat, userLocation.lng], {
                icon: window.L.divIcon({
                    html: '<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #3b82f6;"></div>',
                    className: 'current-location-marker',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            }).addTo(mapInstance.current).bindPopup('Tu ubicación actual');

            // Agregar event listener para click en el mapa
            mapInstance.current.on('click', (e: any) => {
                setClickedCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
                setCreateModalOpen(true);
            });
        }
    }, [mapLoaded, userLocation]);

    // Actualizar marcadores en el mapa
    useEffect(() => {
        if (mapInstance.current && points.length > 0) {
            // Limpiar marcadores existentes
            markersRef.current.forEach(marker => {
                mapInstance.current.removeLayer(marker);
            });
            markersRef.current = [];

            // Limpiar funciones globales anteriores
            points.forEach(point => {
                if ((window as any)[`viewPoint${point.id}`]) {
                    delete (window as any)[`viewPoint${point.id}`];
                }
            });

            // Limpiar líneas de ruta existentes
            if (routeLineRef.current) {
                mapInstance.current.removeLayer(routeLineRef.current);
                routeLineRef.current = null;
            }
            routeLinesRef.current.forEach(line => {
                mapInstance.current.removeLayer(line);
            });
            routeLinesRef.current = [];

            const validPoints = points.filter(p => p.coordinates?.latitude && p.coordinates?.longitude);

            // Definir colores por status
            const getStatusColor = (status: string) => {
                switch (status) {
                    case 'entregado': return '#10b981';    // Verde
                    case 'en_ruta': return '#3b82f6';      // Azul
                    case 'cancelado': return '#ef4444';    // Rojo
                    case 'reagendado': return '#8b5cf6';   // Púrpura
                    case 'pendiente':
                    default: return '#f59e0b';             // Amarillo/Naranja
                }
            };

            // Agregar nuevos marcadores
            validPoints.forEach((point, index) => {
                const color = getStatusColor(point.status);

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

                // Popup detallado con botón de editar
                marker.bindPopup(`
                    <div class="text-sm min-w-[250px] max-w-[300px]">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-bold text-base">${point.route_order}. ${point.point_name}</h3>
                            <button
                                onclick="window.viewPoint${point.id}()"
                                class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                title="Ver detalles"
                            >
                                👁️ Ver
                            </button>
                        </div>
                        <p class="text-gray-600 mb-3 text-xs">${point.address}</p>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-xs">Cliente:</span>
                                <span class="font-medium text-xs">${point.client.name}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-xs">Vendedor:</span>
                                <span class="font-medium text-xs">${point.seller?.name || 'No asignado'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-xs">Monto:</span>
                                <span class="font-bold text-xs text-green-600">${point.amount_to_collect.formatted}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-500 text-xs">Estado:</span>
                                <span class="px-2 py-1 rounded text-xs ${
                                    point.status === 'entregado' ? 'bg-green-100 text-green-800' :
                                    point.status === 'en_ruta' ? 'bg-blue-100 text-blue-800' :
                                    point.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }">${point.status_label}</span>
                            </div>
                            ${point.estimated_delivery_time ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-500 text-xs">Hora estimada:</span>
                                    <span class="font-medium text-xs">${point.estimated_delivery_time}</span>
                                </div>
                            ` : ''}
                            ${point.reference ? `
                                <div class="mt-2 pt-2 border-t">
                                    <span class="text-gray-500 text-xs">Referencia:</span>
                                    <p class="text-xs mt-1">${point.reference}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `, {
                    maxWidth: 300,
                    closeButton: true,
                    autoPan: true
                });

                // Crear función global para ver este punto específico
                (window as any)[`viewPoint${point.id}`] = () => {
                    setSelectedPoint(point);
                    setViewModalOpen(true);
                };

                // Tooltip rápido en hover
                marker.bindTooltip(`
                    <div class="text-xs">
                        <strong>${point.route_order}. ${point.point_name}</strong><br/>
                        ${point.client.name}<br/>
                        <span class="text-green-600 font-semibold">${point.amount_to_collect.formatted}</span>
                    </div>
                `, {
                    direction: 'top',
                    offset: [0, -10],
                    opacity: 0.9,
                    className: 'custom-tooltip'
                });

                // Agregar marcador con número del punto
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

                marker.on('click', () => {
                    setSelectedPoint(point);
                    setViewModalOpen(true);
                });

                markersRef.current.push(marker);
                markersRef.current.push(numberMarker);
            });

            // Dibujar rutas reales por las calles entre los puntos
            if (validPoints.length > 0) {
                const sortedPoints = validPoints.sort((a, b) => a.route_order - b.route_order);
                drawRealRoutes(sortedPoints);
            }
        }
    }, [points, mapInstance.current]);

    // Efecto para redibujar rutas cuando se activa la opción
    useEffect(() => {
        if (showRoutes && mapInstance.current && points.length > 0) {
            const validPoints = points.filter(p => p.coordinates?.latitude && p.coordinates?.longitude);
            if (validPoints.length > 0) {
                const sortedPoints = validPoints.sort((a, b) => a.route_order - b.route_order);
                drawRealRoutes(sortedPoints);
            }
        }
    }, [showRoutes]);

    // Efecto para redimensionar el mapa cuando cambia el modo pantalla completa
    useEffect(() => {
        if (mapInstance.current) {
            // Pequeño delay para que el DOM se actualice antes de redimensionar
            setTimeout(() => {
                mapInstance.current.invalidateSize();
            }, 100);
        }
    }, [isFullScreen]);

    // Cargar puntos de entrega
    const loadPoints = async () => {
        try {
            setLoading(true);
            const url = new URL(route('entregas.puntos.index', delivery.id));
            if (searchQuery) url.searchParams.set('search', searchQuery);
            if (statusFilter) url.searchParams.set('status', statusFilter);
            if (priorityFilter) url.searchParams.set('priority', priorityFilter);

            const response = await fetch(url.toString(), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPoints(data.data || []);
            }
        } catch {
            error('Error', 'No se pudieron cargar los puntos de entrega');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadPoints();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, statusFilter, priorityFilter]);

    const handleDelete = (point: DeliveryPoint) => {
        setDeleteModal({ isOpen: true, point, isDeleting: false });
    };

    const confirmDelete = async () => {
        if (!deleteModal.point) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));

        try {
            const response = await fetch(
                route('entregas.puntos.destroy', [delivery.id, deleteModal.point.id]),
                {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                }
            );

            if (response.ok) {
                setDeleteModal({ isOpen: false, point: null, isDeleting: false });
                success('¡Éxito!', 'Punto de entrega eliminado exitosamente');
                loadPoints();
            } else {
                throw new Error('Error al eliminar');
            }
        } catch {
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
            error('Error al eliminar', 'No se pudo eliminar el punto de entrega. Inténtalo nuevamente.');
        }
    };

    const closeDeleteModal = () => {
        if (!deleteModal.isDeleting) {
            setDeleteModal({ isOpen: false, point: null, isDeleting: false });
        }
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setPriorityFilter('');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Estadísticas calculadas
    const stats = {
        total: points.length,
        entregados: points.filter(p => p.status === 'entregado').length,
        enRuta: points.filter(p => p.status === 'en_ruta').length,
        pendientes: points.filter(p => p.status === 'pendiente').length,
        cancelados: points.filter(p => p.status === 'cancelado').length,
        reagendados: points.filter(p => p.status === 'reagendado').length,
        totalAmountToCollect: points.reduce((sum, point) => {
            let amount = 0;
            if (point.amount_to_collect?.amount) {
                // Convertir a número (maneja tanto string como number)
                amount = Number(point.amount_to_collect.amount) || 0;
            }
            return sum + amount;
        }, 0),
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Puntos de Entrega - ${delivery.name}`} />

            {/* CSS específico para z-index de modales y controles del mapa */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    /* Asegurar que todos los modales aparezcan encima del mapa */
                    [data-radix-dialog-overlay] {
                        z-index: 10000 !important;
                    }
                    [data-radix-dialog-content] {
                        z-index: 10001 !important;
                    }
                    /* Específico para Select dentro de modales */
                    [data-radix-select-content] {
                        z-index: 10002 !important;
                    }
                    /* Controles y leyenda del mapa - por encima de Leaflet */
                    .map-legend {
                        z-index: 9999 !important;
                        position: absolute !important;
                    }
                    .map-controls {
                        z-index: 9999 !important;
                        position: absolute !important;
                    }
                    /* Asegurar que el contenedor del mapa tenga z-index bajo */
                    .leaflet-container {
                        z-index: 1 !important;
                    }
                    .leaflet-control-container {
                        z-index: 100 !important;
                    }
                    /* Forzar todos los elementos del mapa a estar por debajo */
                    .leaflet-pane {
                        z-index: 1 !important;
                    }
                    .leaflet-map-pane {
                        z-index: 1 !important;
                    }
                `
            }} />

            <div className="h-screen flex flex-col">
                {/* Header */}
                <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                                <Heading
                                    title="Puntos de Entrega"
                                    description={`${delivery.name} • ${formatDate(delivery.delivery_date)}`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {/* Botón móvil para mostrar sidebar */}
                            <Button
                                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                                variant="outline"
                                size="sm"
                                className="md:hidden cursor-pointer"
                            >
                                <MapPin className="h-4 w-4" />
                            </Button>

                            {/* Botones de control - ocultos en móvil */}
                            <Button
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                variant="outline"
                                size="sm"
                                className="hidden sm:flex cursor-pointer"
                            >
                                {isFullScreen ? (
                                    <Minimize2 className="mr-1 sm:mr-2 h-4 w-4" />
                                ) : (
                                    <Maximize2 className="mr-1 sm:mr-2 h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">
                                    {isFullScreen ? 'Panel' : 'Pantalla Completa'}
                                </span>
                            </Button>

                            <Button
                                onClick={() => setCreateModalOpen(true)}
                                size="sm"
                                className="cursor-pointer"
                            >
                                <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Agregar Punto</span>
                                <span className="sm:hidden">Agregar</span>
                            </Button>
                        </div>
                    </div>
                </div>

                                {/* Overlay para cerrar sidebar en móvil */}
                {showMobileSidebar && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                        onClick={() => setShowMobileSidebar(false)}
                    />
                )}

                {/* Main Content - Responsive */}
                <div className="flex-1 flex overflow-hidden relative min-h-0">
                    {/* Mapa */}
                    <div className={`relative ${isFullScreen ? 'w-full' : 'flex-1 md:flex-1'} ${showMobileSidebar ? 'hidden md:block' : 'block'}`}>
                        <div
                            ref={mapRef}
                            className="w-full h-full"
                            style={{ minHeight: '500px' }}
                        />

                        {!mapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                    <p className="text-sm text-muted-foreground">
                                        {userLocation ? 'Cargando mapa...' : 'Obteniendo ubicación...'}
                                    </p>
                                </div>
                            </div>
                        )}

                                                                                                {/* Control de leyenda - Solo desktop */}
                        <div
                            className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 map-controls hidden md:block"
                            style={{ zIndex: 9999 }}
                        >
                            <Button
                                onClick={() => setShowLegend(!showLegend)}
                                variant={showLegend ? "default" : "outline"}
                                size="sm"
                                className="cursor-pointer"
                                title={showLegend ? "Ocultar leyenda" : "Mostrar leyenda"}
                            >
                                <MapPin className="h-4 w-4" />
                            </Button>
                        </div>

                                                {/* Panel de información en pantalla completa */}
                        {isFullScreen && (
                            <div
                                className="absolute bottom-4 left-4 right-4 md:right-auto bg-white rounded-lg shadow-lg p-3 md:p-4 max-w-full md:max-w-sm map-controls"
                                style={{ zIndex: 9999 }}
                            >
                                <div className="text-sm">
                                    <div className="font-semibold mb-2 text-xs md:text-sm">{delivery.name}</div>
                                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Total:</span>
                                            <span className="font-medium ml-1">{stats.total} puntos</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Entregados:</span>
                                            <span className="font-medium ml-1 text-green-600">{stats.entregados}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">En ruta:</span>
                                            <span className="font-medium ml-1 text-blue-600">{stats.enRuta}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Pendientes:</span>
                                            <span className="font-medium ml-1 text-yellow-600">{stats.pendientes}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t">
                                        <span className="text-muted-foreground">Total a cobrar:</span>
                                        <span className="font-medium ml-1">S/ {stats.totalAmountToCollect.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                                                {/* Leyenda de Estados - Responsive */}
                        {showLegend && (
                            <div
                                className="absolute top-4 left-4 md:top-20 md:left-4 bg-white rounded-lg shadow-lg p-2 md:p-3 max-w-xs md:max-w-sm border map-legend"
                                style={{ zIndex: 9999 }}
                            >
                                <div className="flex items-center justify-between mb-1 md:mb-2">
                                    <h4 className="text-xs md:text-sm font-semibold">Estado de Puntos</h4>
                                    <Button
                                        onClick={() => setShowLegend(false)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 md:h-6 md:w-6 p-0 text-gray-400 hover:text-gray-600"
                                    >
                                        ×
                                    </Button>
                                </div>
                                <div className="space-y-1 md:space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                                                                <div
                                            className="w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: '#10b981' }}
                                        ></div>
                                        <span>Entregado</span>
                                        <span className="text-muted-foreground">({stats.entregados})</span>
                                    </div>
                                                                        <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: '#3b82f6' }}
                                        ></div>
                                        <span>En Ruta</span>
                                        <span className="text-muted-foreground">({stats.enRuta})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: '#f59e0b' }}
                                        ></div>
                                        <span>Pendiente</span>
                                        <span className="text-muted-foreground">({stats.pendientes})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: '#ef4444' }}
                                        ></div>
                                        <span>Cancelado</span>
                                        <span className="text-muted-foreground">({stats.cancelados})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: '#8b5cf6' }}
                                        ></div>
                                        <span>Reagendado</span>
                                        <span className="text-muted-foreground">({stats.reagendados})</span>
                                    </div>
                                </div>
                                <div className="mt-1 md:mt-2 pt-1 md:pt-2 border-t text-xs text-center">
                                    <span className="text-muted-foreground">Total: </span>
                                    <span className="font-semibold">{stats.total} puntos</span>
                                </div>
                            </div>
                        )}


                    </div>

                                        {/* Panel Lateral - Responsive */}
                    {!isFullScreen && (
                        <div className={`
                            ${showMobileSidebar ? 'block' : 'hidden'}
                            md:block
                            w-full md:w-96
                            bg-background
                            border-r
                            flex flex-col
                            h-full md:h-full
                            absolute md:relative
                            top-0 left-0
                            z-40 md:z-auto
                            max-h-screen md:max-h-none
                        `}>

                        {/* Header móvil para cerrar sidebar */}
                        <div className="md:hidden flex items-center justify-between p-4 border-b bg-white">
                            <h3 className="text-lg font-semibold">Puntos de Entrega</h3>
                            <Button
                                onClick={() => setShowMobileSidebar(false)}
                                variant="ghost"
                                size="sm"
                                className="p-2"
                            >
                                ×
                            </Button>
                        </div>

                        {/* Stats Summary */}
                        <div className="flex-shrink-0 p-3 md:p-4 border-b bg-white">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <Card>
                                    <div className="p-3 text-center">
                                        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                                        <div className="text-sm text-muted-foreground">Total Puntos</div>
                                    </div>
                                </Card>
                                <Card>
                                    <div className="p-3 text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {stats.total > 0 ? Math.round((stats.entregados / stats.total) * 100) : 0}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">Completado</div>
                                    </div>
                                </Card>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Total a cobrar:</span>
                                    <span className="font-medium">S/ {stats.totalAmountToCollect.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Points List */}
                        <div className="overflow-y-auto p-3 md:p-4" style={{ height: 'calc(100vh - 280px)' }}>
                            <DraggablePointsList
                                points={points}
                                onReorder={async (reorderedPoints) => {
                                    try {
                                        // Actualizar estado local inmediatamente para mejor UX
                                        setPoints(reorderedPoints);

                                        // Preparar datos para envío al backend
                                        const pointsData = reorderedPoints.map(point => ({
                                            id: point.id,
                                            router_order: point.route_order
                                        }));

                                        // Llamar al backend para persistir los cambios
                                        const response = await fetch(route('entregas.puntos.update-order', delivery.id), {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                            },
                                            body: JSON.stringify({
                                                points: pointsData
                                            })
                                        });

                                        if (response.ok) {
                                            const data = await response.json();
                                            success('Orden actualizado', 'El orden de los puntos se ha guardado correctamente');
                                            // Opcional: actualizar con datos del servidor
                                            // setPoints(data.points);
                                        } else {
                                            throw new Error('Error al actualizar el orden');
                                        }
                                    } catch (err) {
                                        console.error('Error updating order:', err);
                                        // Revertir cambios en caso de error
                                        loadPoints();
                                        error('Error', 'No se pudo guardar el nuevo orden de los puntos');
                                    }
                                }}
                                onView={(point) => {
                                    setSelectedPoint(point);
                                    setViewModalOpen(true);
                                }}
                                onDelete={(point) => {
                                    setSelectedPoint(point);
                                    setDeleteModal({
                                        isOpen: true,
                                        point: point,
                                        isDeleting: false
                                    });
                                }}
                                onLocate={(point) => {
                                    // Función para localizar en mapa - centrar vista en el punto
                                    if (mapInstance.current && point.coordinates?.latitude && point.coordinates?.longitude) {
                                        // Centrar el mapa en el punto con zoom alto
                                        mapInstance.current.setView([point.coordinates.latitude, point.coordinates.longitude], 18);

                                        // Seleccionar el punto
                                        setSelectedPoint(point);

                                        // Buscar el marcador del punto y abrir su popup
                                        if (markersRef.current[point.id]) {
                                            markersRef.current[point.id].openPopup();
                                        }

                                    } else {
                                        console.warn('No se puede localizar el punto:', point.point_name, 'Coordenadas:', point.coordinates);
                                    }
                                }}
                            />
                        </div>
                    </div>
                    )}
                </div>
            </div>

            {/* Modales */}
            {/* Modal de creación */}
            <DeliveryPointModal
                isOpen={createModalOpen}
                onClose={() => {
                    setCreateModalOpen(false);
                    setClickedCoordinates(null);
                }}
                deliveryId={delivery.id}
                clients={clients}
                sellers={sellers}
                mobilities={mobilities}
                initialCoordinates={clickedCoordinates || undefined}
                onSuccess={(newPoint) => {
                    loadPoints();
                    success('¡Punto creado!', 'El punto se agregó correctamente a la entrega');
                }}
            />

            {/* Modal de vista de detalles */}
            <ViewDeliveryPointModal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                point={selectedPoint}
            />

            {/* Modal de eliminación */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                isDeleting={deleteModal.isDeleting}
                title="Eliminar Punto de Entrega"
            />
        </AppLayout>
    );
}
