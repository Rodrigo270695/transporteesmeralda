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
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeliveryPoint } from '@/types/delivery-points';

interface DraggablePointsListProps {
    points: DeliveryPoint[];
    onReorder: (newOrder: DeliveryPoint[]) => void;
    onView: (point: DeliveryPoint) => void;
    onDelete: (point: DeliveryPoint) => void;
    onLocate: (point: DeliveryPoint) => void;
}

// Componente para cada punto sortable
function SortablePointItem({
    point,
    onView,
    onDelete,
    onLocate
}: {
    point: DeliveryPoint;
    onView: (point: DeliveryPoint) => void;
    onDelete: (point: DeliveryPoint) => void;
    onLocate: (point: DeliveryPoint) => void;
}) {
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
            className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50 hover:border-border transition-all"
        >
            {/* Drag Handle */}
            <div
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </div>

            {/* Order Number */}
            <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium bg-primary/10 text-primary rounded-full">
                    {point.route_order}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground truncate">
                        {point.point_name}
                    </h4>
                    <Badge className={`text-xs ${getStatusColor(point.status)}`}>
                        {getStatusText(point.status)}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate mb-1">
                    {point.address}
                </p>
                <div className="text-xs text-muted-foreground">
                    Cliente: <span className="font-medium">{point.client?.name}</span>
                </div>
                {point.amount_to_collect && (
                    <div className="text-sm font-medium text-green-600 mt-1">
                        {point.amount_to_collect.formatted}
                    </div>
                )}
            </div>

            {/* Actions - Vertical Layout */}
            <div className="flex flex-col gap-1 flex-shrink-0">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(point)}
                    className="h-8 w-8 p-0 cursor-pointer"
                    title="Ver detalles"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(point)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive cursor-pointer"
                    title="Eliminar"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onLocate(point)}
                    className="h-8 w-8 p-0 cursor-pointer"
                    title="Localizar en mapa"
                >
                    <LocateFixed className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default function DraggablePointsList({
    points,
    onReorder,
    onView,
    onDelete,
    onLocate
}: DraggablePointsListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = points.findIndex(point => point.id === active.id);
            const newIndex = points.findIndex(point => point.id === over.id);

            const newPoints = arrayMove(points, oldIndex, newIndex);

            // Actualizar route_order para cada punto
            const updatedPoints = newPoints.map((point, index) => ({
                ...point,
                route_order: index + 1
            }));

            onReorder(updatedPoints);
        }
    };

    if (points.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No hay puntos de entrega</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Puntos de Entrega</h3>
                <span className="text-xs text-muted-foreground">
                    Arrastra para reordenar
                </span>
            </div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={points.map(point => point.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {points.map((point) => (
                            <SortablePointItem
                                key={point.id}
                                point={point}
                                onView={onView}
                                onDelete={onDelete}
                                onLocate={onLocate}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
