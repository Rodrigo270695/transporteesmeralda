import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { FormInput } from './form-input';
import { Button } from '@/components/ui/button';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, value, onChange, error, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);

        const toggleShowPassword = () => {
            setShowPassword(!showPassword);
        };

        // Botón para mostrar/ocultar contraseña
        const toggleButton = (
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-transparent cursor-pointer"
                onClick={toggleShowPassword}
                tabIndex={-1}
            >
                {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                )}
            </Button>
        );

        return (
            <FormInput
                ref={ref}
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                value={value}
                onChange={onChange}
                rightElement={toggleButton}
                error={error}
                className={className}
                {...props}
            />
        );
    }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
