import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DriverDeliveryPoint } from '@/types/driver';
import { XCircle, RotateCcw, Calendar } from 'lucide-react';

interface StatusChangeModalProps {
    point: DriverDeliveryPoint | null;
    isOpen: boolean;
    selectedStatus: 'cancelado' | 'reagendado' | null;
    onClose: () => void;
    onSubmit: (data: { status: string; observations: string; rescheduled_date?: string }) => void;
    isLoading?: boolean;
}

export function StatusChangeModal({
    point,
    isOpen,
    selectedStatus,
    onClose,
    onSubmit,
    isLoading = false
}: StatusChangeModalProps) {
    const [observations, setObservations] = useState('');
    const [rescheduledDate, setRescheduledDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedStatus || !observations.trim()) {
            return;
        }

        const data: any = {
            status: selectedStatus,
            observations: observations.trim()
        };

        if (selectedStatus === 'reagendado' && rescheduledDate) {
            data.rescheduled_date = rescheduledDate;
        }

        onSubmit(data);
    };

    const handleClose = () => {
        setObservations('');
        setRescheduledDate('');
        onClose();
    };

    const getStatusConfig = () => {
        if (selectedStatus === 'cancelado') {
            return {
                title: 'Cancelar Entrega',
                icon: <XCircle className="h-5 w-5 text-red-600" />,
                color: 'text-red-600',
                description: 'Se cancelará la entrega de este punto'
            };
        } else if (selectedStatus === 'reagendado') {
            return {
                title: 'Reagendar Entrega',
                icon: <RotateCcw className="h-5 w-5 text-purple-600" />,
                color: 'text-purple-600',
                description: 'Se reagendará la entrega para otra fecha'
            };
        }
        return null;
    };

    const statusConfig = getStatusConfig();

    // Obtener fecha mínima (mañana)
    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {statusConfig?.icon}
                        {statusConfig?.title}
                    </DialogTitle>
                </DialogHeader>

                {point && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Información del punto */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm">
                                <p className="font-medium">{point.client.name}</p>
                                <p className="text-gray-600 text-xs">{point.address}</p>
                                <p className="text-gray-600 text-xs">Monto: S/ {point.amount_to_collect.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Descripción */}
                        <p className="text-sm text-gray-600">
                            {statusConfig?.description}
                        </p>

                        {/* Campo de observaciones */}
                        <div className="space-y-2">
                            <Label htmlFor="observations">
                                Motivo / Observaciones *
                            </Label>
                            <Textarea
                                id="observations"
                                placeholder={
                                    selectedStatus === 'cancelado'
                                        ? 'Ej: Cliente no se encuentra en el domicilio'
                                        : 'Ej: Cliente solicita entrega para el fin de semana'
                                }
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>

                        {/* Campo de fecha para reagendado */}
                        {selectedStatus === 'reagendado' && (
                            <div className="space-y-2">
                                <Label htmlFor="rescheduled_date" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Nueva Fecha de Entrega
                                </Label>
                                <Input
                                    id="rescheduled_date"
                                    type="date"
                                    value={rescheduledDate}
                                    onChange={(e) => setRescheduledDate(e.target.value)}
                                    min={getMinDate()}
                                />
                                <p className="text-xs text-gray-500">
                                    Opcional: Si no seleccionas fecha, se coordinará posteriormente
                                </p>
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || !observations.trim()}
                                className={
                                    selectedStatus === 'cancelado'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-purple-600 hover:bg-purple-700'
                                }
                            >
                                {isLoading ? 'Procesando...' : `Confirmar ${selectedStatus === 'cancelado' ? 'Cancelación' : 'Reagendado'}`}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
