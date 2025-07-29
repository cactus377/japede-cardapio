
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Order, OrderStatus, OrderType, CashRegisterSessionStatus } from '../types'; 
import OrderDetailsModal from '@/components/shared/OrderDetailsModal';
import ManualOrderFormModal from '@/components/shared/ManualOrderFormModal';
import { ArrowsExpandIcon, XIcon, PlusIcon, RefreshIcon, EyeIcon } from '@/components/icons';
import Alert from '@/components/shared/Alert';
import OrderCardComponent from '@/components/OrderDashboardPage/OrderCard'; 
import { ORDER_STATUS_ICONS, ORDER_STATUS_COLUMN_TITLES } from '../constants';


const OrderDashboardPage: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    alert, 
    setAlert, 
    forceCheckOrderTransitions, 
    toggleOrderAutoProgress, 
    activeCashSession,
    shouldOpenManualOrderModal, 
    dispatch 
  } = useAppContext();

  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null); 
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false); 
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false); 
  const [expandedColumnKey, setExpandedColumnKey] = useState<string | null>(null);
  const [showOldArchived, setShowOldArchived] = useState<boolean>(false);

  console.log('[OrderDashboardPage] Orders from context:', JSON.parse(JSON.stringify(orders.map(o => ({id: o.id, name: o.customer_name, status: o.status, time: o.order_time})))));

  useEffect(() => {
    if (shouldOpenManualOrderModal) {
      setIsManualOrderModalOpen(true);
      dispatch({ type: 'SET_SHOULD_OPEN_MANUAL_ORDER_MODAL', payload: false });
    }
  }, [shouldOpenManualOrderModal, dispatch]);

  const ordersToDisplay = useMemo(() => {
    if (showOldArchived) {
        return orders; 
    }
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000; // 10 minutes in milliseconds
    return orders.filter(order => {
        if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
            // Ensure last_status_change_time is a valid date before getTime()
            const lastChangeTime = new Date(order.last_status_change_time).getTime();
            return !isNaN(lastChangeTime) && lastChangeTime >= tenMinutesAgo;
        }
        return true; // Keep all other statuses
    });
  }, [orders, showOldArchived]);


  const handleToggleExpandColumn = (key: string) => {
    setExpandedColumnKey(prevKey => (prevKey === key ? null : key));
  };

  const openOrderDetailsModal = (order: Order) => { 
    setSelectedOrderForDetails(order);
    setIsOrderDetailsModalOpen(true);
  };

  const closeOrderDetailsModal = () => { 
    setSelectedOrderForDetails(null);
    setIsOrderDetailsModalOpen(false);
  }

  const handleUpdateStatus = (id: string, status: OrderStatus, manual: boolean = true) => {
    updateOrderStatus(id, status, manual); 
    if (manual) {
        setAlert({ message: `Status do pedido #${id.substring(0,6)} atualizado para ${status}.`, type: 'info'});
    }
  };
  
  const handleToggleAutoProgress = (orderId: string) => {
    toggleOrderAutoProgress(orderId);
    const order = orders.find(o => o.id === orderId); // Use original 'orders' to find the order for alert
    if (order) {
        setAlert({ message: `Progresso automático ${!order.auto_progress ? 'ativado' : 'desativado'} para o pedido #${orderId.substring(0,6)}.`, type: 'info'});
    }
  };
  
  const orderColumnsConfig: { key: string; title: string; statuses: OrderStatus[]; icon: React.ReactNode }[] = [
    { key: OrderStatus.PENDING, title: ORDER_STATUS_COLUMN_TITLES[OrderStatus.PENDING], statuses: [OrderStatus.PENDING], icon: ORDER_STATUS_ICONS[OrderStatus.PENDING] },
    { key: OrderStatus.PREPARING, title: ORDER_STATUS_COLUMN_TITLES[OrderStatus.PREPARING], statuses: [OrderStatus.PREPARING], icon: ORDER_STATUS_ICONS[OrderStatus.PREPARING] }, 
    { key: 'READY_OUT', title: 'Pronto/Entrega', statuses: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY], icon: ORDER_STATUS_ICONS[OrderStatus.READY_FOR_PICKUP] },
    { key: OrderStatus.DELIVERED, title: ORDER_STATUS_COLUMN_TITLES[OrderStatus.DELIVERED], statuses: [OrderStatus.DELIVERED], icon: ORDER_STATUS_ICONS[OrderStatus.DELIVERED] },
    { key: OrderStatus.CANCELLED, title: ORDER_STATUS_COLUMN_TITLES[OrderStatus.CANCELLED], statuses: [OrderStatus.CANCELLED], icon: ORDER_STATUS_ICONS[OrderStatus.CANCELLED] },
  ];


  return (
    <div className="space-y-6">
       {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className={`flex flex-wrap justify-between items-center gap-4 ${expandedColumnKey ? 'hidden' : ''}`}>
        <h2 className="text-3xl font-semibold text-gray-800">Painel de Pedidos</h2>
        <div className="flex gap-2 flex-wrap">
            <button
                onClick={() => {
                    console.log('[OrderDashboardPage] "Novo Pedido Manual" button clicked. Setting isManualOrderModalOpen to true.');
                    setIsManualOrderModalOpen(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
            >
                <PlusIcon className="w-5 h-5 mr-2" /> Novo Pedido Manual
            </button>
            <button
                onClick={forceCheckOrderTransitions}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                title="Forçar verificação de transições automáticas"
            >
                <RefreshIcon className="w-5 h-5 mr-2" /> Atualizar Fluxo
            </button>
            <button
                onClick={() => setShowOldArchived(!showOldArchived)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                title={showOldArchived ? "Ocultar pedidos finalizados há mais de 10 min" : "Mostrar todos os pedidos finalizados"}
            >
                {showOldArchived ? "Ocultar Antigos" : "Ver Antigos"} <EyeIcon className="w-5 h-5 ml-2" />
            </button>
        </div>
      </div>
      
      {ordersToDisplay.length === 0 && !expandedColumnKey && (
         <div className="text-center py-10 bg-white rounded-lg shadow">
            <img src="https://picsum.photos/seed/empty-orders/150/150" alt="Nenhum pedido" className="mx-auto mb-4 rounded-lg opacity-70" />
            <p className="text-gray-500 text-xl">Nenhum pedido encontrado.</p>
            <p className="text-gray-400 mt-2">Novos pedidos aparecerão aqui assim que forem recebidos ou ajuste os filtros de visualização.</p>
        </div>
      )}

      <div className={`gap-6 ${expandedColumnKey ? 'flex h-full' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
        {orderColumnsConfig.map(col => {
          let columnOrders = ordersToDisplay.filter(order => col.statuses.includes(order.status));
          const todayDateString = new Date().toDateString();

          if (col.key === OrderStatus.DELIVERED) {
            columnOrders = columnOrders.filter(order => {
              const orderDateString = new Date(order.order_time).toDateString();
              return orderDateString !== todayDateString; 
            });
          } else if (col.key === OrderStatus.CANCELLED) {
            columnOrders = columnOrders.filter(order => {
              const orderDateString = new Date(order.order_time).toDateString();
              if (orderDateString !== todayDateString) {
                return true; 
              }
              return activeCashSession && activeCashSession.status === CashRegisterSessionStatus.OPEN;
            });
          }
          
          const columnKey = col.key;
          const isExpanded = expandedColumnKey === columnKey;
          const isAnotherColumnExpanded = expandedColumnKey !== null && !isExpanded;

          return (
            <div 
                key={columnKey} 
                className={`
                    ${isExpanded ? 'flex flex-col flex-1 w-full bg-gray-200 p-4 rounded-lg shadow-xl' : 
                    isAnotherColumnExpanded ? 'hidden' : 
                    'bg-gray-100 p-4 rounded-lg shadow-sm flex flex-col'}
                `}
            >
              <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-300 flex items-center justify-between">
                <span className="flex items-center">
                    {col.icon} {col.title} ({columnOrders.length})
                </span>
                <button
                  onClick={() => handleToggleExpandColumn(columnKey)}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                  title={isExpanded ? "Recolher coluna" : "Expandir coluna"}
                  aria-label={isExpanded ? "Recolher coluna" : "Expandir coluna"}
                >
                  {isExpanded ? <XIcon className="w-5 h-5" /> : <ArrowsExpandIcon className="w-5 h-5" />}
                </button>
              </h3>
              <div className={`
                ${isExpanded 
                    ? 'flex-grow flex flex-row flex-wrap gap-4 p-1 overflow-y-auto overflow-x-auto' 
                    : 'h-[60vh] space-y-3 pr-1 overflow-y-auto' 
                }
              `}>
                {columnOrders.length > 0 ? (
                    columnOrders.sort((a,b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()) 
                                .map(order => (
                                    <div key={order.id} className={`${isExpanded ? 'w-80 flex-shrink-0' : ''}`}>
                                        <OrderCardComponent 
                                            order={order} 
                                            onOpenDetails={openOrderDetailsModal} 
                                            onUpdateStatus={handleUpdateStatus}
                                            onToggleAutoProgress={handleToggleAutoProgress} 
                                        />
                                    </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-sm italic text-center pt-4">Nenhum pedido aqui.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isOrderDetailsModalOpen && ( 
        <OrderDetailsModal 
            order={selectedOrderForDetails} 
            onClose={closeOrderDetailsModal} 
        />
      )}
      {isManualOrderModalOpen && (
        <ManualOrderFormModal 
            isOpen={isManualOrderModalOpen} 
            onClose={() => setIsManualOrderModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default OrderDashboardPage;