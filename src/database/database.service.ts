import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private connection: mysql.Connection;
  private connectionPromise: Promise<mysql.Connection>;

  constructor(private configService: ConfigService) {
    // Initialize the connection promise in the constructor
    this.connectionPromise = this.createConnection();
  }

  private async createConnection(): Promise<mysql.Connection> {
    return mysql.createConnection({
      host: this.configService.get('DB_HOST'),
      port: this.configService.get('DB_PORT'),
      user: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_DATABASE'),
    });
  }

  async onModuleInit() {
    try {
      this.connection = await this.connectionPromise;
      console.log('Database connection established');
    } catch (error) {
      console.error('Failed to establish database connection:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.end();
      console.log('Database connection closed');
    }
  }

  getConnection() {
    return this.connection;
  }

  async query(sql: string, params: any[] = []) {
    // Make sure connection is established*
    if (!this.connection) {
      this.connection = await this.connectionPromise;
    }

    const [results] = await this.connection.execute(sql, params);
    return results;
  }
}
