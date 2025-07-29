import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderType } from '../../types';
import { EyeIcon, ClockIcon, PauseIcon, PlayIcon, TableIcon, TruckIcon } from '../icons';
import ProgressBar from '@/shared/ProgressBar';
import { getStatusColor, formatTimeRemaining } from '@/utils/orderUtils';

interface OrderCardProps {
  order: Order;
  onOpenDetails: (order: Order) => void;
  onUpdateStatus: (id: string, status: OrderStatus, manual: boolean) => void;
  onToggleAutoProgress: (orderId: string) => void;
}

const OrderCardComponent: React.FC<OrderCardProps> = ({ order, onOpenDetails, onUpdateStatus, onToggleAutoProgress }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    let intervalId: number | undefined;
    if (order.auto_progress && order.next_auto_transition_time) {
      const updateTimer = () => {
        const remaining = new Date(order.next_auto_transition_time!).getTime() - Date.now();
        setTimeRemaining(formatTimeRemaining(remaining > 0 ? remaining : 0));
      };
      updateTimer();
      intervalId = window.setInterval(updateTimer, 1000);
    } else {
      setTimeRemaining('');
    }
    return () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [order.auto_progress, order.next_auto_transition_time]);

  const progressPercent = order.current_progress_percent !== undefined ? order.current_progress_percent : 0;
  const showProgressBar = order.auto_progress && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED;
  const canToggleAutoProgress = order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED;

  const getOrderTypeIcon = (type?: OrderType) => {
    switch (type) {
      case OrderType.MESA: return <TableIcon className="w-4 h-4 text-gray-500 mr-1" title="Pedido de Mesa" />;
      case OrderType.DELIVERY: return <TruckIcon className="w-4 h-4 text-gray-500 mr-1" title="Pedido para Entrega" />;
      case OrderType.BALCAO: return <ClockIcon className="w-4 h-4 text-gray-500 mr-1" title="Pedido para Balcão/Retirada" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-150 ease-in-out">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
            {getOrderTypeIcon(order.order_type)}
            Pedido #{order.id.substring(0, 6)}
            {order.order_type === OrderType.MESA && order.table_id && <span className="text-xs text-gray-500 ml-1">(Mesa: {order.table_id})</span>}
          </h4>
          <p className="text-sm text-gray-600">{order.customer_name}</p>
          <p className="text-xs text-gray-500">{new Date(order.order_time).toLocaleTimeString()}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          {canToggleAutoProgress && (
            <button
              onClick={() => onToggleAutoProgress(order.id)}
              className="mt-1 p-0.5 rounded-full hover:bg-gray-200"
              title={order.auto_progress ? "Pausar Progresso Automático" : "Ativar Progresso Automático"}>
              {order.auto_progress ? <PauseIcon className="w-4 h-4 text-gray-600" /> : <PlayIcon className="w-4 h-4 text-green-600" />}
            </button>
          )}
        </div>
      </div>
      <p className="text-gray-700 font-bold my-2">Total: R$ {order.total_amount.toFixed(2)}</p>
      {showProgressBar && (
        <div className="my-2">
          <ProgressBar percent={progressPercent} />
          {timeRemaining && <p className="text-xs text-gray-500 mt-1 text-right">Próx. etapa em: {timeRemaining}</p>}
        </div>
      )}
      {!order.auto_progress && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
        <p className="text-xs text-gray-400 italic my-1">Progresso automático desativado.</p>
      )}
      <div className="mt-3 flex justify-between items-center text-sm">
        <button
          onClick={() => onOpenDetails(order)}
          className="text-primary hover:text-primary-dark font-medium flex items-center">
          <EyeIcon className="w-4 h-4 mr-1" /> Ver Detalhes
        </button>
        <select
          value={order.status}
          onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus, true)}
          className="border border-gray-300 rounded-md p-1 text-xs focus:ring-primary focus:border-primary"
          disabled={order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED}>
          {Object.values(OrderStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default OrderCardComponent;
