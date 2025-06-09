import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/molecules/input-error';

interface LiquidatorData {
    id: number;
    first_name: string;
    last_name: string;
    dni: string;
    phone: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    mobilityId: number;
    liquidatorData?: LiquidatorData | null;
}

export default function LiquidatorModal({
    isOpen,
    onClose,
    mobilityId,
    liquidatorData
}: Props) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        first_name: '',
        last_name: '',
        dni: '',
        phone: '',
    });

    useEffect(() => {
        if (liquidatorData) {
            setData({
                first_name: liquidatorData.first_name,
                last_name: liquidatorData.last_name,
                dni: liquidatorData.dni,
                phone: liquidatorData.phone,
            });
        } else {
            reset();
        }
        clearErrors();
    }, [liquidatorData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const url = liquidatorData
            ? window.route('movilidad.liquidador.update', [mobilityId, liquidatorData.id])
            : window.route('movilidad.liquidador.store', mobilityId);

        const method = liquidatorData ? put : post;

        method(url, {
            onSuccess: () => {
                // El mensaje flash se maneja automáticamente por GlobalToastManager
                onClose();
                reset();
            },
            onError: () => {
                // Los errores de validación se muestran en los inputs
            },
        });
    };

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {liquidatorData ? 'Editar Liquidador' : 'Registrar Liquidador'}
                    </DialogTitle>
                    <DialogDescription>
                        {liquidatorData
                            ? 'Modifica la información del liquidador asignado.'
                            : 'Completa la información personal del liquidador que será asignado a este vehículo.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">
                                Nombres <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="first_name"
                                type="text"
                                value={data.first_name}
                                onChange={(e) => setData('first_name', e.target.value)}
                                placeholder="Ej: Juan Carlos"
                                maxLength={100}
                                disabled={processing}
                                className={errors.first_name ? 'border-red-500' : ''}
                            />
                            <InputError message={errors.first_name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="last_name">
                                Apellidos <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="last_name"
                                type="text"
                                value={data.last_name}
                                onChange={(e) => setData('last_name', e.target.value)}
                                placeholder="Ej: González López"
                                maxLength={100}
                                disabled={processing}
                                className={errors.last_name ? 'border-red-500' : ''}
                            />
                            <InputError message={errors.last_name} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dni">
                            DNI <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="dni"
                            type="text"
                            value={data.dni}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 8) {
                                    setData('dni', value);
                                }
                            }}
                            placeholder="Ej: 12345678"
                            maxLength={8}
                            disabled={processing}
                            className={errors.dni ? 'border-red-500' : ''}
                        />
                        <InputError message={errors.dni} />
                        <p className="text-xs text-gray-500">
                            Solo números, exactamente 8 dígitos ({data.dni.length}/8)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            Teléfono <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={data.phone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 9 && (value === '' || value.startsWith('9'))) {
                                    setData('phone', value);
                                }
                            }}
                            placeholder="Ej: 987654321"
                            maxLength={9}
                            disabled={processing}
                            className={errors.phone ? 'border-red-500' : ''}
                        />
                        <InputError message={errors.phone} />
                        <p className="text-xs text-gray-500">
                            Debe empezar con 9, solo números, exactamente 9 dígitos ({data.phone.length}/9)
                        </p>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
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
                            {processing
                                ? 'Procesando...'
                                : liquidatorData
                                    ? 'Actualizar'
                                    : 'Registrar'
                            }
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
