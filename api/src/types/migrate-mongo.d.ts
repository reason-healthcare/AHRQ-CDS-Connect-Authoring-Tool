declare module 'migrate-mongo' {
  interface Config {
    set(config: unknown): void;
  }

  interface Database {
    connect(): Promise<{ db: unknown; client: unknown }>;
  }

  interface StatusResult {
    appliedAt: string;
    fileName: string;
  }

  interface MigrateMongo {
    config: Config;
    database: Database;
    status(db: unknown): Promise<StatusResult[]>;
    up(db: unknown, client: unknown): Promise<string[]>;
  }

  const mm: MigrateMongo;
  export default mm;
}
