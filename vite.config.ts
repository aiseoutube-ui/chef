import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno desde los archivos .env
  const env = loadEnv(mode, '.', '');

  return {
    // ESTA LÍNEA ES LA MÁS IMPORTANTE PARA GITHUB PAGES
    // Le dice a Vite que tu proyecto vivirá en el subdirectorio /chef/
    base: '/chef/',

    // Configuración del servidor de desarrollo
    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    // Plugins necesarios para el proyecto (en este caso, React)
    plugins: [react()],

    // Define variables globales que estarán disponibles en tu código de React
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    // Resuelve alias para importaciones más limpias
    resolve: {
      alias: {
        // El alias '@' ahora apunta directamente a la carpeta 'src'
        // para que puedas hacer imports como: import Component from '@/components/MyComponent'
        '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
      }
    }
  };
});