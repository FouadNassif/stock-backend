# FastAPI Analytics Service

## 1. Overview

The analytics service is a standalone FastAPI service separate from the main NestJS API.

NestJS exposes protected analytics routes under:

```txt
/api/analytics
```

Those NestJS routes validate the Admin JWT and roles, then proxy requests to FastAPI using `ANALYTICS_SERVICE_URL`. FastAPI reads MongoDB directly, so it must connect to the same MongoDB database used by the NestJS API.

## 2. Why FastAPI Exists

FastAPI is used to separate analytics concerns from the main business API and to satisfy the assignment analytics/bonus service requirement.

- Analytics queries are isolated from normal member, wallet, order, and CMS logic.
- MongoDB performs the heavier aggregation work.
- NestJS remains responsible for authentication, authorization, DTO validation, and the public API boundary.

## 3. Base URLs

| Service | URL |
| --- | --- |
| NestJS protected analytics proxy | `http://localhost:3000/api/analytics` |
| FastAPI internal service | `http://localhost:8000` |
| FastAPI Swagger docs | `http://localhost:8000/docs` |
| FastAPI health check | `GET http://localhost:8000/health` |

The FastAPI root route also responds at:

```txt
GET http://localhost:8000/
```

## 4. Startup

The FastAPI service is defined in `docker-compose.yml` as `analytics-service`.

Start all local services:

```bash
docker compose up -d
```

Rebuild and start only the analytics service when its Docker image needs to be rebuilt:

```bash
docker compose up -d --build analytics-service
```

Check running containers:

```bash
docker ps
```

Check service health:

```txt
GET http://localhost:8000/health
```

The service Dockerfile runs Uvicorn on port `8000`:

```txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 5. Environment Configuration

NestJS analytics integration uses:

| Variable | Used By | Purpose |
| --- | --- | --- |
| `ANALYTICS_SERVICE_URL` | NestJS | Base URL used by `AnalyticsService` to call FastAPI. Local example: `http://localhost:8000`. |

FastAPI uses:

| Variable | Used By | Purpose |
| --- | --- | --- |
| `MONGO_URI` | FastAPI | MongoDB connection string. Required by the FastAPI settings class. |
| `MONGO_DATABASE` | FastAPI | Check the `FastAPI settings` file and `Docker Compose` environment to confirm the database name. |
| `SERVICE_NAME` | FastAPI | Optional service name returned by the health endpoint. Defaults to `analytics-service`. |

Local hostnames can differ by runtime:

- When NestJS runs locally on Windows and MongoDB runs in Docker with exposed ports, NestJS can use `localhost`.
- When FastAPI runs inside Docker Compose, FastAPI usually connects to MongoDB through the Docker service name, such as `mongodb`.
- The database name must match. If NestJS writes to `stock_market_platform` but FastAPI reads another database, analytics routes can return empty data.

## 6. MongoDB Aggregation Requirement

The analytics service uses raw MongoDB aggregation pipelines for the main analytics queries. It should not load full collections into Python memory and calculate analytics with application-level loops.

MongoDB performs filtering, grouping, joining, sorting, pagination, and summation. FastAPI performs light validation and response formatting after the database returns aggregated results.

Aggregation stages used by the current analytics pipelines include:

- `$match`
- `$group`
- `$lookup`
- `$unwind`
- `$project`
- `$sort`
- `$skip`
- `$limit`
- `$count`

The admin summary uses MongoDB `count_documents` for member totals and an aggregation pipeline for pending withdrawal totals.

## 7. Analytics Endpoints

| Feature | NestJS Protected Route | FastAPI Internal Route | Purpose |
| --- | --- | --- | --- |
| Trading Volume Over Time | `GET /api/analytics/volume` | `GET /internal/analytics/volume` | Returns shares traded and value over time for one stock. |
| Top Traded Stocks | `GET /api/analytics/stocks/top` | `GET /internal/analytics/stocks/top` | Ranks stocks by completed trade activity. |
| Assets Under Management | `GET /api/analytics/aum` | `GET /internal/analytics/aum` | Calculates wallet balances plus open position value. |
| Most Active Members | `GET /api/analytics/members/active` | `GET /internal/analytics/members/active` | Lists members with the highest completed trade count. |
| Sector Allocation | `GET /api/analytics/sectors` | `GET /internal/analytics/sectors` | Shows open position value grouped by stock sector. |
| Admin Summary | `GET /api/analytics/admin/summary` | `GET /internal/analytics/admin/summary` | Summarizes member growth and pending withdrawals. |

## 8. Endpoint Details

