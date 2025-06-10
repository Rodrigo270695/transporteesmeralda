import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    itemName?: string;
    isDeleting?: boolean;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar Eliminación",
    message,
    itemName,
    isDeleting = false
}: DeleteConfirmationModalProps) {

    const defaultMessage = itemName
        ? `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`
        : "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.";

    const finalMessage = message || defaultMessage;

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md z-[10001]" style={{ zIndex: 10001 }}>
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-left">
                                {title}
                            </DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="text-left pt-2">
                        {finalMessage}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="cursor-pointer"
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
