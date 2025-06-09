import { Head } from '@inertiajs/react';
import { Heading, SearchInput, Pagination } from '@/components/molecules';
import { PaymentMethodModal } from '@/components/organisms/payment-method-modal';
import { DeleteConfirmationModal } from '@/components/organisms/delete-confirmation-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { MoreHorizontal, Plus, Edit2, Trash2, Search, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGlobalToast } from '@/hooks/use-global-toast';

interface PaymentMethod {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    paymentMethods: {
        data: PaymentMethod[];
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
        title: 'Formas de Pago',
        href: '/formas-pago/gestionar',
    },
];

export default function GestionarFormasPago({ paymentMethods, filters }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        paymentMethod: PaymentMethod | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        paymentMethod: null,
        isDeleting: false
    });

    const { success, error } = useGlobalToast();

    // Debounce para búsqueda automática
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(window.route('formas-pago.gestionar'),
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
        setSelectedPaymentMethod(null);
        setIsModalOpen(true);
    };

    const openEditModal = (paymentMethod: PaymentMethod) => {
        setSelectedPaymentMethod(paymentMethod);
        setIsModalOpen(true);
    };

    const openDeleteModal = (paymentMethod: PaymentMethod) => {
        setDeleteModal({
            isOpen: true,
            paymentMethod,
            isDeleting: false
        });
    };

    const closeDeleteModal = () => {
        if (!deleteModal.isDeleting) {
            setDeleteModal({
                isOpen: false,
                paymentMethod: null,
                isDeleting: false
            });
        }
    };

    const handleDelete = () => {
        if (!deleteModal.paymentMethod) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));

        router.delete(window.route('formas-pago.destroy', deleteModal.paymentMethod.id), {
            onSuccess: () => {
                setDeleteModal({
                    isOpen: false,
                    paymentMethod: null,
                    isDeleting: false
                });
            },
            onError: () => {
                setDeleteModal(prev => ({ ...prev, isDeleting: false }));
                error('Error al eliminar', 'No se pudo eliminar la forma de pago. Inténtalo nuevamente.');
            }
        });
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const getModalTitle = () => {
        return selectedPaymentMethod ? 'Editar Forma de Pago' : 'Registrar Nueva Forma de Pago';
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
            <Head title="Gestionar Formas de Pago" />

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Heading
                            title="Gestionar Formas de Pago"
                            description="Administra todas las formas de pago del sistema"
                        />
                    </div>

                    {/* Buscador y Botón Nueva Forma de Pago */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex-1">
                            <SearchInput
                                placeholder="Buscar por nombre o descripción..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onClear={clearSearch}
                            />
                        </div>
                        <Button onClick={openCreateModal} className="hidden sm:flex w-full sm:w-auto cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="sm:inline">Nueva Forma de Pago</span>
                        </Button>
                    </div>
                </div>

                {/* Payment Methods Table */}
                <Card className="bg-card dark:bg-card border-border dark:border-border">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            {/* Vista móvil: Cards */}
                            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                                {(paymentMethods?.data || []).map((paymentMethod) => (
                                    <div key={paymentMethod.id} className="border border-border dark:border-border rounded-lg p-4 bg-card dark:bg-card shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-foreground dark:text-foreground truncate">
                                                    {paymentMethod.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                                    Creado: {formatDate(paymentMethod.created_at)}
                                                </p>
                                            </div>
                                        </div>

                                        {paymentMethod.description && (
                                            <div className="mb-4">
                                                <span className="text-xs text-muted-foreground dark:text-muted-foreground">Descripción:</span>
                                                <p className="text-sm text-foreground dark:text-foreground mt-1">
                                                    {paymentMethod.description}
                                                </p>
                                            </div>
                                        )}

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
                                                        onClick={() => openEditModal(paymentMethod)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openDeleteModal(paymentMethod)}
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
                                        <TableHead className="px-6 py-3">Nombre</TableHead>
                                        <TableHead className="px-6 py-3">Descripción</TableHead>
                                        <TableHead className="px-6 py-3">Fecha de Creación</TableHead>
                                        <TableHead className="px-6 py-3 w-[80px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(paymentMethods?.data || []).map((paymentMethod) => (
                                        <TableRow key={paymentMethod.id} className="hover:bg-muted/50">
                                            <TableCell className="px-6 py-4">
                                                <div className="font-medium">
                                                    {paymentMethod.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="text-sm">
                                                    {paymentMethod.description ? (
                                                        <span className="text-foreground">{paymentMethod.description}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Sin descripción</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(paymentMethod.created_at)}
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
                                                            onClick={() => openEditModal(paymentMethod)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openDeleteModal(paymentMethod)}
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

                        {(paymentMethods?.data?.length === 0 || !paymentMethods?.data) && (
                            <div className="text-center py-12">
                                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold text-foreground dark:text-foreground">
                                    {filters?.search ? 'No se encontraron formas de pago' : 'No hay formas de pago registradas'}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                                    {filters?.search
                                        ? 'Intenta cambiar los criterios de búsqueda.'
                                        : 'Comienza registrando tu primera forma de pago.'
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
                                        Ver todas las formas de pago
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Paginación dentro del mismo card */}
                        {(paymentMethods?.links && paymentMethods.links.length > 3) && (
                            <div className="border-t">
                                <Pagination
                                    users={paymentMethods}
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
            <PaymentMethodModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                paymentMethod={selectedPaymentMethod}
                title={getModalTitle()}
                onSuccess={(message) => message && success('¡Éxito!', message)}
                onError={(message) => error('Error', message)}
            />

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={deleteModal.paymentMethod?.name}
                isDeleting={deleteModal.isDeleting}
            />
        </AppLayout>
    );
}
