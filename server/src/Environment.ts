import Redis from "ioredis";
import * as dotenv from 'dotenv';
import {RedisWrapper} from "./db/RedisWrapper";
dotenv.config();

/** The global environment. */
export const env = {
  redis: new RedisWrapper(
      new Redis({
        host: 'redis-service.redis.svc.cluster.local',
        /** Use DB 1 because we're using db-0 for Foony. */
        db: 1,
        password: process.env.REDIS_PASSWORD,
      })
  ),
  // Vitess <-- maybe just Redis? PostgresQL is another good choice here
  // Kafka <-- maybe just Redis for now?
} as const;
