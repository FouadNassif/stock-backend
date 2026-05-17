# Redis Cache

This document explains how Redis is used for caching and Redis-backed infrastructure support in the Stock Market Platform project.

## 1. Overview

Redis is used as an in-memory cache layer to reduce repeated MongoDB reads for frequently requested data. The project also uses Redis for rate limiting on sensitive authentication and OTP flows.

The NestJS app connects to Redis through the shared `RedisService`, exported globally by `RedisModule`. Redis must be running before testing cache-dependent features or Redis-backed rate limiting.

## 2. Redis Configuration

Redis-related environment variables used by the codebase:

| Variable | Purpose |
| --- | --- |
| `REDIS_HOST` | Redis hostname. Use `localhost` when NestJS runs locally and Redis is exposed from Docker. Use the Docker service name if NestJS runs inside Docker. |
| `REDIS_PORT` | Redis port. Local Docker default is `6379`. |
| `REDIS_PASSWORD` | Optional Redis password. Leave blank for the current local Docker Redis service. |
| `CACHE_STOCKS_TTL_SECONDS` | TTL, in seconds, for stock list/detail cache entries. |
| `CACHE_PORTFOLIO_TTL_SECONDS` | TTL, in seconds, for member portfolio cache entries. |

TTL values are measured in seconds. The local Docker Compose Redis container is named `stock-market-redis` and exposes port `6379`.

## 3. RedisService Responsibilities

`RedisService` wraps the `ioredis` client and centralizes cache/rate-limit operations.

| Method | Purpose |
| --- | --- |
| `set` | Stores a JSON-serialized value by key, optionally with an expiration TTL. |
| `get` | Reads a JSON value by key and parses it back to an object. |
| `delete` | Deletes one key. |
| `deleteMany` | Deletes multiple keys in one Redis call. |
| `exists` | Checks whether a key exists. |
| `expire` | Sets or updates a key TTL. |
| `ttl` | Returns the remaining TTL for a key. |
| `increment` | Increments a numeric key and optionally sets its TTL on first increment. |
| `remember` | Returns cached data when available, otherwise runs a callback, caches the result, and returns it. |
| `rememberWithSource` | Works like `remember`, but also returns whether the result came from `cache` or `database`. |
| `deleteByPattern` | Uses Redis scan behavior to delete grouped keys matching a pattern. |
| `checkRateLimit` | Uses `increment` and `ttl` to enforce request windows for rate limiting. |

`rememberWithSource` is used by stock and portfolio reads so API responses can include cache metadata.

## 4. Cache Key Strategy

Cache keys are defined in `src/common/redis/constants/cache-keys.constant.ts`.

| Cache Area | Key Pattern |
| --- | --- |
| Stock list | `cache:stocks:list:<queryKey>` |
| Stock detail | `cache:stocks:detail:<ticker>` |
| Stock current price | `cache:stocks:current-price:<stockId-or-ticker>` |
| Portfolio | `cache:portfolio:<memberId>` |
| All stock lists pattern | `cache:stocks:list:*` |

Stock list keys use the request query object with `clear` removed, serialized as JSON. This lets different filters, search values, pagination settings, and list query combinations create separate cache entries.

Portfolio keys are member-specific, so one member cannot read another member's cached portfolio.

The current-price key is defined and invalidated, but no separate current-price route was found in the inspected controllers. Check implementation before relying on that key directly.

## 5. Stock Cache

Stock list and detail responses are cached.

| Endpoint | Cache Behavior |
| --- | --- |
| `GET /stocks` | Caches stock catalogue/list responses based on query parameters. |
| `GET /stocks/:ticker` | Caches stock detail responses by ticker. |

The stock history endpoint, `GET /stocks/:ticker/history`, is not cached in the current implementation.

Stock cache behavior:

- First request for a key reads from MongoDB and returns `cache.source = database`.
- Repeated identical requests return `cache.source = cache` while the TTL is active.
- Different filters or pagination values create different stock list cache keys.
- Empty result sets can be cached because `rememberWithSource` caches whatever the database callback returns.
- `clear=1` or `clear=true` forces refresh where implemented.

## 6. Stock Cache Invalidation

Stock cache invalidation is implemented through `invalidateStockCache`.

Implemented invalidation points:

| Endpoint | Cache Invalidation |
| --- | --- |
| `POST /stocks/create` | Clears all stock list caches and the created stock detail/current-price keys. |
| `PATCH /stocks/:id/update` | Clears all stock list caches and the updated stock detail/current-price keys. |
| `PATCH /stocks/:id/delist` | Clears all stock list caches and the delisted stock detail/current-price keys. |

