import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/molecules/input-error';
import { useForm, router } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

interface PropertyCard {
    id: number;
    digital_document?: string;
    created_at: string;
    updated_at: string;
}

interface PropertyCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    mobilityId: number;
    propertyCardData?: PropertyCard | null;
    title: string;
    description: string;
}

export function PropertyCardModal({
    isOpen,
    onClose,
    mobilityId,
    propertyCardData,
    title,
    description
}: PropertyCardModalProps) {
    const isEditing = !!propertyCardData;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        digital_document: null as File | null,
    });

    useEffect(() => {
        if (isOpen) {
            reset();
            clearErrors();
        }
    }, [isOpen]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        const submitFunction = isEditing ? put : post;
        const routeUrl = isEditing
            ? window.route('movilidad.tarjeta-propiedad.update', [mobilityId, propertyCardData?.id])
            : window.route('movilidad.tarjeta-propiedad.store', mobilityId);

        const formData = new FormData();
        if (data.digital_document) {
            formData.append('digital_document', data.digital_document);
        }

        submitFunction(routeUrl, {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                onClose();
                reset();
                // Recargar la página para mostrar los cambios
                router.reload();
            },
            onError: (errors) => {
                console.error('Error al guardar:', errors);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('digital_document', file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Documento Digital */}
                    <div className="space-y-2">
                        <Label htmlFor="digital_document">
                            Documento Digital
                        </Label>
                        <Input
                            id="digital_document"
                            type="file"
                            onChange={handleFileChange}
                            disabled={processing}
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="w-full"
                        />
                        <div className="text-xs text-muted-foreground">
                            Formatos permitidos: PDF, JPG, JPEG, PNG, WEBP. Máximo 5MB.
                        </div>
                        <InputError message={errors.digital_document} />
                    </div>

                    {/* Información del documento actual */}
                    {isEditing && propertyCardData?.digital_document && (
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Documento actual:</p>
                            <p className="text-sm font-medium">Archivo cargado</p>
                            <p className="text-xs text-muted-foreground">
                                Si subes un nuevo archivo, reemplazará el actual.
                            </p>
                        </div>
                    )}

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
