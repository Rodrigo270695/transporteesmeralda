import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeliveryPoint, PaymentMethod } from '@/types/driver';
import { Camera, CreditCard, ImageIcon, X, ChevronDown, Upload } from 'lucide-react';

interface PointFormModalProps {
    point: DeliveryPoint | null;
    paymentMethods: PaymentMethod[];
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
    captureImage: () => Promise<string>;
}

// Componente SelectItem personalizado para modales
const ModalSelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => {
    return <div data-value={value}>{children}</div>;
};

// Componente Select personalizado para modales
const ModalSelect = ({ value, onValueChange, placeholder, children }: {
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    children: React.ReactNode;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = React.useRef<HTMLDivElement>(null);

    // Cerrar al hacer click fuera
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={selectRef}>
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between h-9 px-3 py-2 text-sm"
            >
                <span className={value ? '' : 'text-muted-foreground'}>
                    {value ?
                        React.Children.toArray(children).find((child: any) =>
                            child.props?.value === value
                        )?.props?.children || placeholder
                        : placeholder
                    }
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-[10005] mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-1">
                        {React.Children.map(children, (child: any) => (
                            <div
                                key={child.props.value}
                                onClick={() => {
                                    onValueChange(child.props.value);
                                    setIsOpen(false);
                                }}
                                className="px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 rounded-sm"
                            >
                                {child.props.children}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function PointFormModal({
    point,
    paymentMethods,
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
    captureImage
}: PointFormModalProps) {
    const [formData, setFormData] = useState({
        payment_method_id: '',
        amount_collected: '',
        payment_reference: '',
        payment_notes: '',
        observation: '',
        payment_image: '',
        delivery_image: ''
    });

    const [isCapturingPayment, setIsCapturingPayment] = useState(false);
    const [isCapturingDelivery, setIsCapturingDelivery] = useState(false);

    // Referencias para inputs de archivo
    const paymentFileInputRef = React.useRef<HTMLInputElement>(null);
    const deliveryFileInputRef = React.useRef<HTMLInputElement>(null);

    // Reset form when point changes
    React.useEffect(() => {
        if (point) {
            setFormData({
                payment_method_id: '',
                amount_collected: point.amount_to_collect?.toString() || '',
                payment_reference: '',
                payment_notes: '',
                observation: '',
                payment_image: '',
                delivery_image: ''
            });
        }
    }, [point]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCapturePaymentImage = async () => {
        try {
            setIsCapturingPayment(true);
            const base64Image = await captureImage();
            handleInputChange('payment_image', base64Image);
        } catch (error) {
            console.error('Error al capturar imagen de pago:', error);
        } finally {
            setIsCapturingPayment(false);
        }
    };

    const handleCaptureDeliveryImage = async () => {
        try {
            setIsCapturingDelivery(true);
            const base64Image = await captureImage();
            handleInputChange('delivery_image', base64Image);
        } catch (error) {
            console.error('Error al capturar imagen de entrega:', error);
        } finally {
            setIsCapturingDelivery(false);
        }
    };

    // Función para convertir archivo a base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Manejar subida de imagen de pago desde galería
    const handleUploadPaymentImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                // Validar tipo de archivo
                if (!file.type.startsWith('image/')) {
                    alert('Por favor selecciona un archivo de imagen válido');
                    return;
                }

                // Validar tamaño (máximo 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('La imagen es muy grande. Por favor selecciona una imagen menor a 5MB');
                    return;
                }

                const base64Image = await fileToBase64(file);
                handleInputChange('payment_image', base64Image);
            } catch (error) {
                console.error('Error al procesar imagen de pago:', error);
                alert('Error al procesar la imagen');
            }
        }
        // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
        event.target.value = '';
    };

    // Manejar subida de imagen de entrega desde galería
    const handleUploadDeliveryImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                // Validar tipo de archivo
                if (!file.type.startsWith('image/')) {
                    alert('Por favor selecciona un archivo de imagen válido');
                    return;
                }

                // Validar tamaño (máximo 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('La imagen es muy grande. Por favor selecciona una imagen menor a 5MB');
                    return;
                }

                const base64Image = await fileToBase64(file);
                handleInputChange('delivery_image', base64Image);
            } catch (error) {
                console.error('Error al procesar imagen de entrega:', error);
                alert('Error al procesar la imagen');
            }
        }
        // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
        event.target.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleClose = () => {
        setFormData({
            payment_method_id: '',
            amount_collected: '',
            payment_reference: '',
            payment_notes: '',
            observation: '',
            payment_image: '',
            delivery_image: ''
        });
        onClose();
    };

    if (!point) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto z-[10001] point-form-modal" style={{ zIndex: 10002 }}>
                <DialogHeader>
                    <DialogTitle>Completar Entrega</DialogTitle>
                </DialogHeader>

                {/* Información del punto */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{point.client?.name}</h3>
                                <Badge variant="secondary">#{point.route_order}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{point.address}</p>
                            <div className="flex justify-between text-sm">
                                <span>Cantidad: {point.quantity} productos</span>
                                <span className="font-semibold">
                                    S/ {point.amount_to_collect?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Primera fila: Método de pago y Monto en dos columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Método de pago */}
                        <div className="space-y-2">
                            <Label htmlFor="payment_method_id">
                                Método de Pago <span className="text-red-500">*</span>
                            </Label>
                            <ModalSelect
                                value={formData.payment_method_id}
                                onValueChange={(value) => handleInputChange('payment_method_id', value)}
                                placeholder="Seleccionar método de pago"
                            >
                                {paymentMethods.map(method => (
                                    <ModalSelectItem key={method.id} value={method.id.toString()}>
                                        {method.name}
                                    </ModalSelectItem>
                                ))}
                            </ModalSelect>
                        </div>

                        {/* Monto cobrado */}
                        <div className="space-y-2">
                            <Label htmlFor="amount_collected">
                                Monto Cobrado <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="amount_collected"
                                type="number"
                                step="0.01"
                                value={formData.amount_collected}
                                onChange={(e) => handleInputChange('amount_collected', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Segunda fila: Referencia de pago (ancho completo por ahora) */}
                    <div className="space-y-2">
                        <Label htmlFor="payment_reference">Referencia de Pago</Label>
                        <Input
                            id="payment_reference"
                            value={formData.payment_reference}
                            onChange={(e) => handleInputChange('payment_reference', e.target.value)}
                            placeholder="Número de operación, voucher, etc."
                        />
                    </div>

                    {/* Tercera fila: Botones de imagen en dos columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Imagen del pago */}
                        <div className="space-y-2">
                            <Label>Imagen del Pago</Label>
                            <p className="text-xs text-gray-500 mb-2">Capture o suba una foto del comprobante de pago</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCapturePaymentImage}
                                    disabled={isCapturingPayment}
                                    className="flex items-center justify-center gap-2"
                                >
                                    <Camera className="h-4 w-4" />
                                    {isCapturingPayment ? 'Capturando...' : 'Tomar Foto'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => paymentFileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Subir Foto
                                </Button>
                            </div>

                            {/* Input de archivo oculto */}
                            <input
                                ref={paymentFileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleUploadPaymentImage}
                                className="hidden"
                            />

                            {/* Botón para quitar imagen */}
                            {formData.payment_image && (
                                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-700">Imagen del pago capturada</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleInputChange('payment_image', '')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Imagen de la entrega */}
                        <div className="space-y-2">
                            <Label>Imagen de la Entrega</Label>
                            <p className="text-xs text-gray-500 mb-2">Capture o suba una foto de la entrega realizada</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCaptureDeliveryImage}
                                    disabled={isCapturingDelivery}
                                    className="flex items-center justify-center gap-2"
                                >
                                    <Camera className="h-4 w-4" />
                                    {isCapturingDelivery ? 'Capturando...' : 'Tomar Foto'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => deliveryFileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Subir Foto
                                </Button>
                            </div>

                            {/* Input de archivo oculto */}
                            <input
                                ref={deliveryFileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleUploadDeliveryImage}
                                className="hidden"
                            />

                            {/* Botón para quitar imagen */}
                            {formData.delivery_image && (
                                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-700">Imagen de entrega capturada</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleInputChange('delivery_image', '')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cuarta fila: Observaciones y Notas del pago en dos columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Observaciones */}
                        <div className="space-y-2">
                            <Label htmlFor="observation">Observaciones</Label>
                            <Textarea
                                id="observation"
                                value={formData.observation}
                                onChange={(e) => handleInputChange('observation', e.target.value)}
                                placeholder="Comentarios adicionales sobre la entrega..."
                                rows={3}
                            />
                        </div>

                        {/* Notas del pago */}
                        <div className="space-y-2">
                            <Label htmlFor="payment_notes">Notas del Pago</Label>
                            <Textarea
                                id="payment_notes"
                                value={formData.payment_notes}
                                onChange={(e) => handleInputChange('payment_notes', e.target.value)}
                                placeholder="Notas adicionales sobre el pago..."
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Botones finales */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !formData.payment_method_id || !formData.amount_collected}
                            className="flex-1"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Completando...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Completar Entrega
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
