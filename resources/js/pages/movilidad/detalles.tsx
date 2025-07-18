import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { DocumentModal, LiquidatorModal, DeleteConfirmationModal } from '@/components/modals/movilidad';
import { PropertyCardModal } from '@/components/modals/movilidad/PropertyCardModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    ArrowLeft,
    User,
    FileText,
    Shield,
    Wrench,
    ClipboardList,
    Flame,
    CreditCard,
    Plus,
    Edit,
    Trash,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Download
} from 'lucide-react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Liquidator {
    id: number;
    first_name: string;
    last_name: string;
    dni: string;
    phone: string;
    created_at: string;
    updated_at: string;
}

interface DocumentWithDates {
    id: number;
    start_date: string;
    end_date: string;
    digital_document?: string;
    created_at: string;
    updated_at: string;
}

interface PropertyCard {
    id: number;
    digital_document?: string;
    created_at: string;
    updated_at: string;
}

interface Mobility {
    id: number;
    name: string;
    plate: string;
    conductor_user_id: number;
    conductor: User;
    liquidator?: Liquidator;
    soat?: DocumentWithDates;
    technical_review?: DocumentWithDates;
    permit?: DocumentWithDates;
    fire_extinguisher?: DocumentWithDates;
    property_card?: PropertyCard;
    created_at: string;
    updated_at: string;
}

interface Props {
    mobility: Mobility;
    userRole: 'admin' | 'conductor';
}

