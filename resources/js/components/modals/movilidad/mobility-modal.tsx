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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/molecules/input-error';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Mobility {
    id: number;
    name: string;
    plate: string;
    conductor_user_id: number;
    conductor: User;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    mobility?: Mobility | null;
    conductors?: User[];
    title?: string;
}

export default function MobilityModal({
    isOpen,
    onClose,
    mobility,
    conductors = [],
    title
}: Props) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        plate: '',
        conductor_user_id: '',
    });

    useEffect(() => {
        if (mobility) {
            setData({
                name: mobility.name,
                plate: mobility.plate,
                conductor_user_id: mobility.conductor_user_id.toString(),
            });
        } else {
            reset();
        }
        clearErrors();
    }, [mobility, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const url = mobility
            ? window.route('movilidad.update', mobility.id)
            : window.route('movilidad.store');

        const method = mobility ? put : post;

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
                        {title || (mobility ? 'Editar Movilidad' : 'Nueva Movilidad')}
                    </DialogTitle>
                    <DialogDescription>
                        {mobility
                            ? 'Modifica la información del vehículo y su conductor asignado.'
                            : 'Completa la información para registrar un nuevo vehículo en el sistema.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nombre del Vehículo <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Ej: Bus Mercedes 2020"
                            maxLength={100}
                            disabled={processing}
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        <InputError message={errors.name} />
                        <p className="text-xs text-gray-500">
                            {data.name.length}/100 caracteres
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="plate">
                            Placa <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="plate"
                            type="text"
                            value={data.plate}
                            onChange={(e) => setData('plate', e.target.value.toUpperCase())}
                            placeholder="Ej: ABC-123"
                            maxLength={20}
                            disabled={processing}
                            className={errors.plate ? 'border-red-500' : ''}
                        />
                        <InputError message={errors.plate} />
                        <p className="text-xs text-gray-500">
                            {data.plate.length}/20 caracteres
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="conductor_user_id">
                            Conductor Asignado <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={data.conductor_user_id}
                            onValueChange={(value) => setData('conductor_user_id', value)}
                            disabled={processing}
                        >
                            <SelectTrigger className={errors.conductor_user_id ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecciona un conductor" />
                            </SelectTrigger>
                            <SelectContent>
                                {conductors.length === 0 ? (
                                    <div className="py-2 px-3 text-sm text-muted-foreground">
                                        No hay conductores disponibles
                                    </div>
                                ) : (
                                    conductors.map((conductor) => (
                                        <SelectItem
                                            key={conductor.id}
                                            value={conductor.id.toString()}
                                        >
                                            {conductor.first_name} {conductor.last_name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.conductor_user_id} />
                        {conductors.length === 0 && (
                            <p className="text-xs text-amber-600">
                                No hay conductores registrados. Registra un conductor primero.
                            </p>
                        )}
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
                                : mobility
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
