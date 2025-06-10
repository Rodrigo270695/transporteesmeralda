import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { router } from '@inertiajs/react';
import { MoreHorizontal, Edit2, Trash2, Eye, User, Truck, DollarSign, Navigation } from 'lucide-react';
import { type DeliveryPoint } from '@/types/delivery-points';

interface Props {
    point: DeliveryPoint;
    deliveryId: number;
    deliveryStatus: string;
    onDelete: (point: DeliveryPoint) => void;
}

export function DeliveryPointCard({ point, deliveryId, deliveryStatus, onDelete }: Props) {
    const getStatusBadge = () => {
        const colors = {
            'pendiente': 'bg-gray-100 text-gray-800',
            'en_ruta': 'bg-blue-100 text-blue-800',
            'entregado': 'bg-green-100 text-green-800',
            'cancelado': 'bg-red-100 text-red-800',
            'reagendado': 'bg-yellow-100 text-yellow-800'
        } as const;

        return (
            <Badge variant="outline" className={colors[point.status] || ''}>
                {point.status_label}
            </Badge>
        );
    };

    const getPriorityBadge = () => {
        const colors = {
            'alta': 'bg-red-100 text-red-800',
            'media': 'bg-yellow-100 text-yellow-800',
            'baja': 'bg-green-100 text-green-800'
        } as const;

        return (
            <Badge variant="outline" className={colors[point.priority] || ''}>
                {point.priority === 'alta' ? 'Alta' : point.priority === 'media' ? 'Media' : 'Baja'}
            </Badge>
        );
    };

    return (
        <div className="border border-border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{point.point_name}</h3>
                    <p className="text-xs text-muted-foreground">{point.address}</p>
                </div>
                <div className="flex gap-2">
                    {getStatusBadge()}
                    {getPriorityBadge()}
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{point.client.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>{point.mobility.plate_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{point.amount_to_collect.formatted}</span>
                    {point.amount_collected.formatted && (
                        <span className="text-green-600 text-xs">
                            (Cobrado: {point.amount_collected.formatted})
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <span>Orden: {point.route_order}</span>
                </div>
            </div>

            <div className="flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem
                            onClick={() => router.visit(route('entregas.puntos.show', [deliveryId, point.id]))}
                            className="cursor-pointer"
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                        </DropdownMenuItem>
                        {point.can_edit && (
                            <DropdownMenuItem
                                onClick={() => router.visit(route('entregas.puntos.edit', [deliveryId, point.id]))}
                                className="cursor-pointer"
                            >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                        )}
                        {deliveryStatus === 'borrador' && (
                            <DropdownMenuItem
                                onClick={() => onDelete(point)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
