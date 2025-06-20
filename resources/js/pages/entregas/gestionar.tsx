import { Head } from '@inertiajs/react';
import { Heading, SearchInput, Pagination } from '@/components/molecules';
import { DeliveryModal } from '@/components/organisms/delivery-modal';
import { DeleteConfirmationModal } from '@/components/organisms/delete-confirmation-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { MoreHorizontal, Plus, Edit2, Trash2, Truck, MapPin, Copy, X, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGlobalToast } from '@/hooks/use-global-toast';

interface Zone {
    id: number;
    name: string;
    description: string | null;
}

interface Delivery {
    id: number;
    name: string;
    delivery_date: string;
    template_number: string;
    zone_id: number;
    zone?: Zone;
    status: 'programada' | 'en_progreso' | 'completada' | 'cancelada';
    status_label: string;
    status_color: string;
    can_be_edited: boolean;
    can_be_deleted: boolean;
    total_points: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    deliveries: {
        data: Delivery[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    zones: Zone[];
    availableStatuses: Record<string, string>;
    filters?: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gestión',
        href: '/gestion',
    },
    {
        title: 'Entregas',
        href: '/entregas/gestionar',
    },
];

export default function GestionarEntregas({ deliveries, zones, availableStatuses, filters }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        delivery: Delivery | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        delivery: null,
        isDeleting: false
    });

    const { success, error } = useGlobalToast();

    // Debounce para búsqueda automática
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(window.route('entregas.gestionar'),
                    searchQuery ? { search: searchQuery } : {},
                    {
                        preserveState: true,
                        replace: true,
                    }
                );
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, filters?.search]);

    const openCreateModal = () => {
        setSelectedDelivery(null);
        setIsDuplicating(false);
        setIsModalOpen(true);
    };

    const openEditModal = (delivery: Delivery) => {
        setSelectedDelivery(delivery);
        setIsDuplicating(false);
        setIsModalOpen(true);
    };

    const openDuplicateModal = (delivery: Delivery) => {
        setSelectedDelivery(delivery);
        setIsDuplicating(true);
        setIsModalOpen(true);
    };

    const openDeleteModal = (delivery: Delivery) => {
        setDeleteModal({
            isOpen: true,
            delivery,
            isDeleting: false
        });
    };

    const closeDeleteModal = () => {
        if (!deleteModal.isDeleting) {
            setDeleteModal({
                isOpen: false,
                delivery: null,
                isDeleting: false
            });
        }
    };

    const handleDelete = () => {
        if (!deleteModal.delivery) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));

        router.delete(window.route('entregas.destroy', deleteModal.delivery.id), {
            onSuccess: () => {
                setDeleteModal({
                    isOpen: false,
                    delivery: null,
                    isDeleting: false
                });
            },
            onError: () => {
                setDeleteModal(prev => ({ ...prev, isDeleting: false }));
                error('Error al eliminar', 'No se pudo eliminar la entrega. Inténtalo nuevamente.');
            }
        });
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const getModalTitle = () => {
        if (isDuplicating) return 'Duplicar Entrega';
        return selectedDelivery ? 'Editar Entrega' : 'Registrar Nueva Entrega';
    };



    const handleCancelDelivery = (delivery: Delivery) => {
        router.post(window.route('entregas.cancel', delivery.id), {}, {
            onError: () => {
                error('Error', 'No se pudo cancelar la entrega. Inténtalo nuevamente.');
            }
        });
    };

    const handleReactivateDelivery = (delivery: Delivery) => {
        router.post(window.route('entregas.reactivate', delivery.id), {}, {
            onError: () => {
                error('Error', 'No se pudo reactivar la entrega. Inténtalo nuevamente.');
            }
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestionar Entregas" />

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Heading
                            title="Gestionar Entregas"
                            description="Administra todas las entregas del sistema"
                        />
                    </div>

                    {/* Buscador y Botón Nueva Entrega */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex-1">
                            <SearchInput
                                placeholder="Buscar por nombre o número de plantilla..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onClear={clearSearch}
                            />
                        </div>
                        <Button onClick={openCreateModal} className="hidden sm:flex w-full sm:w-auto cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="sm:inline">Nueva Entrega</span>
                        </Button>
                    </div>
                </div>

                {/* Deliveries Table */}
                <Card className="bg-card dark:bg-card border-border dark:border-border">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            {/* Vista móvil: Cards */}
                            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                                {(deliveries?.data || []).map((delivery) => (
                                    <div key={delivery.id} className="border border-border dark:border-border rounded-lg p-4 bg-card dark:bg-card shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-foreground dark:text-foreground truncate">
                                                    {delivery.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                                    Fecha: {formatDate(delivery.delivery_date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mb-4 space-y-2">
                                            <div>
                                                <span className="text-xs text-muted-foreground dark:text-muted-foreground">Estado:</span>
                                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${delivery.status_color}`}>
                                                    {delivery.status_label}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground dark:text-muted-foreground">Número de Plantilla:</span>
                                                <p className="text-sm text-foreground dark:text-foreground font-mono">
                                                    {delivery.template_number}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground dark:text-muted-foreground">Zona:</span>
                                                <p className="text-sm text-foreground dark:text-foreground">
                                                    {delivery.zone?.name || 'Sin zona'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground dark:text-muted-foreground">Puntos:</span>
                                                <p className="text-sm text-foreground dark:text-foreground">
                                                    {delivery.total_points || 0} puntos
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuItem
                                                        onClick={() => router.visit(window.route('entregas.puntos.index', delivery.id))}
                                                        className="cursor-pointer"
                                                    >
                                                        <MapPin className="mr-2 h-4 w-4" />
                                                        Ver puntos
                                                    </DropdownMenuItem>



                                                    {delivery.can_be_edited && (
                                                        <DropdownMenuItem
                                                            onClick={() => openEditModal(delivery)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuItem
                                                        onClick={() => openDuplicateModal(delivery)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Duplicar
                                                    </DropdownMenuItem>

                                                    {delivery.status === 'programada' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleCancelDelivery(delivery)}
                                                            className="cursor-pointer text-destructive focus:text-destructive"
                                                        >
                                                            <X className="mr-2 h-4 w-4" />
                                                            Cancelar
                                                        </DropdownMenuItem>
                                                    )}

                                                    {delivery.status === 'cancelada' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleReactivateDelivery(delivery)}
                                                            className="cursor-pointer"
                                                        >
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                            Reactivar
                                                        </DropdownMenuItem>
                                                    )}

                                                    {delivery.can_be_deleted && (
                                                        <DropdownMenuItem
                                                            onClick={() => openDeleteModal(delivery)}
                                                            className="cursor-pointer text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Vista desktop: Tabla */}
                            <Table className="hidden md:table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-6 py-3">Nombre</TableHead>
                                        <TableHead className="px-6 py-3">Estado</TableHead>
                                        <TableHead className="px-6 py-3">Fecha</TableHead>
                                        <TableHead className="px-6 py-3">Número de Plantilla</TableHead>
                                        <TableHead className="px-6 py-3">Zona</TableHead>
                                        <TableHead className="px-6 py-3">Puntos</TableHead>
                                        <TableHead className="px-6 py-3 w-[80px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(deliveries?.data || []).map((delivery) => (
                                        <TableRow key={delivery.id} className="hover:bg-muted/50">
                                            <TableCell className="px-6 py-4">
                                                <div className="font-medium">
                                                    {delivery.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${delivery.status_color}`}>
                                                    {delivery.status_label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm">
                                                    {formatDate(delivery.delivery_date)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm font-mono">
                                                    {delivery.template_number}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm">
                                                    {delivery.zone?.name || (
                                                        <span className="text-muted-foreground italic">Sin zona</span>
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm">
                                                    {delivery.total_points || 0} puntos
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuItem
                                                            onClick={() => router.visit(window.route('entregas.puntos.index', delivery.id))}
                                                            className="cursor-pointer"
                                                        >
                                                            <MapPin className="mr-2 h-4 w-4" />
                                                            Ver puntos
                                                        </DropdownMenuItem>



                                                        {delivery.can_be_edited && (
                                                            <DropdownMenuItem
                                                                onClick={() => openEditModal(delivery)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit2 className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuItem
                                                            onClick={() => openDuplicateModal(delivery)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Duplicar
                                                        </DropdownMenuItem>

                                                        {delivery.status === 'programada' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleCancelDelivery(delivery)}
                                                                className="cursor-pointer text-destructive focus:text-destructive"
                                                            >
                                                                <X className="mr-2 h-4 w-4" />
                                                                Cancelar
                                                            </DropdownMenuItem>
                                                        )}

                                                        {delivery.status === 'cancelada' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleReactivateDelivery(delivery)}
                                                                className="cursor-pointer"
                                                            >
                                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                                Reactivar
                                                            </DropdownMenuItem>
                                                        )}

                                                        {delivery.can_be_deleted && (
                                                            <DropdownMenuItem
                                                                onClick={() => openDeleteModal(delivery)}
                                                                className="cursor-pointer text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {(deliveries?.data?.length === 0 || !deliveries?.data) && (
                            <div className="text-center py-12">
                                <Truck className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold text-foreground dark:text-foreground">
                                    {filters?.search ? 'No se encontraron entregas' : 'No hay entregas registradas'}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                                    {filters?.search
                                        ? 'Intenta cambiar los criterios de búsqueda.'
                                        : 'Comienza registrando tu primera entrega.'
                                    }
                                </p>
                                {filters?.search && (
                                    <Button
                                        variant="outline"
                                        className="mt-4 cursor-pointer"
                                        onClick={() => {
                                            setSearchQuery('');
                                        }}
                                    >
                                        Ver todas las entregas
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Paginación dentro del mismo card */}
                        {(deliveries?.links && deliveries.links.length > 3) && (
                            <div className="border-t">
                                <Pagination
                                    users={deliveries}
                                    noCard={true}
                                    showInfo={true}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Botón flotante para móviles */}
            <Button
                onClick={openCreateModal}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden cursor-pointer bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                size="icon"
            >
                <Plus className="h-6 w-6 text-primary-foreground dark:text-primary-foreground" />
            </Button>

            {/* Modales */}
            <DeliveryModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsDuplicating(false);
                }}
                delivery={selectedDelivery}
                zones={zones}
                availableStatuses={availableStatuses}
                title={getModalTitle()}
                isDuplicating={isDuplicating}
                onSuccess={(message) => message && success('¡Éxito!', message)}
                onError={(message) => error('Error', message)}
            />

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={deleteModal.delivery?.name}
                isDeleting={deleteModal.isDeleting}
            />
        </AppLayout>
    );
}
