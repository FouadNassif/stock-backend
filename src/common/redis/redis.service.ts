import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export type RateLimitResult = {
  allowed: boolean;
  attempts: number;
  remainingAttempts: number;
  ttlSeconds: number;
};

export type CacheSource = 'cache' | 'database';

export type CacheRememberResult<T> = {
  value: T;
  source: 'cache' | 'database';
};
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST') ?? 'localhost',
      port: this.configService.get<number>('REDIS_PORT') ?? 6379,
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.set(key, serializedValue, 'EX', ttlSeconds);
      return;
    }

    await this.client.set(key, serializedValue);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    await this.client.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const value = await this.client.incr(key);

    if (ttlSeconds && value === 1) {
      await this.client.expire(key, ttlSeconds);
    }

    return value;
  }

  async remember<T>(
    key: string,
    ttlSeconds: number,
    callback: () => Promise<T>,
  ): Promise<T> {
    const cachedValue = await this.get<T>(key);

    if (cachedValue !== null) {
      return cachedValue;
    }

    const freshValue = await callback();

    await this.set(key, freshValue, ttlSeconds);

    return freshValue;
  }

  async rememberWithSource<T>(
    key: string,
    ttlSeconds: number,
    callback: () => Promise<T>,
  ): Promise<CacheRememberResult<T>> {
    const cachedValue = await this.get<T>(key);

    if (cachedValue !== null) {
      return {
        value: cachedValue,
        source: 'cache',
      };
    }

    const freshValue = await callback();

    await this.set(key, freshValue, ttlSeconds);

    return {
      value: freshValue,
      source: 'database',
    };
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({
      match: pattern,
      count: 100,
    });

    const keysToDelete: string[] = [];

    for await (const keys of stream) {
      keysToDelete.push(...(keys as string[]));

      if (keysToDelete.length >= 100) {
        await this.deleteMany(keysToDelete.splice(0, keysToDelete.length));
      }
    }

    if (keysToDelete.length > 0) {
      await this.deleteMany(keysToDelete);
    }
  }

  async checkRateLimit(params: {
    key: string;
    maxAttempts: number;
    windowSeconds: number;
  }): Promise<RateLimitResult> {
    const attempts = await this.increment(params.key, params.windowSeconds);
    const ttlSeconds = await this.ttl(params.key);

    const remainingAttempts = Math.max(params.maxAttempts - attempts, 0);

    return {
      allowed: attempts <= params.maxAttempts,
      attempts,
      remainingAttempts,
      ttlSeconds: ttlSeconds > 0 ? ttlSeconds : params.windowSeconds,
    };
  }
}
