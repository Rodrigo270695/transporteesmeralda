import { SearchInput } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface Props {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    priorityFilter: string;
    onPriorityChange: (value: string) => void;
    deliveryId: number;
    deliveryStatus: string;
}

export function DeliveryFiltersBar({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    priorityFilter,
    onPriorityChange,
    deliveryId,
    deliveryStatus
}: Props) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1">
                    <SearchInput
                        placeholder="Buscar por nombre, dirección o cliente..."
                        value={searchQuery}
                        onChange={onSearchChange}
                        onClear={() => onSearchChange('')}
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_ruta">En Ruta</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="reagendado">Reagendado</option>
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => onPriorityChange(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="">Todas las prioridades</option>
                        <option value="alta">Alta</option>
                        <option value="media">Media</option>
                        <option value="baja">Baja</option>
                    </select>
                </div>

                {deliveryStatus === 'borrador' && (
                    <Button
                        onClick={() => router.visit(route('entregas.puntos.create', deliveryId))}
                        className="hidden sm:flex w-full sm:w-auto cursor-pointer"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Punto
                    </Button>
                )}
            </div>
        </div>
    );
}
