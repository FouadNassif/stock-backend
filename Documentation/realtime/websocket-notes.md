# Realtime and WebSocket Notes

This document explains realtime/WebSocket behavior and RabbitMQ event flow in the Stock Market Platform project.

## 1. Overview

The project supports realtime portfolio update notifications through a RabbitMQ and Socket.IO layer. REST APIs remain the main API surface; realtime messages are an additional update mechanism that helps connected clients refresh UI after important state changes.

Implemented realtime behavior:

- RabbitMQ publishes notification and realtime events.
- Socket.IO pushes portfolio update messages to connected member clients.
- Buy/sell trade flows publish `portfolio.updated` realtime events after successful execution.
- Email-style notification events are handled separately through the notification queue.

## 2. RabbitMQ Configuration

RabbitMQ environment variables used by the codebase:

| Variable | Purpose |
| --- | --- |
| `RABBITMQ_URL` | RabbitMQ connection URL used by NestJS microservice clients and consumers. |
| `RABBITMQ_NOTIFICATION_QUEUE` | Queue used for email/notification events. |
| `RABBITMQ_REALTIME_QUEUE` | Queue used for realtime WebSocket events. |

RabbitMQ must be running before event publishing and consuming can work. The NestJS app starts two RMQ microservice connections in `main.ts`, one for the notification queue and one for the realtime queue.

Local Docker Compose RabbitMQ service:

| Item | Value |
| --- | --- |
| Container | `stock-market-rabbitmq` |
| AMQP port | `localhost:5672` |
| Management UI | `http://localhost:15672` |
| Local username | `stock_market` |
| Local password | `stock_market_password` |

These credentials are local development values from `docker-compose.yml`.

## 3. Realtime Architecture

```txt
Member buys/sells stock
        |
        v
NestJS Orders Service
        |
        |-- Updates MongoDB transaction/order/position/wallet
        |-- Evicts Redis portfolio cache
        |
        v
Publishes realtime/notification event
        |
        v
RabbitMQ queue
        |
        v
Realtime consumer / WebSocket gateway
        |
        v
Connected client receives event
```

Trade operations update database state first inside the order service transaction flow. After a successful trade, the service evicts the member portfolio cache, publishes a realtime event, and publishes a trade confirmation notification event. Clients can use the realtime event as a hint to refresh portfolio data through REST.

## 4. WebSocket Server

The WebSocket server is implemented by `PortfolioGateway` using Socket.IO through NestJS `@WebSocketGateway`.

| Behavior | Implementation |
| --- | --- |
| Library | Socket.IO via `@nestjs/websockets` and `socket.io`. |
| URL | Same NestJS host, for example `http://localhost:3000`. |
| Namespace | Default namespace; no custom namespace is configured. |
| Socket.IO path | Default Socket.IO path; no custom path is configured. |
| CORS | `origin: '*'` in the gateway. |
| Auth | Member JWT required during socket connection. |
| Room | `member:<memberId>:portfolio`. |

Connection behavior:

- The gateway extracts a token from `handshake.auth.token` first.
- If no auth token is present, it checks the `Authorization: Bearer <token>` header.
- The token is verified with `JWT_SECRET`.
- The decoded payload must have `type = member`.
- Invalid or missing tokens cause the socket to be disconnected.

## 5. Client Authentication

Realtime portfolio connections use a member JWT, not an admin JWT.

Socket.IO auth example:

```js
const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  auth: {
    token: memberToken
  }
});
```

Bearer header authentication is also supported by the gateway:

```txt
Authorization: Bearer <member_token>
```

Do not send tokens in public logs, screenshots, or committed test files.

## 6. Rooms and Events

Actual Socket.IO events found in the codebase:

| Event | Direction | Payload | Purpose |
| --- | --- | --- | --- |
| `portfolio.join` | Client -> Server | No body required; member is identified from JWT. | Joins the authenticated member's portfolio room. |
| `portfolio.joined` | Server -> Client | `{ "memberId": "..." }` | Confirms the socket joined the portfolio room. |
| `portfolio.updated` | Server -> Client | `PortfolioUpdatedPayload` | Notifies the member after a successful buy/sell trade. |

Room naming:

```txt
member:<memberId>:portfolio
```

The `portfolio.join` handler also returns:

```json
{
  "message": "Joined portfolio room"
}
```

depending on how the Socket.IO client handles acknowledgement responses.

## 7. Payload Examples

Buy order realtime payload:

```json
{
  "memberId": "example-member-id",
  "walletBalance": 4250,
  "orderId": "example-order-id",
  "orderType": "buy",
  "realizedProfitLoss": 0
}
```

Sell order realtime payload:

```json
{
  "memberId": "example-member-id",
  "walletBalance": 5125,
  "orderId": "example-order-id",
  "orderType": "sell",
  "realizedProfitLoss": 125
}
```

The `PortfolioUpdatedPayload` type also defines optional portfolio summary fields such as `totalPositions`, `totalInvestedValue`, `totalCurrentValue`, and `totalUnrealizedProfitLoss`, but the current buy/sell implementation does not populate those fields.

## 8. Trade Flow Realtime Behavior

