import { Head } from '@inertiajs/react';
import { Heading, SearchInput, Pagination } from '@/components/molecules';
import { MobilityModal } from '@/components/modals/movilidad';
import { DeleteConfirmationModal } from '@/components/organisms/delete-confirmation-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { MoreHorizontal, Plus, Edit2, Trash2, Eye, Car } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGlobalToast } from '@/hooks/use-global-toast';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Mobility {
    id: number;
    name: string;
    plate: string;
    conductor_user_id: number;
    conductor: User;
    liquidator?: any;
    soat?: any;
    technical_review?: any;
    permit?: any;
    fire_extinguisher?: any;
    created_at: string;
    updated_at: string;
}

interface Props {
    mobilities: {
        data: Mobility[];
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
    conductors: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transportes',
        href: '/transportes',
    },
    {
        title: 'Movilidad',
        href: '/movilidad/gestionar',
    },
];

export default function GestionarMovilidad({ mobilities, filters, conductors }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMobility, setSelectedMobility] = useState<Mobility | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        mobility: Mobility | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        mobility: null,
        isDeleting: false
    });

    const { success, error } = useGlobalToast();

        // Debounce para búsqueda automática
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(window.route('movilidad.gestionar'),
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
        setSelectedMobility(null);
        setIsModalOpen(true);
    };

    const openEditModal = (mobility: Mobility) => {
        setSelectedMobility(mobility);
        setIsModalOpen(true);
    };

    const openDeleteModal = (mobility: Mobility) => {
        setDeleteModal({
            isOpen: true,
            mobility,
            isDeleting: false
        });
    };

    const closeDeleteModal = () => {
        if (!deleteModal.isDeleting) {
            setDeleteModal({
                isOpen: false,
                mobility: null,
                isDeleting: false
            });
        }
    };

    const handleDelete = () => {
        if (!deleteModal.mobility) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));

        router.delete(window.route('movilidad.destroy', deleteModal.mobility.id), {
            onSuccess: () => {
                setDeleteModal({
                    isOpen: false,
                    mobility: null,
                    isDeleting: false
                });
            },
            onError: () => {
                setDeleteModal(prev => ({ ...prev, isDeleting: false }));
                error('Error al eliminar', 'No se pudo eliminar la movilidad. Inténtalo nuevamente.');
            }
        });
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const getModalTitle = () => {
        return selectedMobility ? 'Editar Movilidad' : 'Registrar Nueva Movilidad';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

        const getDocumentStatusBadge = (mobility: Mobility) => {
        const documents = [
            mobility.liquidator,
            mobility.soat,
            mobility.technical_review,
            mobility.permit,
            mobility.fire_extinguisher,
        ];

        const completedDocs = documents.filter(doc => doc !== null && doc !== undefined).length;
        const totalDocs = documents.length;

        if (completedDocs === totalDocs) {
            return <Badge variant="default" className="bg-green-100 text-green-800">Completo</Badge>;
        } else if (completedDocs > 0) {
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Incompleto ({completedDocs}/{totalDocs})</Badge>;
        } else {
            return <Badge variant="destructive" className="bg-red-100 text-red-800">Sin documentos</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestionar Movilidad" />

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Heading
                            title="Gestionar Movilidad"
                            description="Administra todos los vehículos y su documentación"
                        />
                    </div>

                    {/* Buscador y Botón Nueva Movilidad */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex-1">
                            <SearchInput
                                placeholder="Buscar por nombre, placa o conductor..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onClear={clearSearch}
                            />
                        </div>
                        <Button onClick={openCreateModal} className="hidden sm:flex w-full sm:w-auto cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="sm:inline">Nueva Movilidad</span>
                        </Button>
                    </div>
                </div>

                {/* Mobilities Table */}
                <Card className="bg-card dark:bg-card border-border dark:border-border">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            {/* Vista móvil: Cards */}
                            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                                {(mobilities?.data || []).map((mobility) => (
                                    <div key={mobility.id} className="border border-border dark:border-border rounded-lg p-4 bg-card dark:bg-card shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-foreground dark:text-foreground truncate">
                                                    {mobility.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                                    Placa: {mobility.plate} | Creado: {formatDate(mobility.created_at)}
                                                </p>
                                            </div>
                                            <div className="ml-2">
                                                {getDocumentStatusBadge(mobility)}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <span className="text-xs text-muted-foreground dark:text-muted-foreground">Conductor:</span>
                                            <p className="text-sm text-foreground dark:text-foreground mt-1">
                                                {mobility.conductor.first_name} {mobility.conductor.last_name}
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
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuItem
                                                        onClick={() => router.visit(window.route('movilidad.detalles', mobility.id))}
                                                        className="cursor-pointer"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ver detalles
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openEditModal(mobility)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openDeleteModal(mobility)}
                                                        className="cursor-pointer text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
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
                                        <TableHead className="px-6 py-3">Vehículo</TableHead>
                                        <TableHead className="px-6 py-3">Placa</TableHead>
                                        <TableHead className="px-6 py-3">Conductor</TableHead>
                                        <TableHead className="px-6 py-3">Estado Documentos</TableHead>
                                        <TableHead className="px-6 py-3">Fecha de Registro</TableHead>
                                        <TableHead className="px-6 py-3 w-[80px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(mobilities?.data || []).map((mobility) => (
                                        <TableRow key={mobility.id} className="hover:bg-muted/50">
                                            <TableCell className="px-6 py-4">
                                                <div className="font-medium">
                                                    {mobility.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                                    {mobility.plate}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="text-sm">
                                                    {mobility.conductor.first_name} {mobility.conductor.last_name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                {getDocumentStatusBadge(mobility)}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(mobility.created_at)}
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
                                                            onClick={() => router.visit(window.route('movilidad.detalles', mobility.id))}
                                                            className="cursor-pointer"
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Ver detalles
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openEditModal(mobility)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openDeleteModal(mobility)}
                                                            className="cursor-pointer text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {(mobilities?.data?.length === 0 || !mobilities?.data) && (
                            <div className="text-center py-12">
                                <Car className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold text-foreground dark:text-foreground">
                                    {filters?.search ? 'No se encontraron movilidades' : 'No hay movilidades registradas'}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                                    {filters?.search
                                        ? 'Intenta cambiar los criterios de búsqueda.'
                                        : 'Comienza registrando tu primera movilidad.'
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
                                        Ver todas las movilidades
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Paginación dentro del mismo card */}
                        {(mobilities?.links && mobilities.links.length > 3) && (
                            <div className="border-t">
                                <Pagination
                                    users={mobilities}
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
            <MobilityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mobility={selectedMobility}
                conductors={conductors}
                title={getModalTitle()}
            />

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={deleteModal.mobility?.name}
                isDeleting={deleteModal.isDeleting}
            />
        </AppLayout>
    );
}
