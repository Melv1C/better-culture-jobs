import { prisma } from '@/lib/prisma';
import logs from './data/logs.json' assert { type: 'json' };

type PrismaDelegate = {
  findFirst(args: { where: Record<string, unknown> }): Promise<unknown>;
  update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<unknown>;
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
};

async function syncJsonData(
  data: unknown[],
  prismaInstance: PrismaDelegate,
  uniqueFields: string[],
): Promise<void> {
  let successCount = 0;
  let failureCount = 0;
  console.log(`→ Starting sync of ${data.length} records...`);

  for (const [i, line] of data.entries()) {
    try {
      if (typeof line !== 'object' || line === null) {
        throw new Error(`Invalid record format: expected object but got ${typeof line}`);
      }

      const record = line as Record<string, unknown>;

      for (const field of uniqueFields) {
        if (!(field in record)) {
          throw new Error(`Missing unique field "${field}" in record: ${JSON.stringify(record)}`);
        }
      }

      const where = uniqueFields.reduce(
        (acc, field) => {
          acc[field] = record[field];
          return acc;
        },
        {} as Record<string, unknown>,
      );

      const existing = await prismaInstance.findFirst({ where });

      if (existing) {
        await prismaInstance.update({
          where: { id: (existing as Record<string, unknown>).id },
          data: record,
        });
        console.log(
          `  • [${i + 1}/${data.length}] Updated record with ${uniqueFields.map(f => `${f}: ${record[f]}`).join(', ')}`,
        );
      } else {
        await prismaInstance.create({ data: record });
        console.log(
          `  + [${i + 1}/${data.length}] Created new record with ${uniqueFields.map(f => `${f}: ${record[f]}`).join(', ')}`,
        );
      }
      successCount++;
    } catch (error) {
      failureCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`    ✗ [${i + 1}/${data.length}] Failed to sync record: ${errorMessage}`);
    }
  }
  console.log(`→ Sync complete: ${successCount} succeeded, ${failureCount} failed.`);
}

async function main(): Promise<void> {
  console.log('🌱 Syncing JSON data...');

  await syncJsonData(logs, prisma.log, ['message']);

  console.log('✅ JSON data sync complete!');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