export default function DetallesMovilidad({ mobility, userRole }: Props) {
    // Estados para controlar qué modal está abierto
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<any>(null);

    // Estados para el modal de confirmación de eliminación
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        documentType: '',
        documentId: 0,
        documentName: '',
        isDeleting: false
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Transportes',
            href: '/transportes',
        },
        {
            title: 'Movilidad',
            href: '/movilidad/gestionar',
        },
        {
            title: mobility.name,
            href: `/movilidad/${mobility.id}`,
        },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isDocumentExpired = (endDate: string) => {
        return new Date(endDate) < new Date();
    };

    const isDocumentExpiringSoon = (endDate: string) => {
        const expireDate = new Date(endDate);
        const today = new Date();
        const diffTime = expireDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
    };

    const getDocumentStatusBadge = (doc: DocumentWithDates | undefined) => {
        if (!doc) {
            return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Sin registrar</Badge>;
        }

        if (isDocumentExpired(doc.end_date)) {
            return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Vencido</Badge>;
        }

        if (isDocumentExpiringSoon(doc.end_date)) {
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Por vencer</Badge>;
        }

        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Vigente</Badge>;
    };

    // Funciones para manejar los modales
    const handleOpenModal = (documentType: string) => {
        setActiveModal(documentType);
    };

    const handleEditDocument = (documentType: string, documentData: any) => {
        setSelectedDocument(documentData);
        setActiveModal(documentType);
    };

    const handleDeleteDocument = (documentType: string, documentId: number) => {
        // Mapear el tipo de documento al nombre mostrado
        const documentNames: Record<string, string> = {
            'liquidador': 'liquidador',
            'soat': 'SOAT',
            'revision-tecnica': 'revisión técnica',
            'permiso': 'permiso',
            'extintor': 'extintor'
        };

        const documentName = documentNames[documentType] || documentType;

        setDeleteModal({
            isOpen: true,
            documentType,
            documentId,
            documentName,
            isDeleting: false
        });
    };

    const confirmDelete = () => {
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));

        const url = window.route(`movilidad.${deleteModal.documentType}.destroy`, mobility.id);

        router.delete(url, {
            onSuccess: () => {
                setDeleteModal({
                    isOpen: false,
                    documentType: '',
                    documentId: 0,
                    documentName: '',
                    isDeleting: false
                });
                // Recargar la página para mostrar los cambios
                router.reload();
            },
            onError: (errors) => {
                setDeleteModal(prev => ({ ...prev, isDeleting: false }));
                console.error('Error al eliminar:', errors);
            }
        });
    };

    const cancelDelete = () => {
        setDeleteModal({
            isOpen: false,
            documentType: '',
            documentId: 0,
            documentName: '',
            isDeleting: false
        });
    };

    // Funciones para ver y descargar documentos
    const handleViewDocument = (documentType: string) => {
        const url = window.route(`movilidad.${documentType}.view`, mobility.id);
        window.open(url, '_blank');
    };

    const handleDownloadDocument = (documentType: string) => {
        const url = window.route(`movilidad.${documentType}.download`, mobility.id);
        window.location.href = url;
    };

    // Verificar si un documento tiene archivo digital
    const hasDigitalDocument = (doc: DocumentWithDates | undefined) => {
        if (!doc) return false;
        // Todos los documentos ahora usan digital_document
        return !!doc.digital_document;
    };

    const documentCards = [
        {
            title: 'Liquidador',
            type: 'liquidador',
            icon: User,
            data: mobility.liquidator,
            hasDateRange: false,
            description: mobility.liquidator
                ? `${mobility.liquidator.first_name} ${mobility.liquidator.last_name}`
                : 'No asignado',
            status: mobility.liquidator
                ? <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Asignado</Badge>
                : <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Sin asignar</Badge>
        },
        {
            title: 'SOAT',
            type: 'soat',
            icon: Shield,
            data: mobility.soat,
            hasDateRange: true,
            description: mobility.soat
                ? `Vigente hasta ${formatDate(mobility.soat.end_date)}`
                : 'No registrado',
            status: getDocumentStatusBadge(mobility.soat)
        },
        {
            title: 'Revisión Técnica',
            type: 'revision-tecnica',
            icon: Wrench,
            data: mobility.technical_review,
            hasDateRange: true,
            description: mobility.technical_review
                ? `Vigente hasta ${formatDate(mobility.technical_review.end_date)}`
                : 'No registrado',
            status: getDocumentStatusBadge(mobility.technical_review)
        },
        {
            title: 'Permisos',
            type: 'permiso',
            icon: ClipboardList,
            data: mobility.permit,
            hasDateRange: true,
            description: mobility.permit
                ? `Vigente hasta ${formatDate(mobility.permit.end_date)}`
                : 'No registrado',
            status: getDocumentStatusBadge(mobility.permit)
        },
        {
            title: 'Extintor',
            type: 'extintor',
            icon: Flame,
            data: mobility.fire_extinguisher,
            hasDateRange: true,
            description: mobility.fire_extinguisher
                ? `Vigente hasta ${formatDate(mobility.fire_extinguisher.end_date)}`
                : 'No registrado',
            status: getDocumentStatusBadge(mobility.fire_extinguisher)
        },
        {
            title: 'Tarjeta de Propiedad',
            type: 'tarjeta-propiedad',
            icon: CreditCard,
            data: mobility.property_card,
            hasDateRange: false,
            description: mobility.property_card
                ? 'Documento cargado'
                : 'No registrado',
            status: mobility.property_card
                ? <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Registrado</Badge>
                : <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Sin registrar</Badge>
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detalles - ${mobility.name}`} />

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/movilidad/gestionar">
                                <Button variant="outline" size="sm" className="cursor-pointer">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Volver
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Vehicle Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Información del Vehículo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                            <p className="text-lg font-semibold">{mobility.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Placa</label>
                            <p className="text-lg font-mono bg-muted px-3 py-1 rounded w-fit">{mobility.plate}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Conductor</label>
                            <p className="text-lg">{mobility.conductor.first_name} {mobility.conductor.last_name}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documentCards.map((doc, index) => {
                        const IconComponent = doc.icon;
                        return (
                            <Card key={index} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <IconComponent className="w-5 h-5 text-primary" />
                                            <CardTitle className="text-lg">{doc.title}</CardTitle>
                                        </div>
                                        {doc.status}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Estado:</p>
                                        <p className="text-sm">{doc.description}</p>
                                    </div>

                                    {doc.data && doc.hasDateRange && (
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Inicio:</p>
                                                <p className="text-sm">{formatDate((doc.data as DocumentWithDates).start_date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Vencimiento:</p>
                                                <p className="text-sm">{formatDate((doc.data as DocumentWithDates).end_date)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {doc.data && !doc.hasDateRange && (
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground">DNI:</p>
                                                <p className="text-sm font-mono">{(doc.data as Liquidator).dni}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Teléfono:</p>
                                                <p className="text-sm font-mono">{(doc.data as Liquidator).phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        {doc.data ? (
                                            <>
                                                {/* Botones de ver y descargar (solo para documentos con archivo) */}
                                                {hasDigitalDocument(doc.data as DocumentWithDates) && (
                                                    <div className="flex gap-1 flex-1">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="cursor-pointer"
                                                            onClick={() => handleViewDocument(doc.type)}
                                                            title="Ver documento"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="cursor-pointer"
                                                            onClick={() => handleDownloadDocument(doc.type)}
                                                            title="Descargar documento"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Botones de editar y eliminar - Solo para administradores */}
                                                {userRole === 'admin' && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className={`cursor-pointer ${hasDigitalDocument(doc.data as DocumentWithDates) ? '' : 'flex-1'}`}
                                                            onClick={() => handleEditDocument(doc.type, doc.data)}
                                                        >
                                                            <Edit className="w-3 h-3 mr-1" />
                                                            Editar
                                                        </Button>

                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            className="cursor-pointer"
                                                            onClick={() => handleDeleteDocument(doc.type, doc.data?.id || 0)}
                                                        >
                                                            <Trash className="w-3 h-3" />
                                                        </Button>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            /* Botón de registrar - Solo para administradores */
                                            userRole === 'admin' && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="flex-1 cursor-pointer"
                                                    onClick={() => handleOpenModal(doc.type)}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Registrar
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Modales */}
            <LiquidatorModal
                isOpen={activeModal === 'liquidador'}
                onClose={() => { setActiveModal(null); setSelectedDocument(null); }}
                mobilityId={mobility.id}
                liquidatorData={activeModal === 'liquidador' ? selectedDocument || mobility.liquidator : null}
            />

            <DocumentModal
                isOpen={activeModal === 'soat'}
                onClose={() => { setActiveModal(null); setSelectedDocument(null); }}
                mobilityId={mobility.id}
                documentType="soat"
                documentData={activeModal === 'soat' ? selectedDocument || mobility.soat : null}
                title="Gestionar SOAT"
                description="Registra o actualiza la información del Seguro Obligatorio de Accidentes de Tránsito."
                fieldLabel="Documento Digital"
            />

            <DocumentModal
                isOpen={activeModal === 'revision-tecnica'}
                onClose={() => { setActiveModal(null); setSelectedDocument(null); }}
                mobilityId={mobility.id}
                documentType="revision-tecnica"
                documentData={activeModal === 'revision-tecnica' ? selectedDocument || mobility.technical_review : null}
                title="Gestionar Revisión Técnica"
                description="Registra o actualiza la información de la revisión técnica del vehículo."
                fieldLabel="Documento Digital"
            />

            <DocumentModal
                isOpen={activeModal === 'permiso'}
                onClose={() => { setActiveModal(null); setSelectedDocument(null); }}
                mobilityId={mobility.id}
                documentType="permiso"
                documentData={activeModal === 'permiso' ? selectedDocument || mobility.permit : null}
                title="Gestionar Permisos"
                description="Registra o actualiza los permisos de operación del vehículo."
                fieldLabel="Documento Digital"
            />

            <DocumentModal
                isOpen={activeModal === 'extintor'}
                onClose={() => { setActiveModal(null); setSelectedDocument(null); }}
                mobilityId={mobility.id}
                documentType="extintor"
                documentData={activeModal === 'extintor' ? selectedDocument || mobility.fire_extinguisher : null}
                title="Gestionar Extintor"
                description="Registra o actualiza la información del extintor del vehículo."
                fieldLabel="Documento Digital"
            />

            <PropertyCardModal
                isOpen={activeModal === 'tarjeta-propiedad'}
                onClose={() => { setActiveModal(null); setSelectedDocument(null); }}
                mobilityId={mobility.id}
                propertyCardData={activeModal === 'tarjeta-propiedad' ? selectedDocument || mobility.property_card : null}
                title="Gestionar Tarjeta de Propiedad"
                description="Registra o actualiza la tarjeta de propiedad del vehículo."
            />

            {/* Modal de confirmación de eliminación */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title={`Eliminar ${deleteModal.documentName}`}
                description={`¿Estás seguro de que deseas eliminar este ${deleteModal.documentName}? Esta acción no se puede deshacer.`}
                isDeleting={deleteModal.isDeleting}
            />
        </AppLayout>
    );
}
