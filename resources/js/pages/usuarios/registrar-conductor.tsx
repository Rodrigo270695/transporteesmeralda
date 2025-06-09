import { Head } from '@inertiajs/react';
import { Heading } from '@/components/molecules';
import { UserModal } from '@/components/organisms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { UserCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useGlobalToast } from '@/hooks/use-global-toast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Usuarios',
        href: '/usuarios',
    },
    {
        title: 'Registrar Conductor',
        href: '/usuarios/registrar-conductor',
    },
];

const roles = [
    { id: 1, name: 'conductor' }
];

export default function RegistrarConductor() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { success, error } = useGlobalToast();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Registrar Conductor" />

            <div className="container mx-auto px-4 py-6 space-y-6">
                <div className="flex flex-col gap-6">
                    <Heading
                        title="Registrar Conductor"
                        description="Registra un nuevo conductor en el sistema"
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Card de Información */}
                        <Card className="bg-card dark:bg-card border-border dark:border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground dark:text-foreground">
                                    Información del Conductor
                                </CardTitle>
                                <CardDescription className="text-muted-foreground dark:text-muted-foreground">
                                    Los conductores están autorizados para operar vehículos de transporte.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-foreground dark:text-foreground">
                                        Permisos del Conductor:
                                    </h4>
                                    <ul className="text-sm text-muted-foreground dark:text-muted-foreground space-y-1">
                                        <li>• Operar vehículos asignados</li>
                                        <li>• Ver rutas programadas</li>
                                        <li>• Gestionar viajes activos</li>
                                        <li>• Reportar incidencias</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-foreground dark:text-foreground">
                                        Requisitos adicionales:
                                    </h4>
                                    <ul className="text-sm text-muted-foreground dark:text-muted-foreground space-y-1">
                                        <li>• Licencia de conducir válida</li>
                                        <li>• Categoría de licencia apropiada</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card de Acción */}
                        <Card className="bg-card dark:bg-card border-border dark:border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground dark:text-foreground">
                                    Registrar Nuevo Conductor
                                </CardTitle>
                                <CardDescription className="text-muted-foreground dark:text-muted-foreground">
                                    Haz clic en el botón para abrir el formulario de registro.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full cursor-pointer"
                                    size="lg"
                                >
                                    <UserCheck className="mr-2 h-5 w-5" />
                                    Registrar Conductor
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roles={roles}
                title="Registrar Nuevo Conductor"
                showRole={false}
                defaultRole="conductor"
                onSuccess={(message) => success('¡Conductor registrado!', message)}
                onError={(message) => error('Error al registrar', message)}
            />
        </AppLayout>
    );
}
