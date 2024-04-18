import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    //
    process.env.SSL_DEV && basicSsl(),
    react(),
  ].filter(Boolean),
})
