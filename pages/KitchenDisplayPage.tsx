
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Order, OrderStatus, OrderItem, MenuItem } from '../types';
import { FireIcon, CheckCircleIcon, ClockIcon, PlayIcon, PauseIcon, RefreshIcon } from '@/components/icons';
import ProgressBar from '@/components/shared/ProgressBar';
// Removed unused import: import { ORDER_STATUS_DURATIONS } from '../constants';


const formatTimeRemaining = (ms: number): string => {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
};

const KitchenOrderCard: React.FC<{ 
    order: Order, 
    kitchenItems: OrderItem[], // Pass only kitchen-relevant items
    onAdvanceStatus: (orderId: string, currentStatus: OrderStatus) => void,
    onToggleAutoProgress: (orderId: string) => void;
}> = ({ order, kitchenItems, onAdvanceStatus, onToggleAutoProgress }) => {
  const canAdvance = order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING;
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
  const showProgressBar = order.auto_progress && 
                         (order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING || order.status === OrderStatus.READY_FOR_PICKUP);
  
  let cardBgColor = 'bg-gray-400'; 
  if (order.status === OrderStatus.PENDING) cardBgColor = 'bg-yellow-500';
  else if (order.status === OrderStatus.PREPARING) cardBgColor = 'bg-blue-500';
  else if (order.status === OrderStatus.READY_FOR_PICKUP) cardBgColor = 'bg-green-500';
  
  const canToggleAutoProgress = order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING || order.status === OrderStatus.READY_FOR_PICKUP;

  if (kitchenItems.length === 0) return null; // Don't render card if no kitchen items for this order

  return (
    <div className={`p-4 rounded-lg shadow-md text-white ${cardBgColor}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
            <h3 className="text-lg font-semibold">Pedido #{order.id.substring(0,6)}</h3>
            <span className="text-xs font-medium">{new Date(order.order_time).toLocaleTimeString()}</span>
        </div>
         {canToggleAutoProgress && (
            <button 
                onClick={() => onToggleAutoProgress(order.id)} 
                className="p-0.5 rounded-full hover:bg-white/20"
                title={order.auto_progress ? "Pausar Progresso Automático" : "Ativar Progresso Automático"}
            >
                {order.auto_progress ? <PauseIcon className="w-5 h-5 text-white opacity-80"/> : <PlayIcon className="w-5 h-5 text-white opacity-90"/>}
            </button>
        )}
      </div>
      
      {showProgressBar && (
        <div className="my-2">
            <ProgressBar percent={progressPercent} barColor="bg-white/50" bgColor="bg-black/20" />
            {timeRemaining && <p className="text-xs text-white opacity-90 mt-1 text-right">Próx. etapa em: {timeRemaining}</p>}
        </div>
      )}
      {!order.auto_progress && (order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING) && (
         <p className="text-xs text-white opacity-80 italic my-1">Progresso automático desativado.</p>
      )}

      <ul className="mb-3 space-y-1">
        {kitchenItems.map((item, index) => (
          <li key={index} className="text-sm">
            <span className="font-semibold">{item.quantity}x</span> {item.name}
          </li>
        ))}
      </ul>
      {order.notes && <p className="text-xs italic mb-2">Obs: {order.notes}</p>}
      {canAdvance && (
        <button 
          onClick={() => onAdvanceStatus(order.id, order.status)}
          className="w-full bg-white text-primary font-semibold py-2 px-3 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center"
        >
          {order.status === OrderStatus.PENDING ? 'Iniciar Preparo' : 'Marcar como Pronto'}
          {order.status === OrderStatus.PENDING ? <FireIcon className="w-4 h-4 ml-2"/> : <CheckCircleIcon className="w-4 h-4 ml-2"/>}
        </button>
      )}
       {order.status === OrderStatus.READY_FOR_PICKUP && (
         <p className="text-sm font-semibold text-center mt-2">Pronto para Retirada/Entrega!</p>
       )}
    </div>
  );
};

const KitchenDisplayPage: React.FC = () => {
  const { orders, menuItems, updateOrderStatus, setAlert, forceCheckOrderTransitions, toggleOrderAutoProgress } = useAppContext();

  console.log('[KitchenDisplayPage] Orders from context:', JSON.parse(JSON.stringify(orders.map(o => ({id: o.id, name: o.customer_name, status: o.status, time: o.order_time})))));

  const getKitchenItemsForOrder = (order: Order): OrderItem[] => {
    return order.items.filter(orderItem => {
        const menuItem = menuItems.find(mi => mi.id === orderItem.menu_item_id);
        return menuItem?.send_to_kitchen !== false; // Default to true if undefined or null
    });
  };

  const ordersForKitchenDisplay = orders.filter(order => {
    const hasKitchenItems = order.items.some(orderItem => {
        const menuItem = menuItems.find(mi => mi.id === orderItem.menu_item_id);
        return menuItem?.send_to_kitchen !== false;
    });
    return hasKitchenItems && (order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING || order.status === OrderStatus.READY_FOR_PICKUP);
  }).sort((a,b) => new Date(a.order_time).getTime() - new Date(b.order_time).getTime());


  const pendingOrders = ordersForKitchenDisplay.filter(o => o.status === OrderStatus.PENDING);
  const preparingOrders = ordersForKitchenDisplay.filter(o => o.status === OrderStatus.PREPARING);
  const readyOrders = ordersForKitchenDisplay.filter(o => o.status === OrderStatus.READY_FOR_PICKUP);


  const handleAdvanceOrderStatus = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus | null = null;
    if (currentStatus === OrderStatus.PENDING) nextStatus = OrderStatus.PREPARING;
    else if (currentStatus === OrderStatus.PREPARING) nextStatus = OrderStatus.READY_FOR_PICKUP;
    
    if (nextStatus) {
      updateOrderStatus(orderId, nextStatus, true); 
      setAlert({ message: `Pedido #${orderId.substring(0,6)} atualizado para ${nextStatus}.`, type: 'info' });
    }
  };

  const handleToggleAutoProgress = (orderId: string) => {
    toggleOrderAutoProgress(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
        setAlert({ message: `Progresso automático ${!order.auto_progress ? 'ativado' : 'desativado'} para o pedido #${orderId.substring(0,6)}.`, type: 'info'});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
            <FireIcon className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-semibold text-gray-800">Painel da Cozinha</h1>
        </div>
        <button
            onClick={forceCheckOrderTransitions}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
            title="Forçar verificação de transições automáticas"
        >
            <RefreshIcon className="w-5 h-5 mr-2" /> Atualizar Fluxo
        </button>
      </div>
      
      {ordersForKitchenDisplay.length === 0 && (
         <div className="text-center py-10 bg-white rounded-lg shadow">
            <img src="https://picsum.photos/seed/empty-kitchen/150/150" alt="Nenhum pedido na cozinha" className="mx-auto mb-4 rounded-lg opacity-70" />
            <p className="text-gray-500 text-xl">Nenhum pedido ativo para a cozinha.</p>
            <p className="text-gray-400 mt-2">Novos pedidos com itens de cozinha aparecerão aqui.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-100 p-3 rounded-lg">
          <h2 className="text-xl font-semibold text-yellow-600 mb-3 flex items-center"><ClockIcon className="w-5 h-5 mr-2"/> Pendentes ({pendingOrders.length})</h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {pendingOrders.map(order => {
                 const kitchenItems = getKitchenItemsForOrder(order);
                 if (kitchenItems.length === 0) return null;
                 console.log(`[KitchenDisplayPage] Rendering PENDING card for order ID: ${order.id}, kitchenItems count: ${kitchenItems.length}`)
                 return <KitchenOrderCard key={order.id} order={order} kitchenItems={kitchenItems} onAdvanceStatus={handleAdvanceOrderStatus} onToggleAutoProgress={handleToggleAutoProgress}/>
                })}
            {pendingOrders.length === 0 && <p className="text-gray-500 italic text-center py-4">Nenhum pedido pendente para cozinha.</p>}
          </div>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-600 mb-3 flex items-center"><FireIcon className="w-5 h-5 mr-2"/> Em Preparo ({preparingOrders.length})</h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {preparingOrders.map(order => {
                 const kitchenItems = getKitchenItemsForOrder(order);
                 if (kitchenItems.length === 0) return null;
                 console.log(`[KitchenDisplayPage] Rendering PREPARING card for order ID: ${order.id}, kitchenItems count: ${kitchenItems.length}`)
                 return <KitchenOrderCard key={order.id} order={order} kitchenItems={kitchenItems} onAdvanceStatus={handleAdvanceOrderStatus} onToggleAutoProgress={handleToggleAutoProgress}/>
                })}
            {preparingOrders.length === 0 && <p className="text-gray-500 italic text-center py-4">Nenhum pedido em preparo na cozinha.</p>}
          </div>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-lg">
          <h2 className="text-xl font-semibold text-green-600 mb-3 flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2"/> Prontos ({readyOrders.length})</h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {readyOrders.map(order => {
                 const kitchenItems = getKitchenItemsForOrder(order);
                 if (kitchenItems.length === 0) return null;
                 console.log(`[KitchenDisplayPage] Rendering READY card for order ID: ${order.id}, kitchenItems count: ${kitchenItems.length}`)
                 return <KitchenOrderCard key={order.id} order={order} kitchenItems={kitchenItems} onAdvanceStatus={handleAdvanceOrderStatus} onToggleAutoProgress={handleToggleAutoProgress}/>
                })}
            {readyOrders.length === 0 && <p className="text-gray-500 italic text-center py-4">Nenhum pedido pronto na cozinha.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDisplayPage;
