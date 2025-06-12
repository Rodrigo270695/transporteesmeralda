import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { DeliveryPoint } from '@/types/delivery-points';
import DeliveryStatsSummary from '@/components/molecules/DeliveryStatsSummary';
import DeliveryPointList from '@/components/molecules/DeliveryPointList';

interface DeliveryStats {
    total: number;
    entregados: number;
    enRuta: number;
    pendientes: number;
    totalAmountToCollect: number;
}

interface DeliverySidebarProps {
    deliveryName: string;
    stats: DeliveryStats;
    points: DeliveryPoint[];
    isLoading: boolean;
    onAddPoint: () => void;
    onRefresh: () => void;
    onReorderPoints: (newOrder: DeliveryPoint[]) => void;
    onViewPoint: (point: DeliveryPoint) => void;
    onEditPoint: (point: DeliveryPoint) => void;
    onDeletePoint: (point: DeliveryPoint) => void;
    onDirectionsPoint: (point: DeliveryPoint) => void;
    onLocatePoint: (point: DeliveryPoint) => void;
}

export default function DeliverySidebar({
    deliveryName,
    stats,
    points,
    isLoading,
    onAddPoint,
    onRefresh,
    onReorderPoints,
    onViewPoint,
    onEditPoint,
    onDeletePoint,
    onDirectionsPoint,
    onLocatePoint
}: DeliverySidebarProps) {
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b bg-background">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold truncate" title={deliveryName}>
                        {deliveryName}
                    </h1>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                        title="Actualizar"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* Botón Agregar Punto */}
                <Button
                    onClick={onAddPoint}
                    className="w-full"
                    size="sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Punto
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Stats Summary */}
                <DeliveryStatsSummary stats={stats} />

                {/* Points List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Puntos de Entrega</h3>
                        <span className="text-sm text-muted-foreground">
                            Arrastra para reordenar
                        </span>
                    </div>

                    <DeliveryPointList
                        points={points}
                        onReorder={onReorderPoints}
                        onView={onViewPoint}
                        onEdit={onEditPoint}
                        onDelete={onDeletePoint}
                        onDirections={onDirectionsPoint}
                        onLocate={onLocatePoint}
                    />
                </div>
            </div>
        </div>
    );
}
