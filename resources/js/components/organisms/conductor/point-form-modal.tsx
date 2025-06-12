import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PointForm } from '@/components/molecules/conductor';
import { DeliveryPoint, PaymentMethod, PointUpdateRequest } from '@/types/driver';

interface PointFormModalProps {
    point: DeliveryPoint | null;
    paymentMethods: PaymentMethod[];
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PointUpdateRequest) => void;
    isLoading?: boolean;
    captureImage?: (type: 'payment' | 'delivery') => Promise<string>;
}

export const PointFormModal: React.FC<PointFormModalProps> = ({
    point,
    paymentMethods,
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
    captureImage
}) => {
    // Cerrar modal al presionar Escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen && !isLoading) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevenir scroll del body cuando el modal está abierto
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isLoading, onClose]);

    const handleSubmit = async (data: PointUpdateRequest) => {
        try {
            await onSubmit(data);
        } catch (error) {
            console.error('Error al enviar formulario:', error);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    if (!point) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] overflow-y-auto"
                onPointerDownOutside={(e) => {
                    // Prevenir cierre al hacer clic fuera si está cargando
                    if (isLoading) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-semibold">
                        Actualizar Punto de Entrega
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Completa la información necesaria para actualizar el estado del punto de entrega.
                        Los campos marcados con * son obligatorios.
                    </DialogDescription>
                </DialogHeader>

                <div className="-mx-6">
                    <PointForm
                        point={point}
                        paymentMethods={paymentMethods}
                        onSubmit={handleSubmit}
                        onCancel={handleClose}
                        isLoading={isLoading}
                        className="px-6"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PointFormModal;
