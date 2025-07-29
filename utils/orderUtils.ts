
import { OrderStatus } from '../types';

export const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PENDING: return 'bg-yellow-500';
    case OrderStatus.PREPARING: return 'bg-blue-500';
    case OrderStatus.READY_FOR_PICKUP: return 'bg-purple-500';
    case OrderStatus.OUT_FOR_DELIVERY: return 'bg-teal-500';
    case OrderStatus.DELIVERED: return 'bg-green-500';
    case OrderStatus.CANCELLED: return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export const formatTimeRemaining = (ms: number): string => {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
};
