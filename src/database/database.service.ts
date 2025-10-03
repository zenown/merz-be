import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: mysql.Pool | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {}

  private createPool(): mysql.Pool {
    const host = this.configService.get<string>('DB_HOST');
    const port = Number(this.configService.get('DB_PORT')) || 3306;
    const user = this.configService.get<string>('DB_USERNAME');
    const password = this.configService.get<string>('DB_PASSWORD');
    const database = this.configService.get<string>('DB_DATABASE');

    const waitForConnections = true;
    const connectionLimit = Number(this.configService.get('DB_POOL_LIMIT')) || 10;
    const queueLimit = Number(this.configService.get('DB_POOL_QUEUE_LIMIT')) || 0;

    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections,
      connectionLimit,
      queueLimit,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      timezone: 'Z',
      supportBigNumbers: true,
      dateStrings: false,
    });

    pool.on('connection', () => {
      this.logger.log('MySQL connection acquired from pool');
    });

    pool.on('acquire', () => {
      this.logger.verbose?.('MySQL connection acquired');
    });

    pool.on('release', () => {
      this.logger.verbose?.('MySQL connection released');
    });

    return pool;
  }

  async onModuleInit() {
    this.pool = this.createPool();
    // simple keep-alive ping
    const keepAliveMs = Number(this.configService.get('DB_KEEPALIVE_MS')) || 30_000;
    this.keepAliveTimer = setInterval(async () => {
      try {
        await this.query('SELECT 1');
      } catch (err) {
        this.logger.warn(`Keep-alive ping failed: ${(err as Error).message}`);
      }
    }, keepAliveMs);
    this.logger.log('Database pool initialized');
  }

  async onModuleDestroy() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.pool) {
      try {
        await this.pool.end();
        this.logger.log('Database pool closed');
      } finally {
        this.pool = null;
      }
    }
  }

  getPool(): mysql.Pool {
    if (!this.pool) {
      this.pool = this.createPool();
    }
    return this.pool;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T> {
    const execute = async (): Promise<T> => {
      const pool = this.getPool();
      const [results] = await pool.execute(sql, params);
      return results as T;
    };

    try {
      return await execute();
    } catch (err) {
      const message = (err as any)?.message || '';
      const code = (err as any)?.code || '';
      const shouldRetry =
        code === 'PROTOCOL_CONNECTION_LOST' ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        message.includes('closed state') ||
        message.includes('Pool is closed');

      if (shouldRetry) {
        this.logger.warn(`Query failed due to ${code || message}. Recreating pool and retrying once.`);
        // Recreate pool and retry once
        if (this.pool) {
          try {
            await this.pool.end();
          } catch {}
        }
        this.pool = this.createPool();
        return await execute();
      }
      throw err;
    }
  }
}
