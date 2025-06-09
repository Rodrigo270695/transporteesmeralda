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
import { MoreHorizontal, UserPlus, Edit2, Trash2, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGlobalToast } from '@/hooks/use-global-toast';

interface UserWithRelations extends User {
    roles: Array<{ name: string }>;
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
        title: 'Gestionar Clientes',
        href: '/usuarios/gestionar-clientes',
    },
];

export default function GestionarClientes({ users, roles, filters }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        user: UserWithRelations | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        user: null,
        isDeleting: false
    });

    const { success, error } = useGlobalToast();

    // Debounce para búsqueda automática
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(route('usuarios.gestionar-clientes'),
                    searchQuery ? { search: searchQuery } : {},
                    {
                        preserveState: true,
                        replace: true,
                    }
                );
            }
        }, 500); // 500ms de delay

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

    const openDeleteModal = (user: UserWithRelations) => {
        setDeleteModal({
            isOpen: true,
            user,
            isDeleting: false
        });
    };

    const closeDeleteModal = () => {
        if (!deleteModal.isDeleting) {
            setDeleteModal({
                isOpen: false,
                user: null,
                isDeleting: false
            });
        }
    };

    const handleDelete = () => {
        if (!deleteModal.user) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));

        router.delete(route('usuarios.destroy', deleteModal.user.id), {
            onSuccess: () => {
                setDeleteModal({
                    isOpen: false,
                    user: null,
                    isDeleting: false
                });
                // El mensaje flash se maneja automáticamente por GlobalToastManager
                // No necesitamos hacer nada adicional aquí
            },
            onError: () => {
                setDeleteModal(prev => ({ ...prev, isDeleting: false }));
                error('Error al eliminar', 'No se pudo eliminar el cliente. Inténtalo nuevamente.');
            }
        });
    };

    const clearSearch = () => {
        setSearchQuery('');
    };



    const getModalTitle = () => {
        return selectedUser ? 'Editar Cliente' : 'Registrar Nuevo Cliente';
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
                            description="Administra todos los clientes del sistema"
                        />
                    </div>

                    {/* Buscador y Botón Nuevo Usuario */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex-1">
                            <SearchInput
                                placeholder="Buscar por nombre, DNI, teléfono o email..."
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
                                                    {user.first_name} {user.last_name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground dark:text-muted-foreground font-mono">
                                                    DNI: {user.dni}
                                                </p>
                                            </div>
                                                                        <div className="ml-2 flex-shrink-0">
                                <Badge variant="secondary">
                                    CLIENTE
                                </Badge>
                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div>
                                                <span className="text-xs text-muted-foreground dark:text-muted-foreground">Contacto:</span>
                                                <p className="text-sm font-medium text-foreground dark:text-foreground">{user.phone}</p>
                                                {user.email && (
                                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">{user.email}</p>
                                                )}
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
                                                        onClick={() => openEditModal(user)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openDeleteModal(user)}
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
                                        <TableHead className="px-6 py-3">Nombre Completo</TableHead>
                                        <TableHead className="px-6 py-3">DNI</TableHead>
                                        <TableHead className="px-6 py-3">Contacto</TableHead>
                                        <TableHead className="px-6 py-3 w-[80px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(users?.data || []).map((user) => (
                                        <TableRow key={user.id} className="hover:bg-muted/50">
                                            <TableCell className="px-6 py-4">
                                                <div className="font-medium">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="font-mono text-sm">{user.dni}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium">{user.phone}</div>
                                                    {user.email && (
                                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                                    )}
                                                </div>
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
                                                            onClick={() => openEditModal(user)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openDeleteModal(user)}
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

                        {(users?.data?.length === 0 || !users?.data) && (
                            <div className="text-center py-12">
                                <Search className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
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
                onSuccess={(message) => success('¡Éxito!', message)}
                onError={(message) => error('Error', message)}
            />

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={deleteModal.user ? `${deleteModal.user.first_name} ${deleteModal.user.last_name}` : undefined}
                isDeleting={deleteModal.isDeleting}
            />
        </AppLayout>
    );
}
