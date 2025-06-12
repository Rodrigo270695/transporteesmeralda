import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DeliveryPointCard } from '@/components/molecules/delivery-point-card';
import { DeliveryPointTableRow } from '@/components/molecules/delivery-point-table-row';
import { MapPin } from 'lucide-react';
import { type DeliveryPoint } from '@/types/delivery-points';

interface Props {
    points: DeliveryPoint[];
    loading: boolean;
    deliveryId: number;
    deliveryStatus: string;
    onDelete: (point: DeliveryPoint) => void;
    searchQuery: string;
    statusFilter: string;
    priorityFilter: string;
    onClearFilters: () => void;
}

export function DeliveryPointsTable({
    points,
    loading,
    deliveryId,
    deliveryStatus,
    onDelete,
    searchQuery,
    statusFilter,
    priorityFilter,
    onClearFilters
}: Props) {
    const hasActiveFilters = searchQuery || statusFilter || priorityFilter;

    if (loading) {
        return (
            <Card>
                <CardContent className="p-0">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Cargando puntos...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (points.length === 0) {
        return (
            <Card>
                <CardContent className="p-0">
                    <div className="text-center py-12">
                        <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">
                            {hasActiveFilters ? 'No se encontraron puntos' : 'No hay puntos de entrega'}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {hasActiveFilters
                                ? 'Intenta cambiar los criterios de búsqueda.'
                                : 'Comienza agregando puntos de entrega a esta ruta.'
                            }
                        </p>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                className="mt-4 cursor-pointer"
                                onClick={onClearFilters}
                            >
                                Ver todos los puntos
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    {/* Vista móvil */}
                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                        {points.map((point) => (
                            <DeliveryPointCard
                                key={point.id}
                                point={point}
                                deliveryId={deliveryId}
                                deliveryStatus={deliveryStatus}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>

                    {/* Vista desktop */}
                    <Table className="hidden md:table">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6 py-3">Orden</TableHead>
                                <TableHead className="px-6 py-3">Punto</TableHead>
                                <TableHead className="px-6 py-3">Cliente</TableHead>
                                <TableHead className="px-6 py-3">Vehículo</TableHead>
                                <TableHead className="px-6 py-3">Monto</TableHead>
                                <TableHead className="px-6 py-3">Prioridad</TableHead>
                                <TableHead className="px-6 py-3">Estado</TableHead>
                                <TableHead className="px-6 py-3 w-[80px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {points.map((point) => (
                                <DeliveryPointTableRow
                                    key={point.id}
                                    point={point}
                                    deliveryId={deliveryId}
                                    deliveryStatus={deliveryStatus}
                                    onDelete={onDelete}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
