import { NavMain } from '@/components/organisms/nav-main';
import { NavUser } from '@/components/molecules/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Users,
    UserPlus,
    MapPin,
    Calendar,
    DollarSign,
    Settings,
    FileText,
    BarChart3,
    Package,
    UserCheck
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
                title: 'Registrar Cliente',
                href: '/usuarios/registrar-cliente',
                icon: UserPlus,
            },
            {
                title: 'Registrar Conductor',
                href: '/usuarios/registrar-conductor',
                icon: UserCheck,
            },
            {
                title: 'Gestionar Usuarios',
                href: '/usuarios/gestionar',
                icon: Users,
            }
        ]
    },
    {
        title: 'Transportes',
        icon: Package,
        items: [
            {
                title: 'Vehículos',
                href: '/transportes/vehiculos',
                icon: Package
            },
            {
                title: 'Rutas',
                href: '/transportes/rutas',
                icon: MapPin
            },
            {
                title: 'Programar Viajes',
                href: '/transportes/programar',
                icon: Calendar
            }
        ]
    },
    {
        title: 'Gestión',
        icon: Package,
        items: [
            {
                title: 'Reservas',
                href: '/gestion/reservas',
                icon: Calendar,
            },
            {
                title: 'Facturación',
                href: '/gestion/facturacion',
                icon: DollarSign
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
    },
    {
        title: 'Configuración',
        href: '/configuracion',
        icon: Settings,
    }
];

export function AppSidebar() {
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
