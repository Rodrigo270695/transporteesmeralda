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
import { Camera, CreditCard, ImageIcon, Star, X } from 'lucide-react';

interface PointFormModalProps {
    point: DeliveryPoint | null;
    paymentMethods: PaymentMethod[];
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
    captureImage: () => Promise<string>;
}

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
        customer_rating: 5,
        payment_image: '',
        delivery_image: ''
    });

    const [isCapturingPayment, setIsCapturingPayment] = useState(false);
    const [isCapturingDelivery, setIsCapturingDelivery] = useState(false);

    // Reset form when point changes
    React.useEffect(() => {
        if (point) {
            setFormData({
                payment_method_id: '',
                amount_collected: point.amount_to_collect?.toString() || '',
                payment_reference: '',
                payment_notes: '',
                observation: '',
                customer_rating: 5,
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
            customer_rating: 5,
            payment_image: '',
            delivery_image: ''
        });
        onClose();
    };

    if (!point) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Método de pago */}
                    <div className="space-y-2">
                        <Label htmlFor="payment_method_id">
                            Método de Pago <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.payment_method_id}
                            onValueChange={(value) => handleInputChange('payment_method_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar método de pago" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map(method => (
                                    <SelectItem key={method.id} value={method.id.toString()}>
                                        {method.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

                    {/* Referencia de pago */}
                    <div className="space-y-2">
                        <Label htmlFor="payment_reference">Referencia de Pago</Label>
                        <Input
                            id="payment_reference"
                            value={formData.payment_reference}
                            onChange={(e) => handleInputChange('payment_reference', e.target.value)}
                            placeholder="Número de operación, voucher, etc."
                        />
                    </div>

                    {/* Imagen del pago */}
                    <div className="space-y-2">
                        <Label>Imagen del Pago</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCapturePaymentImage}
                                disabled={isCapturingPayment}
                                className="flex-1"
                            >
                                <Camera className="h-4 w-4 mr-2" />
                                {isCapturingPayment ? 'Capturando...' : 'Tomar Foto del Pago'}
                            </Button>
                            {formData.payment_image && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleInputChange('payment_image', '')}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        {formData.payment_image && (
                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                                <ImageIcon className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700">Imagen del pago capturada</span>
                            </div>
                        )}
                    </div>

                    {/* Imagen de la entrega */}
                    <div className="space-y-2">
                        <Label>Imagen de la Entrega</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCaptureDeliveryImage}
                                disabled={isCapturingDelivery}
                                className="flex-1"
                            >
                                <Camera className="h-4 w-4 mr-2" />
                                {isCapturingDelivery ? 'Capturando...' : 'Tomar Foto de Entrega'}
                            </Button>
                            {formData.delivery_image && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleInputChange('delivery_image', '')}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        {formData.delivery_image && (
                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                                <ImageIcon className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700">Imagen de entrega capturada</span>
                            </div>
                        )}
                    </div>

                    {/* Calificación del cliente */}
                    <div className="space-y-2">
                        <Label>Calificación del Servicio</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(rating => (
                                <Button
                                    key={rating}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleInputChange('customer_rating', rating)}
                                    className="p-1"
                                >
                                    <Star
                                        className={`h-6 w-6 ${
                                            rating <= formData.customer_rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                </Button>
                            ))}
                        </div>
                    </div>

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
                            rows={2}
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2 pt-4">
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
