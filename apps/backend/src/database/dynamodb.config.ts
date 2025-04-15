import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDB configuration for game session data
 * Used for high-throughput, low-latency game state storage
 */
@Injectable()
export class DynamoDBConfig {
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;

  constructor() {
    this.client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    this.docClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
    });
  }

  getDocClient(): DynamoDBDocumentClient {
    return this.docClient;
  }

  /**
   * Table names configuration
   */
  getTables() {
    return {
      gameSessions: process.env.DYNAMODB_SESSIONS_TABLE || 'GameSessions',
      playerStats: process.env.DYNAMODB_STATS_TABLE || 'PlayerStats',
      matchHistory: process.env.DYNAMODB_MATCHES_TABLE || 'MatchHistory',
    };
  }
}
