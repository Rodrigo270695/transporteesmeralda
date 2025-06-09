import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/molecules/input-error';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

interface PaymentMethod {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentMethod?: PaymentMethod | null;
    title: string;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function PaymentMethodModal({
    isOpen,
    onClose,
    paymentMethod,
    title,
    onSuccess,
    onError
}: PaymentMethodModalProps) {
    const isEditing = !!paymentMethod;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (paymentMethod) {
                setData({
                    name: paymentMethod.name,
                    description: paymentMethod.description || '',
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [isOpen, paymentMethod]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

                const submitFunction = isEditing ? put : post;
        const routeUrl = isEditing
            ? window.route('formas-pago.update', paymentMethod.id)
            : window.route('formas-pago.store');

        submitFunction(routeUrl, {
            onSuccess: () => {
                onSuccess(''); // Mensaje vacío para evitar duplicados
                onClose();
                reset();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors)[0] as string;
                onError(errorMessage || 'Ha ocurrido un error');
            }
        });
    };

    const handleClose = () => {
        if (!processing) {
            onClose();
            reset();
            clearErrors();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Complete la información para {isEditing ? 'actualizar' : 'registrar'} la forma de pago.
                        Los campos marcados con * son obligatorios.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nombre */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nombre <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Ingresa el nombre"
                            disabled={processing}
                            maxLength={50}
                            className="w-full"
                        />
                        <div className="flex justify-end text-xs text-muted-foreground">
                            {data.name.length}/50
                        </div>
                        <InputError message={errors.name} />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Ingresa la descripción (opcional)"
                            disabled={processing}
                            maxLength={1000}
                            rows={4}
                            className="w-full resize-none"
                        />
                        <div className="flex justify-end text-xs text-muted-foreground">
                            {data.description.length}/1000
                        </div>
                        <InputError message={errors.description} />
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                            className="cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="cursor-pointer"
                        >
                            {processing ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Registrar')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
