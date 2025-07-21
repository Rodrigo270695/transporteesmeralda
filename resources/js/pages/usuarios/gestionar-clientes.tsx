import { Head } from '@inertiajs/react';
import { Heading, SearchInput, Pagination } from '@/components/molecules';
import { UserModal } from '@/components/organisms/user-modal';
import { DeleteConfirmationModal } from '@/components/organisms/delete-confirmation-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { router } from '@inertiajs/react';
import { MoreHorizontal, UserPlus, Edit2, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGlobalToast } from '@/hooks/use-global-toast';

interface UserWithRelations extends User {
    roles: Array<{ name: string }>;
    status: 'active' | 'inactive';
    driver?: {
        license_number: string;
        license_type: string;
    };
}

interface Props {
    users: {
        data: UserWithRelations[];
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
    roles: Array<{ id: number; name: string }>;
    filters?: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Usuarios',
        href: '/usuarios',
    },
    {
        title: 'Clientes',
        href: '/usuarios/gestionar-clientes',
    },
];

export default function GestionarClientes({ users, roles, filters }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        user: UserWithRelations | null;
        isChanging: boolean;
    }>({
        isOpen: false,
        user: null,
        isChanging: false
    });

    const { success, error } = useGlobalToast();

    // Debounce para búsqueda automática
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(window.route('usuarios.gestionar-clientes'),
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
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const openEditModal = (user: UserWithRelations) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const openStatusModal = (user: UserWithRelations) => {
        setStatusModal({
            isOpen: true,
            user,
            isChanging: false
        });
    };

    const closeStatusModal = () => {
        if (!statusModal.isChanging) {
            setStatusModal({
                isOpen: false,
                user: null,
                isChanging: false
            });
        }
    };

    const handleStatusChange = () => {
        if (!statusModal.user) return;

        setStatusModal(prev => ({ ...prev, isChanging: true }));

        const newStatus = statusModal.user.status === 'active' ? 'inactive' : 'active';

        router.patch(window.route('usuarios.update-status', statusModal.user.id), {
            status: newStatus
        }, {
            onSuccess: () => {
                setStatusModal({
                    isOpen: false,
                    user: null,
                    isChanging: false
                });
                // El mensaje flash se maneja automáticamente por GlobalToastManager
            },
            onError: () => {
                setStatusModal(prev => ({ ...prev, isChanging: false }));
                error('Error al cambiar estado', 'No se pudo cambiar el estado del usuario. Inténtalo nuevamente.');
            }
        });
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const getModalTitle = () => {
        return selectedUser ? 'Editar Cliente' : 'Registrar Nuevo Cliente';
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
            <Head title="Gestionar Clientes" />

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Heading
                            title="Gestionar Clientes"
                            description="Administra todos los usuarios clientes del sistema"
                        />
                    </div>

                    {/* Buscador y Botón Nuevo Usuario */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex-1">
                            <SearchInput
                                placeholder="Buscar por nombres, apellidos, teléfono, DNI o email..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onClear={clearSearch}
                            />
                        </div>
                        <Button onClick={openCreateModal} className="hidden sm:flex w-full sm:w-auto cursor-pointer">
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span className="sm:inline">Nuevo Cliente</span>
                        </Button>
                    </div>
                </div>

                {/* Users Table */}
                <Card className="bg-card dark:bg-card border-border dark:border-border">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            {/* Vista móvil: Cards */}
                            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                                {(users?.data || []).map((user) => (
                                    <div key={user.id} className="border border-border dark:border-border rounded-lg p-4 bg-card dark:bg-card shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-foreground dark:text-foreground truncate">
                                                    {`${user.first_name} ${user.last_name}`}
                                                </h3>
                                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                                    Teléfono: {user.phone}
                                                </p>
                                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                                    DNI: {user.dni}
                                                </p>
                                                {user.email && (
                                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                                        Email: {user.email}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="ml-2">
                                                {getStatusBadge(user.status)}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <span className="text-xs text-muted-foreground dark:text-muted-foreground">Registrado:</span>
                                            <p className="text-sm text-foreground dark:text-foreground">
                                                {formatDate(user.created_at)}
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
                                                        onClick={() => openEditModal(user)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openStatusModal(user)}
                                                        className="cursor-pointer"
                                                    >
                                                        {user.status === 'active' ? (
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
                                        <TableHead className="px-6 py-3">Email</TableHead>
                                        <TableHead className="px-6 py-3">Estado</TableHead>
                                        <TableHead className="px-6 py-3">Fecha de Registro</TableHead>
                                        <TableHead className="px-6 py-3 w-[80px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(users?.data || []).map((user) => (
                                        <TableRow key={user.id} className="hover:bg-muted/50">
                                            <TableCell className="px-6 py-4">
                                                <div className="font-medium">
                                                    {`${user.first_name} ${user.last_name}`}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                                    {user.phone}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">
                                                    {user.dni}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="text-sm">
                                                    {user.email ? (
                                                        <span className="text-foreground">{user.email}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Sin email</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                {getStatusBadge(user.status)}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(user.created_at)}
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
                                                            onClick={() => openEditModal(user)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openStatusModal(user)}
                                                            className="cursor-pointer"
                                                        >
                                                            {user.status === 'active' ? (
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

                        {(users?.data?.length === 0 || !users?.data) && (
                            <div className="text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold text-foreground dark:text-foreground">
                                    {filters?.search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                                    {filters?.search
                                        ? 'Intenta cambiar los criterios de búsqueda.'
                                        : 'Comienza registrando tu primer cliente.'
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
                                        Ver todos los clientes
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Paginación dentro del mismo card */}
                        {(users?.links && users.links.length > 3) && (
                            <div className="border-t">
                                <Pagination
                                    users={users}
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
                <UserPlus className="h-6 w-6 text-primary-foreground dark:text-primary-foreground" />
            </Button>

            {/* Modales */}
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedUser}
                roles={roles}
                title={getModalTitle()}
                showRole={false}
                defaultRole="cliente"
                onSuccess={(message) => message && success('¡Éxito!', message)}
                onError={(message) => error('Error', message)}
            />

            <DeleteConfirmationModal
                isOpen={statusModal.isOpen}
                onClose={closeStatusModal}
                onConfirm={handleStatusChange}
                itemName={statusModal.user ? `${statusModal.user.first_name} ${statusModal.user.last_name}` : undefined}
                isDeleting={statusModal.isChanging}
                title={statusModal.user ? (statusModal.user.status === 'active' ? 'Desactivar Cliente' : 'Activar Cliente') : 'Cambiar Estado'}
                message={statusModal.user ? (statusModal.user.status === 'active' ? '¿Estás seguro de que quieres desactivar este cliente?' : '¿Estás seguro de que quieres activar este cliente?') : 'Confirma el cambio de estado'}
                confirmText={statusModal.user ? (statusModal.user.status === 'active' ? 'Desactivar' : 'Activar') : 'Cambiar Estado'}
                loadingText={statusModal.user ? (statusModal.user.status === 'active' ? 'Desactivando...' : 'Activando...') : 'Cambiando estado...'}
            />
        </AppLayout>
    );
}
