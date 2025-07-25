<?php
echo "<h1>🔗 Creando Storage Link</h1>";

// Cambiar al directorio de Laravel
$laravelPath = '/home/transp26/esmeralda/';
chdir($laravelPath);

echo "<h2>📁 Directorio actual: " . getcwd() . "</h2>";

// Rutas correctas
$publicStoragePath = '/home/transp26/public_html/storage';
$laravelStoragePath = '/home/transp26/esmeralda/storage/app/public';

// Verificar si ya existe el link
if (is_link($publicStoragePath)) {
    echo "<p>ℹ️ El storage link ya existe</p>";
    echo "<p>📂 Apunta a: " . readlink($publicStoragePath) . "</p>";

    // Eliminar link existente para recrearlo
    unlink($publicStoragePath);
    echo "<p>🗑️ Link anterior eliminado</p>";
} else {
    echo "<p>📝 Storage link no existe, creando...</p>";
}

// Verificar que el directorio origen existe
if (!is_dir($laravelStoragePath)) {
    mkdir($laravelStoragePath, 0755, true);
    echo "<p>📁 Directorio storage/app/public creado</p>";
}

// Crear el enlace simbólico manualmente
echo "<h3>🔗 Creando enlace simbólico</h3>";
echo "<p>Desde: <code>$publicStoragePath</code></p>";
echo "<p>Hacia: <code>$laravelStoragePath</code></p>";

$result = symlink($laravelStoragePath, $publicStoragePath);

if ($result) {
    echo "<h3>✅ ¡SUCCESS!</h3>";
    echo "<p>🔗 Storage link creado exitosamente</p>";
} else {
    echo "<h3>❌ Error creando enlace manual</h3>";

    // Intentar con artisan como backup
    echo "<h3>⚡ Intentando con: php artisan storage:link</h3>";
    $output = shell_exec('php artisan storage:link 2>&1');
    echo "<pre>$output</pre>";
}

// Verificar resultado final
echo "<h3>📋 Verificación final</h3>";
if (is_link($publicStoragePath)) {
    echo "✅ Storage link existe<br>";
    echo "📂 Apunta a: " . readlink($publicStoragePath) . "<br>";
} else {
    echo "❌ Storage link NO fue creado<br>";
}

if (file_exists($publicStoragePath)) {
    echo "✅ /public_html/storage es accesible<br>";
} else {
    echo "❌ /public_html/storage NO es accesible<br>";
}

echo "<p><strong>⚠️ Elimina este archivo:</strong> <code>rm /home/transp26/public_html/create-storage-link.php</code></p>";
?>
