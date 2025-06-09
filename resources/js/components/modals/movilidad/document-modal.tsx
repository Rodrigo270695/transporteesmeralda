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

interface DocumentData {
    id: number;
    start_date: string;
    end_date: string;
    digital_document?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    mobilityId: number;
    documentType: string;
    documentData?: DocumentData | null;
    title: string;
    description: string;
    fieldLabel: string;
}

export default function DocumentModal({
    isOpen,
    onClose,
    mobilityId,
    documentType,
    documentData,
    title,
    description,
    fieldLabel
}: Props) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        start_date: '',
        end_date: '',
        digital_document: null as File | null,
        _method: '',
    });

    useEffect(() => {
        if (documentData) {
            setData({
                start_date: documentData.start_date ? documentData.start_date.split('T')[0] : '',
                end_date: documentData.end_date ? documentData.end_date.split('T')[0] : '',
                digital_document: null,
                _method: 'PUT',
            });
        } else {
            reset();
            setData('_method', '');
        }
        clearErrors();
    }, [documentData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Preparar datos como objeto simple para Inertia.js
        const formData: any = {
            start_date: data.start_date,
            end_date: data.end_date,
        };

        // Agregar archivo digital si existe
        if (data.digital_document) {
            formData.digital_document = data.digital_document;
        }

        // Para edición con archivos, usar _method: 'PUT' y enviar como POST
        if (documentData) {
            formData._method = 'PUT';
        }

        const url = documentData
            ? window.route(`movilidad.${documentType}.update`, [mobilityId, documentData.id])
            : window.route(`movilidad.${documentType}.store`, mobilityId);

        // Siempre usar POST para compatibilidad con archivos
        post(url, {
            onSuccess: () => {
                onClose();
                reset();
            },
            onError: (errors: any) => {
                // Los errores de validación se muestran automáticamente en los inputs
            },
        });
    };

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('digital_document', file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="start_date">
                            Fecha de Inicio <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="start_date"
                            type="date"
                            value={data.start_date}
                            onChange={(e) => setData('start_date', e.target.value)}
                            disabled={processing}
                            className={errors.start_date ? 'border-red-500' : ''}
                        />
                        <InputError message={errors.start_date} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="end_date">
                            Fecha de Vencimiento <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="end_date"
                            type="date"
                            value={data.end_date}
                            onChange={(e) => setData('end_date', e.target.value)}
                            disabled={processing}
                            className={errors.end_date ? 'border-red-500' : ''}
                        />
                        <InputError message={errors.end_date} />
                        <p className="text-xs text-gray-500">
                            La fecha de vencimiento debe ser posterior a la fecha de inicio
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="document_field">
                            {fieldLabel}
                        </Label>

                        {/* Campo de archivo para todos los documentos */}
                        <Input
                            id="document_field"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={handleFileChange}
                            disabled={processing}
                            className={errors.digital_document ? 'border-red-500' : ''}
                        />
                        <InputError message={errors.digital_document} />
                        <p className="text-xs text-gray-500">
                            Formatos permitidos: PDF, JPG, PNG, WEBP. Máximo 5MB.
                        </p>
                        {data.digital_document && (
                            <div className="text-sm text-green-600">
                                Archivo seleccionado: {data.digital_document.name}
                            </div>
                        )}
                        {documentData?.digital_document && !data.digital_document && (
                            <div className="text-sm text-blue-600">
                                Archivo actual: {documentData.digital_document}
                            </div>
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
                                : documentData
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
