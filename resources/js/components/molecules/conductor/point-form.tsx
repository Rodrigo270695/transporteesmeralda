import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CameraCapture } from '@/components/organisms/conductor';
import { DeliveryPoint, PaymentMethod, PointUpdateRequest } from '@/types/driver';
import {
    Save,
    X,
    Camera,
    Upload,
    MapPin,
    DollarSign,
    FileText
} from 'lucide-react';

interface PointFormProps {
    point: DeliveryPoint;
    paymentMethods: PaymentMethod[];
    onSubmit: (data: PointUpdateRequest) => void;
    onCancel: () => void;
    isLoading?: boolean;
    className?: string;
}

export const PointForm: React.FC<PointFormProps> = ({
    point,
    paymentMethods = [],
    onSubmit,
    onCancel,
    isLoading = false,
    className = ''
}) => {
    const [formData, setFormData] = useState<PointUpdateRequest>({
        status: point.status,
        observation: point.observation || '',
        amount_collected: point.amount_collected || 0,
        payment_method_id: point.payment_method_id || undefined,
        cancellation_reason: point.cancellation_reason || '',
        delivery_image: '',
        payment_image: ''
    });

    const [showCamera, setShowCamera] = useState(false);
    const [cameraType, setCameraType] = useState<'delivery' | 'payment'>('delivery');
    const [images, setImages] = useState({
        delivery: point.delivery_image || '',
        payment: point.payment_image || ''
    });

    const handleInputChange = (field: keyof PointUpdateRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageCapture = (imageData: string) => {
        const imageType = cameraType;
        setImages(prev => ({
            ...prev,
            [imageType]: imageData
        }));

        handleInputChange(`${imageType}_image` as keyof PointUpdateRequest, imageData);
        setShowCamera(false);
    };

    const openCamera = (type: 'delivery' | 'payment') => {
        setCameraType(type);
        setShowCamera(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            delivery_image: images.delivery,
            payment_image: images.payment
        };

        onSubmit(submitData);
    };

    const canSubmit = () => {
        // Validaciones básicas
        if (formData.status === 'entregado') {
            return formData.amount_collected > 0 &&
                   formData.payment_method_id &&
                   images.delivery; // Requiere foto de entrega
        }

        if (formData.status === 'cancelado') {
            return formData.cancellation_reason.trim().length > 0;
        }

        return true;
    };

    return (
        <div className={className}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información del punto */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium">
                            Punto #{point.route_order} - {point.customer_name}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-600">{point.address}</p>
                    {point.amount_to_collect && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                            Monto a cobrar: S/ {point.amount_to_collect.toFixed(2)}
                        </p>
                    )}
                </div>

                {/* Estado */}
                <div className="space-y-2">
                    <Label htmlFor="status">Estado *</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="en_ruta">En Ruta</SelectItem>
                            <SelectItem value="entregado">Entregado</SelectItem>
                            <SelectItem value="reagendado">Reagendado</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Campos para entrega completada */}
                {formData.status === 'entregado' && (
                    <>
                        {/* Monto cobrado */}
                        <div className="space-y-2">
                            <Label htmlFor="amount_collected">Monto Cobrado *</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="amount_collected"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount_collected}
                                    onChange={(e) => handleInputChange('amount_collected', parseFloat(e.target.value) || 0)}
                                    className="pl-10"
                                    placeholder="0.00"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Método de pago */}
                        <div className="space-y-2">
                            <Label htmlFor="payment_method">Método de Pago *</Label>
                            <Select
                                value={formData.payment_method_id?.toString()}
                                onValueChange={(value) => handleInputChange('payment_method_id', parseInt(value))}
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar método de pago" />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethods.map((method) => (
                                        <SelectItem key={method.id} value={method.id.toString()}>
                                            {method.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Imágenes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Foto de entrega */}
                            <div className="space-y-2">
                                <Label>Foto de Entrega *</Label>
                                <div className="space-y-2">
                                    {images.delivery ? (
                                        <div className="relative">
                                            <img
                                                src={images.delivery}
                                                alt="Foto de entrega"
                                                className="w-full h-32 object-cover rounded-lg border"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openCamera('delivery')}
                                                className="mt-2 w-full"
                                                disabled={isLoading}
                                            >
                                                <Camera className="h-4 w-4 mr-2" />
                                                Cambiar Foto
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => openCamera('delivery')}
                                            className="w-full h-32 border-dashed"
                                            disabled={isLoading}
                                        >
                                            <div className="text-center">
                                                <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                                <span className="text-sm">Tomar Foto</span>
                                            </div>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Foto de pago (opcional) */}
                            <div className="space-y-2">
                                <Label>Foto de Pago (Opcional)</Label>
                                <div className="space-y-2">
                                    {images.payment ? (
                                        <div className="relative">
                                            <img
                                                src={images.payment}
                                                alt="Foto de pago"
                                                className="w-full h-32 object-cover rounded-lg border"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openCamera('payment')}
                                                className="mt-2 w-full"
                                                disabled={isLoading}
                                            >
                                                <Camera className="h-4 w-4 mr-2" />
                                                Cambiar Foto
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => openCamera('payment')}
                                            className="w-full h-32 border-dashed"
                                            disabled={isLoading}
                                        >
                                            <div className="text-center">
                                                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                                <span className="text-sm">Subir Comprobante</span>
                                            </div>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Campo para cancelación */}
                {formData.status === 'cancelado' && (
                    <div className="space-y-2">
                        <Label htmlFor="cancellation_reason">Motivo de Cancelación *</Label>
                        <Textarea
                            id="cancellation_reason"
                            value={formData.cancellation_reason}
                            onChange={(e) => handleInputChange('cancellation_reason', e.target.value)}
                            placeholder="Explica el motivo de la cancelación..."
                            rows={3}
                            disabled={isLoading}
                            required
                        />
                    </div>
                )}

                {/* Observaciones */}
                <div className="space-y-2">
                    <Label htmlFor="observation">Observaciones</Label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Textarea
                            id="observation"
                            value={formData.observation}
                            onChange={(e) => handleInputChange('observation', e.target.value)}
                            placeholder="Agrega cualquier observación adicional..."
                            rows={3}
                            className="pl-10"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        disabled={isLoading || !canSubmit()}
                        className="flex-1"
                    >
                        {isLoading ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Guardando...
                            </div>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Modal de cámara */}
            <CameraCapture
                isOpen={showCamera}
                onClose={() => setShowCamera(false)}
                onCapture={handleImageCapture}
                title={cameraType === 'delivery' ? 'Foto de Entrega' : 'Foto de Pago'}
                subtitle={cameraType === 'delivery'
                    ? 'Toma una foto que confirme la entrega'
                    : 'Toma una foto del comprobante de pago'
                }
            />
        </div>
    );
};

export default PointForm;
