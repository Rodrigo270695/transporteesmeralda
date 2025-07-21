import { NavMain } from '@/components/organisms/nav-main';
import { NavUser } from '@/components/molecules/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Users,
    UserPlus,
    MapPin,
    DollarSign,
    FileText,
    BarChart3,
    Package,
    UserCheck,
    Truck,
    User
} from 'lucide-react';
import AppLogo from '@/components/atoms/app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Usuarios',
        icon: Users,
        items: [
            {
                title: 'Administradores',
                href: '/usuarios/gestionar',
                icon: Users,
            },
            {
                title: 'Clientes',
                href: '/usuarios/gestionar-clientes',
                icon: UserPlus,
            },
            {
                title: 'Conductores',
                href: '/usuarios/gestionar-conductores',
                icon: UserCheck,
            },
            {
                title: 'Vendedores',
                href: '/vendedores/gestionar',
                icon: User,
            }
        ]
    },
    {
        title: 'Transportes',
        icon: Truck,
        items: [
            {
                title: 'Movilidad',
                href: '/movilidad/gestionar',
                icon: Package
            },
        ]
    },
    {
        title: 'Gestión',
        icon: Package,
        items: [
            {
                title: 'Formas de Pago',
                href: '/formas-pago/gestionar',
                icon: DollarSign
            },
            {
                title: 'Zonas',
                href: '/zonas/gestionar',
                icon: MapPin
            },
            {
                title: 'Entregas',
                href: '/entregas/gestionar',
                icon: Truck
            },
            {
                title: 'Vista Conductor',
                href: '/conductor/dashboard',
                icon: MapPin
            }
        ]
    },
    {
        title: 'Reportes',
        icon: BarChart3,
        items: [
            {
                title: 'Ingresos',
                href: '/reportes/ingresos',
                icon: DollarSign
            },
            {
                title: 'Viajes Realizados',
                href: '/reportes/viajes',
                icon: FileText
            },
            {
                title: 'Estadísticas',
                href: '/reportes/estadisticas',
                icon: BarChart3
            }
        ]
    }
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;

    // Verificar roles del usuario
    interface Role {
        name: string;
    }

    interface UserWithRoles {
        roles?: Role[];
    }

    const userRoles = (auth.user as UserWithRoles)?.roles || [];
    const isConductor = Array.isArray(userRoles) && userRoles.some((role: Role) => role.name === 'conductor');

    // Filtrar items del menú según el rol
    const getFilteredNavItems = (): NavItem[] => {
        if (isConductor) {
            // Para conductores: Dashboard, Transportes y Gestión (solo Vista Conductor)
            return mainNavItems.filter(item => {
                return item.title === 'Dashboard' || item.title === 'Transportes' || item.title === 'Gestión';
            }).map(item => {
                if (item.title === 'Gestión') {
                    // Para Gestión, filtrar solo Vista Conductor
                    return {
                        ...item,
                        items: item.items?.filter(subItem => subItem.title === 'Vista Conductor') || []
                    };
                }
                return item; // Dashboard y Transportes se mantienen igual
            });
        }

        // Para administradores: mostrar todo
        return mainNavItems;
    };

    const filteredNavItems = getFilteredNavItems();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
