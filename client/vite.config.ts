import * as path from 'path';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
        {find: "@", replacement: path.resolve(__dirname, "src")},
        {find: "@shared", replacement: path.resolve(__dirname, "../shared/src")},
    ],
  },
  esbuild: {
    /** default is "eof", which takes up ~15% in the js files uncompressed (2% compressed). */
    legalComments: 'external',
  },
});
