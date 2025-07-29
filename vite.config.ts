import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: env.BASE_URL || '/',
    envPrefix: 'VITE_',
    
    // Resolve configuration
    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, './')
        },
        {
          find: '@components',
          replacement: path.resolve(__dirname, './components')
        },
        {
          find: '@pages',
          replacement: path.resolve(__dirname, './pages')
        },
        {
          find: '@contexts',
          replacement: path.resolve(__dirname, './contexts')
        },
        {
          find: '@services',
          replacement: path.resolve(__dirname, './services')
        },
        {
          find: '@utils',
          replacement: path.resolve(__dirname, './utils')
        },
        {
          find: '@types',
          replacement: path.resolve(__dirname, './types')
        },
        {
          find: '@assets',
          replacement: path.resolve(__dirname, './assets')
        }
      ]
    },

    // Server configuration
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      open: true,
      fs: {
        strict: true,
        allow: ['..']
      },
      watch: {
        usePolling: true,
        interval: 100
      },
      hmr: {
        overlay: true
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },

    // Build configuration
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@headlessui/react', '@heroicons/react'],
            utils: ['date-fns', 'clsx', 'tailwind-merge'],
            vendor: ['@supabase/supabase-js', 'zustand']
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash][ext]'
        }
      },
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      exclude: ['lucide-react'],
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis'
        }
      }
    },

    // CSS configuration
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: 'camelCaseOnly'
      },
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "@/styles/variables.scss";
            @import "@/styles/mixins.scss";
          `
        }
      }
    },

    // Development server proxy (if needed)
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '')
    //   }
    // }
  };
});