### Buy Order

1. Buy validation runs for member eligibility, listed stock, quantity, and wallet balance.
2. MongoDB transaction updates wallet, order, position, and transaction records.
3. Portfolio cache is evicted with `cache:portfolio:<memberId>`.
4. Realtime event `portfolio.updated` is published to RabbitMQ.
5. Notification event `trade_confirmation.email.requested` is published to RabbitMQ.
6. Realtime consumer forwards the payload to the member's Socket.IO room.
7. Client receives the event and can refresh `GET /orders/portfolio`.

### Sell Order

1. Sell validation runs for member eligibility, stock, open position, and share quantity.
2. MongoDB transaction updates wallet, order, position, and transaction records.
3. Portfolio cache is evicted with `cache:portfolio:<memberId>`.
4. Realtime event `portfolio.updated` is published to RabbitMQ.
5. Notification event `trade_confirmation.email.requested` is published to RabbitMQ.
6. Realtime consumer forwards the payload to the member's Socket.IO room.
7. Client receives the event and can refresh `GET /orders/portfolio`.

If a trade fails, realtime and trade-confirmation events are not sent through the normal success path.

## 9. Notification Events

Notification events are separate from WebSocket realtime events.

- Notification queue: handles email/notification work.
- Realtime queue: handles immediate UI update events.

Notification events found in the codebase:

| Event | Purpose |
| --- | --- |
| `otp.email.requested` | Sends registration OTP email. |
| `password_reset_otp.email.requested` | Sends password reset OTP email. |
| `new_admin.email.requested` | Sends new admin temporary password email. |
| `wallet_credit.email.requested` | Sends wallet deposit confirmation email. |
| `withdrawal.approved.email.requested` | Sends withdrawal approved email. |
| `withdrawal.rejected.email.requested` | Sends withdrawal rejected email. |
| `trade_confirmation.email.requested` | Sends buy/sell trade confirmation email. |
| `identity.approved.email.requested` | Sends identity approved email. |
| `identity.rejected.email.requested` | Sends identity rejected email. |
| `member.suspended.email.requested` | Sends member suspended email. |
| `price_alert.triggered` | Sends price alert triggered email. |

The notification consumer receives these events and calls `NotificationsService`, which sends email through Nodemailer.

## 10. Testing Realtime Locally

Start Docker services:

```bash
docker compose up -d
```

Start NestJS:

```bash
npm run start:dev
```

Testing steps:

1. Run seed data if needed.
2. Login as a member and copy the member JWT.
3. Connect a Socket.IO client to `http://localhost:3000` with the member token.
4. Emit `portfolio.join`.
5. Confirm `portfolio.joined` is received.
6. Execute `POST /orders/buy` or `POST /orders/sell`.
7. Watch for `portfolio.updated`.
8. Refresh `GET /orders/portfolio` after receiving the event.

Minimal Socket.IO client pattern:

```js
const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  auth: {
    token: memberToken
  }
});

socket.on('connect', () => {
  socket.emit('portfolio.join');
});

socket.on('portfolio.joined', console.log);
socket.on('portfolio.updated', console.log);
socket.on('connect_error', (error) => console.error(error.message));
```

Postman collection documents REST triggers. WebSocket behavior should be tested with a Socket.IO client or frontend.

RabbitMQ local debugging:

- Open `http://localhost:15672`.
- Login with local Docker credentials.
- Check `notification_events` and `realtime_events` queues.
- Use the management UI only for local debugging, not as the main test proof.

## 11. Common Issues

RabbitMQ container is not running:

- Run `docker compose up -d`.
- Confirm `stock-market-rabbitmq` appears in `docker ps`.

Wrong `RABBITMQ_URL`:

- Use the local Docker URL when NestJS runs locally.
- Use the Docker service hostname if NestJS runs inside Docker.

Queue name mismatch:

- Confirm `RABBITMQ_NOTIFICATION_QUEUE` and `RABBITMQ_REALTIME_QUEUE` match the configured queue names.

WebSocket connection rejected:

- Confirm the member JWT is present.
- Confirm the token is not expired.
- Confirm the token payload type is `member`, not `admin`.

Event not received:

- Confirm the client emitted `portfolio.join`.
- Confirm the client is logged in as the same member who performed the trade.
- Confirm the trade succeeded.
- Confirm the RabbitMQ realtime consumer is running as part of the NestJS app.

Cache/UI still stale:

- Realtime events are hints. If the payload is not enough to update UI, call `GET /orders/portfolio`.
- The portfolio cache is evicted after successful buy/sell, so the next REST portfolio request should rebuild from MongoDB.

## 12. Production Notes

- Protect WebSocket connections with JWT authentication.
- Do not expose RabbitMQ publicly.
- Use production-safe RabbitMQ credentials and network rules.
- Durable queues are configured, but production may also require explicit dead-letter and retry behavior.
- Monitor message failures and consumer health.
- Avoid sending sensitive data in realtime payloads.
- Treat realtime events as hints; REST endpoints remain the source of truth.
- Clients should refetch portfolio data after `portfolio.updated` if they need the full latest portfolio.
