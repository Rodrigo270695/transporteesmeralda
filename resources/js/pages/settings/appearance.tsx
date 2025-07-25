import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/molecules/appearance-tabs';
import HeadingSmall from '@/components/molecules/heading-small';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configuración de apariencia',
        href: '/settings/appearance',
    },
];

export default function Appearance() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de apariencia" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Configuración de apariencia" description="Actualiza la configuración de apariencia de tu cuenta" />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
