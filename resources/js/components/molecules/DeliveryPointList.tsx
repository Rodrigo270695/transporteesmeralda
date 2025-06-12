import React from 'react';
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
import { DeliveryPoint } from '@/types/delivery-points';
import DeliveryPointItem from '@/components/atoms/DeliveryPointItem';

interface DeliveryPointListProps {
    points: DeliveryPoint[];
    onReorder: (newOrder: DeliveryPoint[]) => void;
    onView: (point: DeliveryPoint) => void;
    onEdit: (point: DeliveryPoint) => void;
    onDelete: (point: DeliveryPoint) => void;
    onDirections: (point: DeliveryPoint) => void;
    onLocate: (point: DeliveryPoint) => void;
}

export default function DeliveryPointList({
    points,
    onReorder,
    onView,
    onEdit,
    onDelete,
    onDirections,
    onLocate
}: DeliveryPointListProps) {
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
                        <DeliveryPointItem
                            key={point.id}
                            point={point}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDirections={onDirections}
                            onLocate={onLocate}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
