import { AppContent } from '@/components/organisms/app-content';
import { AppShell } from '@/components/organisms/app-shell';
import { AppSidebar } from '@/components/organisms/app-sidebar';
import { AppSidebarHeader } from '@/components/organisms/app-sidebar-header';
import { GlobalToastManager } from '@/components/organisms/global-toast-manager';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>

            {/* Toast Manager Global */}
            <GlobalToastManager />
        </AppShell>
    );
}