`PATCH /stocks/:id/listed` clears all stock list caches and the listed stock `detail/current-price keys`. Cached list/detail data may remain until TTL expiry or a manual `clear=1` refresh. Check implementation before relying on automatic cache invalidation for relisting.

## 7. Portfolio Cache

Member portfolio summaries are cached per member ID.

| Endpoint | Cache Behavior |
| --- | --- |
| `GET /orders/portfolio` | Caches the current member's open positions and portfolio summary. |

Portfolio cache behavior:

- First request after no key or after `clear=1` reads MongoDB and stores a cache entry.
- Repeated requests for the same member return `cache.source = cache` while the TTL is active.
- The response includes open positions and summary totals.
- Portfolio cache is member-specific through `cache:portfolio:<memberId>`.
- `clear=1` or `clear=true` forces refresh.

## 8. Portfolio Cache Eviction

Portfolio cache is evicted after successful trade execution.

| Endpoint | Cache Eviction |
| --- | --- |
| `POST /orders/buy` | Deletes `cache:portfolio:<memberId>` after the buy transaction completes. |
| `POST /orders/sell` | Deletes `cache:portfolio:<memberId>` after the sell transaction completes. |

The deletion happens after the MongoDB transaction block. If a buy or sell fails before completion, the cache should not be evicted by the normal success path. After a successful trade, the next portfolio request rebuilds the cache from MongoDB.

## 9. Manual Cache Refresh

Manual refresh is implemented with the `clear` query parameter on cached read routes.

Examples:

```txt
GET /stocks?clear=1
GET /stocks?sector=Technology&clear=true
GET /stocks/AAPL?clear=1
GET /orders/portfolio?clear=1
```

Routes with implemented clear behavior:

| Endpoint | Refresh Behavior |
| --- | --- |
| `GET /stocks` | Deletes the matching stock list cache key before reading data. |
| `GET /stocks/:ticker` | Deletes the matching stock detail cache key before reading data. |
| `GET /orders/portfolio` | Deletes the current member's portfolio cache key before reading data. |

After a clear request, the response should come from `database` and store a fresh cache entry. The next identical request should come from `cache`.

## 10. Rate Limiting Use

Redis is used for auth and OTP rate limiting.

The app creates two Redis counters per protected action:

- Combo key: `rate-limit:<action>:combo:<ip>:<target>`
- IP key: `rate-limit:<action>:ip:<ip>`

Counters expire based on configured time windows. If a limit is exceeded, the API returns a `429 Too Many Requests` response.

Rate-limited flows:

| Flow | Action Key |
| --- | --- |
| Member registration | `register` |
| Email OTP verification | `verify-otp` |
| Resend OTP | `resend-otp` |
| Member login | `login` |
| Forgot password | `forgot-password` |

Successful member login deletes the combo login rate-limit key for that email/IP pair.

## 11. Testing Redis Cache

Start local services:

```bash
docker compose up -d
```

Check containers:

```bash
docker ps
```

Open Redis CLI:

```bash
docker exec -it stock-market-redis redis-cli
```

Useful Redis commands for local testing:

```redis
KEYS cache:*
KEYS rate-limit:*
TTL <key>
GET <key>
DEL <key>
```

Use `KEYS` only in local development/testing, not production. In Postman, verify cache behavior by checking `cache.source` in cached route responses.

## 12. Common Issues

Redis container is not running:

- Start Docker Desktop.
- Run `docker compose up -d`.
- Confirm `stock-market-redis` appears in `docker ps`.

Wrong Redis host:

- Use `REDIS_HOST=localhost` when NestJS runs locally.
- Use the Docker service name if NestJS runs inside Docker.

NestJS logs Redis connection errors:

- Confirm `REDIS_PORT` matches the exposed Redis port.
- Confirm `REDIS_PASSWORD` is blank for the current local Docker Redis service.
- Check for the `Redis connected` log after startup.

Cache still reads from database:

- The key may have expired.
- `clear=1` or `clear=true` may be present.
- A write operation may have invalidated the key.
- The request query may differ, creating a different cache key.

Cached empty results:

- Empty results are expected if the first query returned no data and was cached.
- Use `clear=1` after creating or reseeding data.

Stale data after reseeding:

- Redis can keep old cache values until TTL expiry.
- Use `clear=1` on cached routes or delete local cache keys during testing.

## 13. Production Notes

- Do not use `KEYS` in production.
- Prefer `SCAN`-based grouped invalidation, as implemented by `deleteByPattern`.
- Use a proper Redis password in production.
- Keep TTL values reasonable for freshness and load reduction.
- Ensure cache invalidation happens after write operations.
- Monitor Redis memory usage and key growth.
