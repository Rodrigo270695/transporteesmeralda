import { UserForm } from '@/components/molecules/user-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type User } from '@/types';
import { router } from '@inertiajs/react';

interface UserWithRelations extends User {
    roles?: Array<{ name: string }>;
    driver?: {
        license_number: string;
        license_type: string;
    };
}

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: UserWithRelations | null;
    roles?: Array<{ id: number; name: string }>;
    title: string;
    showRole?: boolean;
    defaultRole?: string;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export function UserModal({
    isOpen,
    onClose,
    user,
    roles = [],
    title,
    showRole = true,
    defaultRole = 'cliente',
    onSuccess,
    onError
}: UserModalProps) {

    const handleSubmit = (data: any) => {
        if (user) {
            // Actualizar usuario existente
            router.put(route('usuarios.update', user.id), data, {
                onSuccess: () => {
                    onClose();
                    if (onSuccess) {
                        onSuccess('Usuario actualizado exitosamente.');
                    }
                },
                onError: (errors) => {
                    if (onError) {
                        const errorMessage = Object.values(errors).flat().join(' ');
                        onError(errorMessage || 'Error al actualizar el usuario.');
                    }
                }
            });
        } else {
            // Crear nuevo usuario
            router.post(route('usuarios.store'), data, {
                onSuccess: () => {
                    onClose();
                    if (onSuccess) {
                        onSuccess('Usuario registrado exitosamente.');
                    }
                },
                onError: (errors) => {
                    if (onError) {
                        const errorMessage = Object.values(errors).flat().join(' ');
                        onError(errorMessage || 'Error al registrar el usuario.');
                    }
                }
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {user
                            ? 'Modifica la información del usuario. Los campos marcados con * son obligatorios.'
                            : 'Complete la información para registrar un nuevo usuario. Los campos marcados con * son obligatorios.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <UserForm
                    user={user || undefined}
                    roles={roles}
                    onSubmit={handleSubmit}
                    showRole={showRole}
                    defaultRole={defaultRole}
                />
            </DialogContent>
        </Dialog>
    );
}
