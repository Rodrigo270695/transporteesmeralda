import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/molecules/input-error';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

interface Delivery {
    id: number;
    name: string;
    delivery_date: string;
    template_number: string;
    created_at: string;
    updated_at: string;
}

interface DeliveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    delivery?: Delivery | null;
    title: string;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function DeliveryModal({
    isOpen,
    onClose,
    delivery,
    title,
    onSuccess,
    onError
}: DeliveryModalProps) {
    const isEditing = !!delivery;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        delivery_date: '',
        template_number: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (delivery) {
                // Formatear la fecha para el input type="date" (yyyy-MM-dd)
                const formattedDate = delivery.delivery_date.split('T')[0];

                setData({
                    name: delivery.name,
                    delivery_date: formattedDate,
                    template_number: delivery.template_number,
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [isOpen, delivery]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        const submitFunction = isEditing ? put : post;
        const routeUrl = isEditing
            ? window.route('entregas.update', delivery.id)
            : window.route('entregas.store');

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
                        Complete la información para {isEditing ? 'actualizar' : 'registrar'} la entrega.
                        Todos los campos son obligatorios.
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
                            maxLength={100}
                            className="w-full"
                        />
                        <div className="flex justify-end text-xs text-muted-foreground">
                            {data.name.length}/100
                        </div>
                        <InputError message={errors.name} />
                    </div>

                    {/* Fecha */}
                    <div className="space-y-2">
                        <Label htmlFor="delivery_date">
                            Fecha <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="delivery_date"
                            type="date"
                            value={data.delivery_date}
                            onChange={(e) => setData('delivery_date', e.target.value)}
                            disabled={processing}
                            className="w-full"
                        />
                        <InputError message={errors.delivery_date} />
                    </div>

                    {/* Número de Plantilla */}
                    <div className="space-y-2">
                        <Label htmlFor="template_number">
                            Número de Plantilla <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="template_number"
                            type="text"
                            value={data.template_number}
                            onChange={(e) => setData('template_number', e.target.value)}
                            placeholder="Ingresa el número de plantilla"
                            disabled={processing}
                            maxLength={15}
                            className="w-full"
                        />
                        <div className="flex justify-end text-xs text-muted-foreground">
                            {data.template_number.length}/15
                        </div>
                        <InputError message={errors.template_number} />
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
