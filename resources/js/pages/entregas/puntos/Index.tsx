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
        }
    }, [points, mapInstance.current]);

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

            {/* CSS específico para z-index de modales */}
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
                `
            }} />

            <div className="h-screen flex flex-col">
                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div>
                                <Heading
                                    title="Puntos de Entrega"
                                    description={`${delivery.name} • ${formatDate(delivery.delivery_date)}`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Botones de control de mapa */}
                            <Button
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                variant="outline"
                                className="cursor-pointer"
                            >
                                {isFullScreen ? (
                                    <Minimize2 className="mr-2 h-4 w-4" />
                                ) : (
                                    <Maximize2 className="mr-2 h-4 w-4" />
                                )}
                                {isFullScreen ? 'Panel' : 'Pantalla Completa'}
                            </Button>

                            <Button
                                onClick={() => setCreateModalOpen(true)}
                                className="cursor-pointer"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Punto
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content - Solo Mapa */}
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
                                    <p className="text-sm text-muted-foreground">
                                        {userLocation ? 'Cargando mapa...' : 'Obteniendo ubicación...'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Controles flotantes del mapa */}
                        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
                            <Button
                                onClick={() => {
                                    if (mapInstance.current && userLocation) {
                                        mapInstance.current.setView([userLocation.lat, userLocation.lng], 13);
                                    }
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full cursor-pointer"
                                title="Centrar en mi ubicación"
                            >
                                <LocateFixed className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Panel Lateral */}
                    <div className="w-96 bg-background border-r flex flex-col h-full">

                        {/* Stats Summary */}
                        <div className="flex-shrink-0 p-4 border-b">
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
                        <div className="flex-1 overflow-y-auto p-4">
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
