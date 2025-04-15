import { Injectable } from '@nestjs/common';

/**
 * MongoDB configuration and connection setup
 */
@Injectable()
export class MongoDBConfig {
  private connectionString: string;

  constructor() {
    this.connectionString =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/web3-gaming';
  }

  getConnectionString(): string {
    return this.connectionString;
  }

  /**
   * Get MongoDB connection options
   */
  getMongooseOptions() {
    return {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
  }
}
