import { defineConfig } from 'prisma';

export default defineConfig({
  adapter: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL!,
  },
});

