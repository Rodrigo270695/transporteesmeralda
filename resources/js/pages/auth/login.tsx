import { Head } from '@inertiajs/react';

import AuthLayout from '@/layouts/auth-layout';
import { LoginForm } from '@/features/auth/components/LoginForm';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout >
            <Head title="Iniciar sesión" />

            <LoginForm canResetPassword={canResetPassword} />

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
