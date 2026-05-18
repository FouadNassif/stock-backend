import { OrderResponse } from '../orders.service';
import { OrderDocument } from '../schemas/order.schema';

export function toOrderResponse(order: OrderDocument): OrderResponse {
  return {
    id: order._id.toString(),
    memberId: order.memberId.toString(),
    stockId: order.stockId.toString(),
    positionId: order.positionId.toString(),
    type: order.type,
    quantity: order.quantity,
    priceAtExecution: order.priceAtExecution,
    totalAmount: order.totalAmount,
    status: order.status,
    realizedProfitLoss: order.realizedProfitLoss,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
