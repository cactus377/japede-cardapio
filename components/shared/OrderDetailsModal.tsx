
import React from 'react';
import { Order, OrderStatus, OrderType, PaymentMethod } from '../../types';
import Modal from './Modal';
import { EyeIcon, ClockIcon, CheckCircleIcon, TruckIcon, BanIcon, DocumentTextIcon, DotsVerticalIcon, PlayIcon, PauseIcon, RefreshIcon, PlusIcon, TableIcon, CreditCardIcon, CurrencyDollarIcon } from '../icons';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

const getStatusColor = (status: OrderStatus): string => {
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

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <Modal title={`Detalhes do Pedido #${order.id.substring(0,6)}`} onClose={onClose}>
      <div className="space-y-3 text-gray-700 text-base"> {/* Base font size increased */}
        <p><strong>Cliente:</strong> {order.customer_name}</p>
        {order.customer_phone && <p><strong>Telefone:</strong> {order.customer_phone}</p>}
        {order.customer_address && <p><strong>Endereço:</strong> {order.customer_address}</p>}
        <p><strong>Horário:</strong> {new Date(order.order_time).toLocaleString()}</p>
        <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${getStatusColor(order.status)}`}>{order.status}</span></p>
        
        {order.order_type && (
            <p className="flex items-center"><strong>Tipo:</strong> 
            {order.order_type === OrderType.MESA && <TableIcon className="w-4 h-4 text-gray-600 mx-1"/>}
            {order.order_type === OrderType.DELIVERY && <TruckIcon className="w-4 h-4 text-gray-600 mx-1"/>}
            {order.order_type === OrderType.BALCAO && <ClockIcon className="w-4 h-4 text-gray-600 mx-1"/>}
            {order.order_type}
            {order.order_type === OrderType.MESA && order.table_id && ` (Mesa: ${order.table_id})`}
            </p>
        )}
        {order.payment_method && (
            <p className="flex items-center"><strong>Pagamento:</strong> 
            {order.payment_method === PaymentMethod.DINHEIRO && <CurrencyDollarIcon className="w-4 h-4 text-green-600 mx-1"/>}
            {(order.payment_method === PaymentMethod.CARTAO_CREDITO || order.payment_method === PaymentMethod.CARTAO_DEBITO) && <CreditCardIcon className="w-4 h-4 text-blue-600 mx-1"/>}
            {/* Add PIX icon if available */}
            {order.payment_method}
            </p>
        )}
        {order.payment_method === PaymentMethod.DINHEIRO && order.amount_paid !== undefined && order.amount_paid !== null && (
            <>
                <p><strong>Valor Pago:</strong> R$ {order.amount_paid.toFixed(2)}</p>
                {order.change_due !== undefined && order.change_due !== null && <p><strong>Troco:</strong> R$ {order.change_due.toFixed(2)}</p>}
            </>
        )}

        <p className="font-semibold text-lg">Total: R$ {order.total_amount.toFixed(2)}</p> {/* Total font size */}
        {order.notes && <p><strong>Observações:</strong> {order.notes}</p>}
            <div className="pt-2 border-t mt-3">
            <p className="text-sm"><strong>Últ. Att. Status:</strong> {new Date(order.last_status_change_time).toLocaleString()}</p> {/* Sub-detail font size adjusted */}
            <p className="text-sm"><strong>Prog. Automático:</strong> {order.auto_progress ? 'Ativo' : 'Desativado'}</p> {/* Sub-detail font size adjusted */}
            {order.auto_progress && order.next_auto_transition_time &&
                <p className="text-sm"><strong>Próx. Transição:</strong> {new Date(order.next_auto_transition_time).toLocaleTimeString()}</p>
            }
        </div>
        <div>
            <h5 className="font-semibold text-lg mb-1 mt-2">Itens:</h5> {/* Items title font size */}
            <ul className="list-disc list-inside pl-1 space-y-1 text-lg max-h-48 overflow-y-auto"> {/* Items list font size changed to text-lg */}
            {order.items.map((item, index) => (
                <li key={index}>
                {item.quantity}x {item.name} (R$ {item.price.toFixed(2)} cada)
                </li>
            ))}
            </ul>
        </div>
        <div className="mt-6 flex justify-end">
            <button 
            onClick={onClose}
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
            >
            Fechar
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderDetailsModal;
