import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/molecules/input-error';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

interface Seller {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    dni: string | null;
}

interface SellerModalProps {
    isOpen: boolean;
    onClose: () => void;
    seller?: Seller | null;
    title: string;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function SellerModal({
    isOpen,
    onClose,
    seller,
    title,
    onSuccess,
    onError
}: SellerModalProps) {
    const isEditing = !!seller;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        first_name: '',
        last_name: '',
        phone: '',
        dni: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (seller) {
                setData({
                    first_name: seller.first_name,
                    last_name: seller.last_name,
                    phone: seller.phone,
                    dni: seller.dni || '',
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [isOpen, seller]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        const submitFunction = isEditing ? put : post;
        const routeUrl = isEditing
            ? window.route('vendedores.update', seller.id)
            : window.route('vendedores.store');

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
                        Complete la información para {isEditing ? 'actualizar' : 'registrar'} el vendedor.
                        Los campos marcados con * son obligatorios.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nombres */}
                    <div className="space-y-2">
                        <Label htmlFor="first_name">
                            Nombres <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="first_name"
                            type="text"
                            value={data.first_name}
                            onChange={(e) => setData('first_name', e.target.value)}
                            placeholder="Ingresa los nombres"
                            disabled={processing}
                            maxLength={50}
                            className="w-full"
                        />
                        <div className="flex justify-end text-xs text-muted-foreground">
                            {data.first_name.length}/50
                        </div>
                        <InputError message={errors.first_name} />
                    </div>

                    {/* Apellidos */}
                    <div className="space-y-2">
                        <Label htmlFor="last_name">
                            Apellidos <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="last_name"
                            type="text"
                            value={data.last_name}
                            onChange={(e) => setData('last_name', e.target.value)}
                            placeholder="Ingresa los apellidos"
                            disabled={processing}
                            maxLength={50}
                            className="w-full"
                        />
                        <div className="flex justify-end text-xs text-muted-foreground">
                            {data.last_name.length}/50
                        </div>
                        <InputError message={errors.last_name} />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            Teléfono <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="Ej: 987654321"
                            disabled={processing}
                            maxLength={9}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Debe empezar con 9 y tener 9 dígitos</span>
                            <span>{data.phone.length}/9</span>
                        </div>
                        <InputError message={errors.phone} />
                    </div>

                    {/* DNI */}
                    <div className="space-y-2">
                        <Label htmlFor="dni">
                            DNI <span className="text-muted-foreground">(opcional)</span>
                        </Label>
                        <Input
                            id="dni"
                            type="text"
                            value={data.dni}
                            onChange={(e) => setData('dni', e.target.value)}
                            placeholder="Ej: 12345678"
                            disabled={processing}
                            maxLength={8}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Debe tener exactamente 8 dígitos</span>
                            <span>{data.dni.length}/8</span>
                        </div>
                        <InputError message={errors.dni} />
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
