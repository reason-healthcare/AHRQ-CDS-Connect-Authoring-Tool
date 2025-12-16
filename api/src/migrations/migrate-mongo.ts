import mm from 'migrate-mongo';
import config from './migrate-mongo-config.js';

export default async function migrate(): Promise<void> {
  mm.config.set(config);
  return mm.database
    .connect()
    .then(({ db, client }: { db: unknown; client: unknown }) => {
      return mm.status(db).then((status: Array<{ appliedAt: string; fileName: string }>) => {
        const pending = status.filter(s => s.appliedAt === 'PENDING');
        console.log(`Previously applied migrations: ${status.length - pending.length}`);
        if (pending.length) {
          console.log('Pending migrations:');
          pending.forEach(({ fileName }) => console.log(`  - ${fileName}`));
          console.log('Applying pending migrations...');
        } else {
          console.log('Pending migrations: 0');
        }
        return { db, client };
      });
    })
    .then(({ db, client }: { db: unknown; client: unknown }) => {
      return mm.up(db, client);
    })
    .then((migrated: string[]) => {
      migrated.forEach(fileName => console.log('Migrated:', fileName));
      if (migrated.length) {
        console.log(`Newly applied migrations: ${migrated.length}`);
      }
    });
}