### Trading Volume Over Time

- Query params: `stock_id`, `granularity`, `from`, `to`.
- Granularity: `day` or `month`.
- Purpose: total shares traded and total transaction value per time bucket.
- Data source: `orders` collection.
- Main aggregation idea: match completed buy/sell orders for one stock and date range, group by day/month, sum `quantity` and `totalAmount`.
- NestJS requires `granularity`; FastAPI has a direct-route default of `day`.

### Top Traded Stocks

- Query params: `page`, `limit`.
- Defaults: `page=1`, `limit=5`.
- Purpose: stocks ranked by completed trade count.
- Data source: `orders` and `stocks`.
- Main aggregation idea: group completed buy/sell orders by `stockId`, count trades, sum volume, count total groups, lookup stock details, sort, skip, and limit.

### AUM

- Purpose: total assets under management using wallet balances plus current market value of open positions.
- Data source: `members`, `positions`, and `stocks`.
- Main aggregation idea: sum member `walletBalance`, then match open positions, lookup stock prices, and sum `sharesHeld * stock.currentPrice`.

### Most Active Members

- Query params: `days`, `limit`.
- Defaults: `days=30`, `limit=10`.
- Purpose: members ranked by number of completed trades in a lookback window.
- Data source: `orders` and `members`.
- Main aggregation idea: match recent completed buy/sell orders, group by `memberId`, count trades, lookup member profile, sort by trade count, and limit.

### Sector Allocation

- Purpose: percentage of total AUM invested per sector.
- Data source: `positions` and `stocks`; total AUM is reused from the AUM calculation.
- Main aggregation idea: match open positions, lookup stock data, group current value by `stock.sector`, sort by value, and calculate percentage of total AUM in the response.

### Admin Summary

- Purpose: registered member totals, month-over-month growth, and pending withdrawal summary.
- Data source: `members` and `transactions`.
- Main calculation idea: count total/current-month/previous-month members, calculate growth rate, then aggregate pending withdrawal count and amount from withdrawal transactions.

## 9. Authentication and Authorization

FastAPI internal analytics endpoints do not implement authentication in the current code. The protected boundary is the NestJS API.

- NestJS checks Admin JWTs with `AdminJwtAuthGuard`.
- NestJS checks analytics roles with `AdminRolesGuard`.
- Admin and analyst roles can access the common analytics routes.
- `GET /api/analytics/admin/summary` is admin-only.
- If FastAPI is exposed outside the internal development network, add API-key, network, gateway, or service-to-service protection before production.

## 10. Postman Testing

The exported Postman collection is stored in `Documentation/postman/`.

When the Postman collection is exported, include analytics coverage for:

- Analytics - NestJS Protected Routes
- Analytics - FastAPI Internal Service

Use NestJS protected routes with an admin or analyst token. Use FastAPI direct routes only for service debugging, because direct FastAPI calls do not prove NestJS role protection.

Recommended test order:

1. Start Docker services.
2. Run seed data.
3. Check FastAPI health at `GET http://localhost:8000/health`.
4. Login as admin and analyst through NestJS.
5. Test NestJS analytics routes.
6. Test FastAPI internal routes directly if service debugging is needed.

## 11. Common Issues

FastAPI returns empty data:

- Confirm FastAPI is connected to the same MongoDB database as NestJS.
- Confirm seed data exists for orders, positions, stocks, members, and transactions.
- Confirm `MONGO_DATABASE` is `stock_market_platform` when using the project Docker Compose setup.

FastAPI container is not running:

- Run `docker ps`.
- Start services with `docker compose up -d`.
- Rebuild the service with `docker compose up -d --build analytics-service` if the image is stale.

NestJS cannot reach FastAPI:

- Confirm `ANALYTICS_SERVICE_URL` is correct for where NestJS is running.
- Use `http://localhost:8000` when NestJS runs locally and FastAPI exposes port `8000`.
- Use the Docker service hostname if NestJS is moved inside Docker.

MongoDB hostname differs:

- Local applications usually use `localhost`.
- Docker containers usually use the Compose service name, such as `mongodb`.

Proxy errors:

- NestJS returns `502` when FastAPI responds with an error.
- NestJS returns `503` when FastAPI is unavailable or cannot be reached.

## 12. Production Notes

- Keep FastAPI internal or protect it with API keys, gateway rules, or network restrictions before production.
- Do not expose internal analytics endpoints publicly without protection.
- Ensure MongoDB indexes support the aggregation query patterns.
- Monitor performance of heavy aggregation queries as data grows.
- Use environment-specific MongoDB URLs and database names.
