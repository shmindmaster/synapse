// Prisma 7 configuration
// Note: @prisma/config types may not be available in all versions

const config = {
  datasources: {
    db: {
      provider: 'postgresql',
      url: (globalThis as any).process?.env?.DATABASE_URL,
    },
  },
  schema: './schema.prisma',
}

export default config
