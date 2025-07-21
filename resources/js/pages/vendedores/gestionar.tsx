import { Head } from '@inertiajs/react';
import { Heading, SearchInput, Pagination } from '@/components/molecules';
import { SellerModal } from '@/components/organisms/seller-modal';
import { DeleteConfirmationModal } from '@/components/organisms/delete-confirmation-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { MoreHorizontal, Plus, Edit2, ToggleLeft, ToggleRight, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGlobalToast } from '@/hooks/use-global-toast';

interface Seller {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    dni: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

interface Props {
    sellers: {
        data: Seller[];
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
        title: 'Vendedores',
        href: '/vendedores/gestionar',
    },
];

export default function GestionarVendedores({ sellers, filters }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        seller: Seller | null;
        isChanging: boolean;
    }>({
        isOpen: false,
        seller: null,
        isChanging: false
    });

    const { success, error } = useGlobalToast();

    // Debounce para búsqueda automática
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(window.route('vendedores.gestionar'),
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
        setSelectedSeller(null);
        setIsModalOpen(true);
    };

    const openEditModal = (seller: Seller) => {
        setSelectedSeller(seller);
        setIsModalOpen(true);
    };

    const openStatusModal = (seller: Seller) => {
        setStatusModal({
            isOpen: true,
            seller,
            isChanging: false
        });
    };

    const closeStatusModal = () => {
        if (!statusModal.isChanging) {
            setStatusModal({
                isOpen: false,
                seller: null,
                isChanging: false
            });
        }
    };

