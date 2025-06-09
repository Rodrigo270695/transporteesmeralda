import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, error, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);

        const togglePasswordVisibility = () => {
            setShowPassword(!showPassword);
        };

        return (
            <div className="relative">
                {/* Icono de candado a la izquierda */}
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className={cn(
                        "h-4 w-4 transition-colors",
                        error ? "text-destructive" : "text-muted-foreground"
                    )} />
                </div>

                <input
                    type={showPassword ? 'text' : 'password'}
                    ref={ref}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus-visible:ring-destructive",
                        "pl-10 pr-10", // Espacio para el icono y el botón del ojo
                        className
                    )}
                    {...props}
                />

                {/* Botón para mostrar/ocultar contraseña */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute inset-y-0 right-0 flex h-full items-center justify-center px-3 py-0 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1} // Evitar que el botón interfiera con la navegación por teclado
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {showPassword ? (
                        <EyeOff className={cn(
                            "h-4 w-4 transition-colors",
                            error ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                        )} />
                    ) : (
                        <Eye className={cn(
                            "h-4 w-4 transition-colors",
                            error ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                        )} />
                    )}
                </Button>
            </div>
        );
    }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
