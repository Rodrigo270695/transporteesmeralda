import { SimpleInput } from '@/components/atoms/simple-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type User } from '@/types';
import { useForm } from '@inertiajs/react';
import { User as UserIcon, Mail, Phone, IdCard, Lock, Eye, EyeOff, CreditCard } from 'lucide-react';
import { useState } from 'react';

interface UserFormProps {
    user?: User & { driver?: any };
    roles?: Array<{ id: number; name: string }>;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
    showRole?: boolean;
    defaultRole?: string;
}

export function UserForm({
    user,
    roles = [],
    onSubmit,
    isLoading = false,
    showRole = true,
    defaultRole = 'cliente'
}: UserFormProps) {
    const { data, setData, errors, processing } = useForm({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        dni: user?.dni || '',
        phone: user?.phone || '',
        email: user?.email || '',
        password: '',
        role: user?.roles?.[0]?.name || defaultRole,
        license_number: user?.driver?.license_number || '',
        license_type: user?.driver?.license_type || 'B-I',
    });

    const [showPassword, setShowPassword] = useState(false);

    const licenseTypes = [
        'A-I', 'A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc',
        'B-I', 'B-IIa', 'B-IIb', 'B-IIc',
        'C-I', 'C-II'
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(data);
    };

    const showDriverFields = data.role === 'conductor';

    // Funciones para manejar DNI
    const handleDNIChange = (value: string) => {
        const numericValue = value.replace(/\D/g, '').slice(0, 8);
        setData('dni', numericValue);
    };

    // Funciones para manejar teléfono
    const handlePhoneChange = (value: string) => {
        const numericValue = value.replace(/\D/g, '').slice(0, 9);
        setData('phone', numericValue);
    };

    const dniCounter = (
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-sm ${
            data.dni.length === 8 ? 'text-primary bg-primary/10' : 'text-muted-foreground'
        }`}>
            {data.dni.length}/8
        </span>
    );

    const phoneCounter = (
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-sm ${
            data.phone.length === 9 ? 'text-primary bg-primary/10' : 'text-muted-foreground'
        }`}>
            {data.phone.length}/9
        </span>
    );

    const passwordToggle = (
        <button
            type="button"
            className="h-6 w-6 p-0 hover:bg-transparent cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
        >
            {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
            )}
        </button>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="first_name">Nombre *</Label>
                    <SimpleInput
                        id="first_name"
                        type="text"
                        icon={UserIcon}
                        value={data.first_name}
                        onChange={(value) => setData('first_name', value)}
                        maxLength={25}
                        required
                        placeholder="Ingresa el nombre"
                    />
                    {errors.first_name && (
                        <p className="text-sm text-destructive">{errors.first_name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="last_name">Apellido *</Label>
                    <SimpleInput
                        id="last_name"
                        type="text"
                        icon={UserIcon}
                        value={data.last_name}
                        onChange={(value) => setData('last_name', value)}
                        maxLength={25}
                        required
                        placeholder="Ingresa el apellido"
                    />
                    {errors.last_name && (
                        <p className="text-sm text-destructive">{errors.last_name}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="dni">DNI *</Label>
                    <SimpleInput
                        id="dni"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        icon={IdCard}
                        value={data.dni}
                        onChange={handleDNIChange}
                        required
                        placeholder="Ingresa el DNI"
                        rightElement={dniCounter}
                    />
                    {errors.dni && (
                        <p className="text-sm text-destructive">{errors.dni}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <SimpleInput
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        icon={Phone}
                        value={data.phone}
                        onChange={handlePhoneChange}
                        required
                        placeholder="Ingresa el teléfono"
                        rightElement={phoneCounter}
                    />
                    {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <SimpleInput
                    id="email"
                    type="email"
                    icon={Mail}
                    value={data.email}
                    onChange={(value) => setData('email', value)}
                    placeholder="Ingresa el correo electrónico (opcional)"
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">
                    {user ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                </Label>
                <SimpleInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    value={data.password}
                    onChange={(value) => setData('password', value)}
                    required={!user}
                    placeholder={user ? "Dejar vacío para mantener actual" : "Ingresa la contraseña"}
                    rightElement={passwordToggle}
                />
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                )}
            </div>

            {showRole && (
                <div className="space-y-2">
                    <Label htmlFor="role">Rol *</Label>
                    <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                        <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role) => (
                                <SelectItem key={role.id} value={role.name} className="cursor-pointer">
                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.role && (
                        <p className="text-sm text-destructive">{errors.role}</p>
                    )}
                </div>
            )}

            {showDriverFields && (
                <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-medium">Información de Conductor</h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="license_number">Número de Licencia *</Label>
                            <SimpleInput
                                id="license_number"
                                type="text"
                                icon={CreditCard}
                                value={data.license_number}
                                onChange={(value) => setData('license_number', value)}
                                maxLength={20}
                                placeholder="Ej: Q12345678"
                                required
                            />
                            {errors.license_number && (
                                <p className="text-sm text-destructive">{errors.license_number}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="license_type">Tipo de Licencia *</Label>
                            <Select
                                value={data.license_type}
                                onValueChange={(value) => setData('license_type', value)}
                            >
                                <SelectTrigger className="cursor-pointer">
                                    <SelectValue placeholder="Selecciona tipo de licencia" />
                                </SelectTrigger>
                                <SelectContent>
                                    {licenseTypes.map((type) => (
                                        <SelectItem key={type} value={type} className="cursor-pointer">
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.license_type && (
                                <p className="text-sm text-destructive">{errors.license_type}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
                <Button
                    type="submit"
                    disabled={processing || isLoading}
                    className="cursor-pointer"
                >
                    {processing || isLoading ? 'Guardando...' : (user ? 'Actualizar' : 'Registrar')}
                </Button>
            </div>
        </form>
    );
}