    const handleStatusChange = () => {
        if (!statusModal.seller) return;

        setStatusModal(prev => ({ ...prev, isChanging: true }));

        const newStatus = statusModal.seller.status === 'active' ? 'inactive' : 'active';

        router.patch(window.route('vendedores.update-status', statusModal.seller.id), {
            status: newStatus
        }, {
            onSuccess: () => {
                setStatusModal({
                    isOpen: false,
                    seller: null,
                    isChanging: false
                });
                // El mensaje flash se maneja automáticamente por GlobalToastManager
            },
            onError: () => {
                setStatusModal(prev => ({ ...prev, isChanging: false }));
                error('Error al cambiar estado', 'No se pudo cambiar el estado del vendedor. Inténtalo nuevamente.');
            }
        });
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const getModalTitle = () => {
        return selectedSeller ? 'Editar Vendedor' : 'Registrar Nuevo Vendedor';
    };

    const getStatusBadge = (status: 'active' | 'inactive') => {
        return status === 'active' ? (
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                Activo
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
                Inactivo
            </Badge>
        );
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
            <Head title="Gestionar Vendedores" />

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Heading
                            title="Gestionar Vendedores"
                            description="Administra todos los vendedores del sistema"
                        />
                    </div>

                    {/* Buscador y Botón Nuevo Vendedor */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex-1">
                            <SearchInput
                                placeholder="Buscar por nombres, apellidos, teléfono o DNI..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onClear={clearSearch}
                            />
                        </div>
                        <Button onClick={openCreateModal} className="hidden sm:flex w-full sm:w-auto cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="sm:inline">Nuevo Vendedor</span>
                        </Button>
                    </div>
                </div>

                {/* Sellers Table */}
                <Card className="bg-card dark:bg-card border-border dark:border-border">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            {/* Vista móvil: Cards */}
                            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                                {(sellers?.data || []).map((seller) => (
                                    <div key={seller.id} className="border border-border dark:border-border rounded-lg p-4 bg-card dark:bg-card shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-foreground dark:text-foreground truncate">
                                                    {`${seller.first_name} ${seller.last_name}`}
                                                </h3>
                                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                                    Teléfono: {seller.phone}
                                                </p>
                                                {seller.dni && (
                                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                                        DNI: {seller.dni}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="ml-2">
                                                {getStatusBadge(seller.status)}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <span className="text-xs text-muted-foreground dark:text-muted-foreground">Registrado:</span>
                                            <p className="text-sm text-foreground dark:text-foreground">
                                                {formatDate(seller.created_at)}
                                            </p>
                                        </div>

                                        <div className="flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[180px]">
                                                    <DropdownMenuItem
                                                        onClick={() => openEditModal(seller)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openStatusModal(seller)}
                                                        className="cursor-pointer"
                                                    >
                                                        {seller.status === 'active' ? (
                                                            <>
                                                                <ToggleLeft className="mr-2 h-4 w-4" />
                                                                Desactivar
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ToggleRight className="mr-2 h-4 w-4" />
                                                                Activar
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
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
                                        <TableHead className="px-6 py-3">Nombre Completo</TableHead>
                                        <TableHead className="px-6 py-3">Teléfono</TableHead>
                                        <TableHead className="px-6 py-3">DNI</TableHead>
                                        <TableHead className="px-6 py-3">Estado</TableHead>
                                        <TableHead className="px-6 py-3">Fecha de Registro</TableHead>
                                        <TableHead className="px-6 py-3 w-[80px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(sellers?.data || []).map((seller) => (
                                        <TableRow key={seller.id} className="hover:bg-muted/50">
                                            <TableCell className="px-6 py-4">
                                                <div className="font-medium">
                                                    {`${seller.first_name} ${seller.last_name}`}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                                    {seller.phone}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="text-sm">
                                                    {seller.dni ? (
                                                        <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">{seller.dni}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Sin DNI</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                {getStatusBadge(seller.status)}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(seller.created_at)}
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
                                                    <DropdownMenuContent align="end" className="w-[180px]">
                                                        <DropdownMenuItem
                                                            onClick={() => openEditModal(seller)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openStatusModal(seller)}
                                                            className="cursor-pointer"
                                                        >
                                                            {seller.status === 'active' ? (
                                                                <>
                                                                    <ToggleLeft className="mr-2 h-4 w-4" />
                                                                    Desactivar
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ToggleRight className="mr-2 h-4 w-4" />
                                                                    Activar
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {(sellers?.data?.length === 0 || !sellers?.data) && (
                            <div className="text-center py-12">
                                <User className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold text-foreground dark:text-foreground">
                                    {filters?.search ? 'No se encontraron vendedores' : 'No hay vendedores registrados'}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                                    {filters?.search
                                        ? 'Intenta cambiar los criterios de búsqueda.'
                                        : 'Comienza registrando tu primer vendedor.'
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
                                        Ver todos los vendedores
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Paginación dentro del mismo card */}
                        {(sellers?.links && sellers.links.length > 3) && (
                            <div className="border-t">
                                <Pagination
                                    users={sellers}
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
            <SellerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                seller={selectedSeller}
                title={getModalTitle()}
                onSuccess={(message) => message && success('¡Éxito!', message)}
                onError={(message) => error('Error', message)}
            />

            <DeleteConfirmationModal
                isOpen={statusModal.isOpen}
                onClose={closeStatusModal}
                onConfirm={handleStatusChange}
                itemName={statusModal.seller ? `${statusModal.seller.first_name} ${statusModal.seller.last_name}` : undefined}
                isDeleting={statusModal.isChanging}
                title={statusModal.seller ? (statusModal.seller.status === 'active' ? 'Desactivar Vendedor' : 'Activar Vendedor') : 'Cambiar Estado'}
                message={statusModal.seller ? (statusModal.seller.status === 'active' ? '¿Estás seguro de que quieres desactivar este vendedor?' : '¿Estás seguro de que quieres activar este vendedor?') : 'Confirma el cambio de estado'}
                confirmText={statusModal.seller ? (statusModal.seller.status === 'active' ? 'Desactivar' : 'Activar') : 'Cambiar Estado'}
                loadingText={statusModal.seller ? (statusModal.seller.status === 'active' ? 'Desactivando...' : 'Activando...') : 'Cambiando estado...'}
            />
        </AppLayout>
    );
}
