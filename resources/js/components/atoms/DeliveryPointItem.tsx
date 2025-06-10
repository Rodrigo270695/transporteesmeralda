import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Eye,
    Edit,
    Trash2,
    Navigation,
    LocateFixed,
    GripVertical
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeliveryPoint } from '@/types';

interface DeliveryPointItemProps {
    point: DeliveryPoint;
    onView: (point: DeliveryPoint) => void;
    onEdit: (point: DeliveryPoint) => void;
    onDelete: (point: DeliveryPoint) => void;
    onDirections: (point: DeliveryPoint) => void;
    onLocate: (point: DeliveryPoint) => void;
}

export default function DeliveryPointItem({
    point,
    onView,
    onEdit,
    onDelete,
    onDirections,
    onLocate
}: DeliveryPointItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: point.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'en_ruta': 'bg-blue-100 text-blue-800 border-blue-200',
            'entregado': 'bg-green-100 text-green-800 border-green-200',
            'cancelado': 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusText = (status: string) => {
        const statusMap = {
            'pendiente': 'Pendiente',
            'en_ruta': 'En Ruta',
            'entregado': 'Entregado',
            'cancelado': 'Cancelado'
        };
        return statusMap[status as keyof typeof statusMap] || status;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 p-3 bg-card rounded-lg border transition-all hover:shadow-sm"
        >
            {/* Handle para drag */}
            <div
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </div>

            {/* Contenido del punto */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                            {point.router_order}
                        </span>
                        <span className="font-medium truncate">{point.point_name}</span>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(point.status)}`}>
                        {getStatusText(point.status)}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate mb-2">
                    {point.address}
                </p>
                <div className="text-xs text-muted-foreground mb-2">
                    <span>Cliente: {point.client?.name}</span>
                    <br />
                    <span>Vendedor: {point.seller?.name}</span>
                </div>
                {point.amount_to_collect && (
                    <div className="text-sm font-medium text-green-600">
                        {point.amount_to_collect.formatted}
                    </div>
                )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-1">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(point)}
                    className="h-8 w-8 p-0"
                    title="Ver detalles"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(point)}
                    className="h-8 w-8 p-0"
                    title="Editar"
                >
                    <Edit className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(point)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Eliminar"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDirections(point)}
                    className="h-8 w-8 p-0"
                    title="Ver direcciones"
                >
                    <Navigation className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onLocate(point)}
                    className="h-8 w-8 p-0"
                    title="Localizar en mapa"
                >
                    <LocateFixed className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
