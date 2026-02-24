import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: false, // We need to keep the dist folder for the backend to work, so we won't clean it before building
});
