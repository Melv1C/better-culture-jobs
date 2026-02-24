import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'add-admin': './scripts/add-admin.ts',
    'sync-json-data': './scripts/sync-json-data.ts',
  },
});
