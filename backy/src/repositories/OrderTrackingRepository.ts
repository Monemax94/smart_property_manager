import { injectable } from 'inversify';
import { OrderModel, IOrder, OrderStatus, ITrackingEvent, DeliveryStatus } from '../models/OrderModel';




export interface IOrderTrackingRepository {
    findById(orderId: string): Promise<IOrder | null>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder | null>;
    addTrackingEvent(orderId: string, event: ITrackingEvent): Promise<IOrder | null>;
    getTrackingHistory(orderId: string): Promise<ITrackingEvent[]>;
    generateTrackingNumber(): Promise<string>;
    updateOrderToOutForDelivery(
        orderId: string,
        event: ITrackingEvent,
        trackingNumber: string,
        trackingUrl: string
    ): Promise<IOrder | null>;
}

@injectable()
export class OrderTrackingRepository implements IOrderTrackingRepository {
    async findById(orderId: string): Promise<IOrder | null> {
        return OrderModel.findById(orderId).exec();
    }

    async updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder | null> {
        const order = await OrderModel.findByIdAndUpdate(
            orderId,
            { $set: { status } },
            { new: true }
        ).exec();

        if(status){
            await order.addOrUpdateTrackingEvent({
                status: OrderStatus.ORDER_PLACED,
                description: "Order placed successfully. Payment received.",
                timestamp: new Date()
              });
        }
        return order
    }

    async addTrackingEvent(orderId: string, event: ITrackingEvent): Promise<IOrder | null> {
        return OrderModel.findByIdAndUpdate(
            orderId,
            {
                $set: { status: event.status },
                $push: { trackingHistory: event }
            },
            { new: true }
        ).exec();
    }

    async getTrackingHistory(orderId: string): Promise<ITrackingEvent[]> {
        const order = await OrderModel.findById(orderId, 'trackingHistory').exec();
        return order?.trackingHistory || [];
    }
    async updateOrderToOutForDelivery(
        orderId: string,
        event: ITrackingEvent,
        trackingNumber: string,
        trackingUrl: string
    ): Promise<IOrder | null> {
        return OrderModel.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    status: OrderStatus.ONGOING,
                    trackingNumber,
                    trackingUrl,
                    deliveryStatus: DeliveryStatus.Shipped
                },
                $push: { trackingHistory: event }
            },
            { new: true }
        ).exec();
    }
    async generateTrackingNumber(): Promise<string> {
        const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
        const datePart = new Date().getTime().toString(36).toUpperCase();
        return `TRK-${datePart}-${randomPart}`;
    }
}