import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    users: {
        links: PaginationLink[];
        total?: number;
        from?: number;
        to?: number;
        current_page?: number;
        last_page?: number;
    };
    noCard?: boolean;
    showInfo?: boolean;
}

export function Pagination({
    users,
    noCard = false,
    showInfo = true
}: PaginationProps) {
    // No mostrar paginación si no hay links o hay muy pocos
    if (!users.links || users.links.length <= 3) return null;

    // Encontrar los enlaces "Previous" y "Next"
    const prevLink = users.links.find(link =>
        link.label.includes('Previous') ||
        link.label.includes('&laquo;') ||
        link.label.includes('‹') ||
        link.label.includes('pagination.previous')
    );
    const nextLink = users.links.find(link =>
        link.label.includes('Next') ||
        link.label.includes('&raquo;') ||
        link.label.includes('›') ||
        link.label.includes('pagination.next')
    );

    // Filtrar los enlaces numéricos (excluyendo "Previous" y "Next")
    const pageLinks = users.links.filter(
        link => !link.label.includes('Previous') &&
                !link.label.includes('Next') &&
                !link.label.includes('&laquo;') &&
                !link.label.includes('&raquo;') &&
                !link.label.includes('‹') &&
                !link.label.includes('›') &&
                !link.label.includes('pagination.previous') &&
                !link.label.includes('pagination.next')
    );

    // Función para limpiar el HTML en las etiquetas
    const cleanLabel = (label: string) => {
        // Si es un número o una elipsis simple, devuélvelo directamente
        if (!isNaN(Number(label)) || label === "...") return label;

        // Para etiquetas con HTML y traducciones Laravel
        if (label.includes("&laquo;") || label.includes("‹") || label.includes("pagination.previous")) return "‹";
        if (label.includes("&raquo;") || label.includes("›") || label.includes("pagination.next")) return "›";
        if (label.includes("...")) return "...";

        return label.replace(/&[^;]+;/g, '').trim();
    };

    const content = (
        <div className="flex items-center justify-center gap-2">
            {/* Previous Page Button */}
            <Button
                variant="ghost"
                className="h-9 w-9 p-0 cursor-pointer"
                asChild={prevLink?.url !== null}
                disabled={prevLink?.url === null}
            >
                {prevLink?.url ? (
                    <Link href={prevLink.url} preserveScroll preserveState>
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                ) : (
                    <span>
                        <ChevronLeft className="h-4 w-4" />
                    </span>
                )}
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {pageLinks.map((link, i) => {
                    // Para elipsis
                    if (link.label.includes('...')) {
                        return (
                            <Button
                                key={i}
                                variant="ghost"
                                className="h-9 w-9 p-0"
                                disabled
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        );
                    }

                    return (
                        <Button
                            key={i}
                            variant={link.active ? "default" : "ghost"}
                            className="h-9 w-9 p-0 cursor-pointer"
                            asChild={link.url !== null}
                            disabled={link.url === null}
                        >
                            {link.url ? (
                                <Link href={link.url} preserveScroll preserveState>
                                    {cleanLabel(link.label)}
                                </Link>
                            ) : (
                                <span>{cleanLabel(link.label)}</span>
                            )}
                        </Button>
                    );
                })}
            </div>

            {/* Next Page Button */}
            <Button
                variant="ghost"
                className="h-9 w-9 p-0 cursor-pointer"
                asChild={nextLink?.url !== null}
                disabled={nextLink?.url === null}
            >
                {nextLink?.url ? (
                    <Link href={nextLink.url} preserveScroll preserveState>
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                ) : (
                    <span>
                        <ChevronRight className="h-4 w-4" />
                    </span>
                )}
            </Button>
        </div>
    );

    if (noCard) {
        return (
            <div className="px-6 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {showInfo && users.total && users.from && users.to && (
                        <div className="text-sm text-muted-foreground">
                            Mostrando <span className="font-medium">{users.from}</span> a{' '}
                            <span className="font-medium">{users.to}</span> de{' '}
                            <span className="font-medium">{users.total}</span> resultados
                        </div>
                    )}
                    {content}
                    {showInfo && users.current_page && users.last_page && (
                        <div className="text-sm text-muted-foreground sm:hidden">
                            Página {users.current_page} de {users.last_page}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            {showInfo && (
                <div className="text-sm text-muted-foreground">
                    {/* Info se puede mostrar desde el frontend si se necesita */}
                </div>
            )}
            {content}
        </div>
    );
}
