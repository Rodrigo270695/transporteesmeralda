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
                title: 'Entregas',
                href: '/entregas/gestionar',
                icon: Truck
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
