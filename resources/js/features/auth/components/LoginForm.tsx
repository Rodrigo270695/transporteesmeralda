import { useForm } from '@inertiajs/react';
import { LoaderCircle, LogIn } from 'lucide-react';
import { FormEventHandler } from 'react';

import { DNIInput, PasswordInput } from '@/components/atoms';
import InputError from '@/components/molecules/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type LoginForm = {
    dni: string;
    password: string;
    remember: boolean;
};

interface LoginFormProps {
    canResetPassword: boolean;
}

export function LoginForm({ canResetPassword }: LoginFormProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        dni: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <form className="space-y-4" onSubmit={submit}>
            {/* Campo DNI */}
            <div className="space-y-2">
                <Label htmlFor="dni" className="text-sm font-medium text-foreground">
                    Documento de Identidad
                </Label>
                <DNIInput
                    id="dni"
                    required
                    autoFocus
                    tabIndex={1}
                    autoComplete="username"
                    value={data.dni}
                    onChange={(value) => setData('dni', value)}
                    placeholder="Ingresa tu DNI"
                    error={errors.dni}
                    className="h-10"
                />
                {errors.dni && (
                    <InputError message={errors.dni} />
                )}
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                        Contraseña
                    </Label>
                    {canResetPassword && (
                        <a
                            href={route('password.request')}
                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                            tabIndex={5}
                        >
                            ¿Olvidaste tu contraseña?
                        </a>
                    )}
                </div>
                <PasswordInput
                    id="password"
                    required
                    tabIndex={2}
                    autoComplete="current-password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    error={errors.password}
                    className="h-10"
                />
                {errors.password && (
                    <InputError message={errors.password} />
                )}
            </div>

            {/* Checkbox Recordarme */}
            <div className="flex items-center space-x-2 py-2">
                <Checkbox
                    id="remember"
                    name="remember"
                    checked={data.remember}
                    onClick={() => setData('remember', !data.remember)}
                    tabIndex={3}
                />
                <Label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer"
                >
                    Mantener sesión iniciada
                </Label>
            </div>

            {/* Botón de envío */}
            <div className="pt-2">
                <Button
                    type="submit"
                    className="w-full h-10"
                    tabIndex={4}
                    disabled={processing}
                >
                    {processing ? (
                        <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Iniciando sesión...
                        </>
                    ) : (
                        <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Iniciar Sesión
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
