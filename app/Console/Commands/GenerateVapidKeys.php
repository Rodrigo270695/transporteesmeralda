<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Exception;

class GenerateVapidKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vapid:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate VAPID keys for push notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Generando claves VAPID...');

        // Generar claves VAPID usando OpenSSL
        $keys = $this->generateVapidKeys();

        if ($keys) {
            $this->info('Claves VAPID generadas exitosamente:');
            $this->line('');
            $this->line('Agrega estas líneas a tu archivo .env:');
            $this->line('');
            $this->line('VITE_VAPID_PUBLIC_KEY=' . $keys['public']);
            $this->line('VITE_VAPID_PRIVATE_KEY=' . $keys['private']);
            $this->line('');
            $this->info('También actualiza tu vite.config.ts para usar estas variables.');
        } else {
            $this->error('Error generando claves VAPID. Verifica que OpenSSL esté disponible.');
        }
    }

    /**
     * Generate VAPID keys using OpenSSL
     */
    private function generateVapidKeys(): ?array
    {
        try {
            // Generar clave privada
            $privateKey = openssl_pkey_new([
                'curve_name' => 'prime256v1',
                'private_key_type' => OPENSSL_KEYTYPE_EC,
            ]);

            if (!$privateKey) {
                return null;
            }

            // Exportar clave privada
            openssl_pkey_export($privateKey, $privateKeyPem);

            // Obtener clave pública
            $publicKeyDetails = openssl_pkey_get_details($privateKey);
            $publicKeyPem = $publicKeyDetails['key'];

            // Convertir a formato base64 URL-safe
            $privateKeyBase64 = $this->pemToBase64Url($privateKeyPem, 'PRIVATE KEY');
            $publicKeyBase64 = $this->pemToBase64Url($publicKeyPem, 'PUBLIC KEY');

            return [
                'private' => $privateKeyBase64,
                'public' => $publicKeyBase64
            ];
        } catch (Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Convert PEM to base64 URL-safe format
     */
    private function pemToBase64Url(string $pem, string $type): string
    {
        // Remover headers y footers del PEM
        $pem = str_replace("-----BEGIN {$type}-----", '', $pem);
        $pem = str_replace("-----END {$type}-----", '', $pem);
        $pem = str_replace(["\r", "\n", " "], '', $pem);

        // Convertir a base64 URL-safe
        $binary = base64_decode($pem);
        return rtrim(strtr(base64_encode($binary), '+/', '-_'), '=');
    }
}
