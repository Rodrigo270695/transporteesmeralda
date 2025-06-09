import { UserForm } from '@/components/molecules/user-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type User } from '@/types';

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

    const handleSuccess = (message: string) => {
                    onClose();
        // Solo mostrar toast si hay mensaje (para compatibilidad con casos que no usan flash messages)
        if (onSuccess && message.trim()) {
            onSuccess(message);
                    }
    };

    const handleError = (message: string) => {
                    if (onError) {
            onError(message);
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
                    onSuccess={handleSuccess}
                    onError={handleError}
                    showRole={showRole}
                    defaultRole={defaultRole}
                />
            </DialogContent>
        </Dialog>
    );
}
