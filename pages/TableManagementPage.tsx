
import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Table, TableStatus, ReservationDetails, Order, OrderStatus } from '../types';
import { TicketIcon, PlusIcon, PencilAltIcon, TrashIcon, EyeIcon, CalendarIcon, UsersIcon } from '@/components/icons';
import Modal from '@/components/shared/Modal'; 
import TableFormModal from '@/components/shared/TableFormModal';
import TableActionModal from '@/components/shared/TableActionModal';
import ReservationFormModal from '@/components/shared/ReservationFormModal';
import ManualOrderFormModal from '@/components/shared/ManualOrderFormModal';
import OrderDetailsModal from '@/components/shared/OrderDetailsModal'; // Remains for non-table specific order viewing if needed elsewhere
import ActiveTableOrderModal from '@/components/shared/ActiveTableOrderModal'; // New Modal
import Alert from '@/components/shared/Alert';

const TableManagementPage: React.FC = () => {
  const { tables, orders, addTable, updateTable, deleteTable, setAlert, alert, fetchOrderWithItems } = useAppContext();

  const [isTableFormModalOpen, setIsTableFormModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  
  const [selectedTableForAction, setSelectedTableForAction] = useState<Table | null>(null);
  const [isTableActionModalOpen, setIsTableActionModalOpen] = useState(false);
  
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [tableToReserve, setTableToReserve] = useState<Table | null>(null);

  const [isManualOrderModalOpenForTable, setIsManualOrderModalOpenForTable] = useState(false);
  const [initialTableIdForOrder, setInitialTableIdForOrder] = useState<string | null>(null);
  
  // State for the new ActiveTableOrderModal
  const [isActiveTableOrderModalOpen, setIsActiveTableOrderModalOpen] = useState(false);
  const [activeOrderForTable, setActiveOrderForTable] = useState<Order | null>(null);
  const [activeTableContext, setActiveTableContext] = useState<Table | null>(null);


  const openNewTableModal = () => {
    setEditingTable(null);
    setIsTableFormModalOpen(true);
  };

  const openEditTableModal = (table: Table) => {
    setEditingTable(table);
    setIsTableFormModalOpen(true);
  };

  const handleDeleteTable = (tableId: string, tableName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a mesa "${tableName}"? Esta ação não pode ser desfeita.`)) {
      deleteTable(tableId);
    }
  };

  const handleTableCardClick = (table: Table) => {
    setSelectedTableForAction(table);
    setIsTableActionModalOpen(true);
  };

  const handleInitiateOrder = (tableId: string) => {
    setInitialTableIdForOrder(tableId);
    setIsManualOrderModalOpenForTable(true);
    setIsTableActionModalOpen(false); 
  };

  // This function will now open the ActiveTableOrderModal
  const handleOpenActiveTableOrder = async (orderId: string, tableId: string) => {
    let order = orders.find(o => o.id === orderId);
    const table = tables.find(t => t.id === tableId);

    if (!order && fetchOrderWithItems) { // If order not found in local state, try fetching
        setAlert({ message: `Consultando detalhes do pedido ${orderId.substring(0,6)}...`, type: "info" });
        try {
            const fetchedOrder = await fetchOrderWithItems(orderId);
            if (fetchedOrder) {
                 order = fetchedOrder;
                 // Note: The main 'orders' state in AppContext will be updated via realtime or next full fetch.
                 // This fetchedOrder is used for this modal instance.
            }
        } catch (e) {
            console.error("Failed to fetch order on demand for modal:", e);
            // Alert will be set by the final check below if order is still not found.
        }
    }

    if (order && table) {
      setActiveOrderForTable(order);
      setActiveTableContext(table);
      setIsActiveTableOrderModalOpen(true);
      if (alert?.message.startsWith("Consultando")) setAlert(null); // Clear "Consultando..." message if it was set
    } else {
      let errorMessage = "Pedido ou mesa não encontrado.";
      if (!order && table) errorMessage = `Pedido com ID ${orderId.substring(0,6)} não foi encontrado. Tente novamente em instantes.`;
      else if (order && !table) errorMessage = `Mesa com ID ${tableId} não foi encontrada.`;
      else if (!order && !table) errorMessage = `Pedido ${orderId.substring(0,6)} e Mesa ${tableId} não encontrados.`;
      
      setAlert({ message: errorMessage, type: "error" });
    }
    setIsTableActionModalOpen(false);
  };
  

  const handleOpenReservationModal = (table: Table) => {
    setTableToReserve(table);
    setIsReservationModalOpen(true);
    setIsTableActionModalOpen(false);
  };

  const handleSaveReservation = (tableId: string, details: ReservationDetails) => {
    updateTable({ id: tableId, status: TableStatus.RESERVED, reservation_details: details, current_order_id: null });
    setIsReservationModalOpen(false);
    setTableToReserve(null);
  };

  const handleCancelReservation = (tableId: string) => {
    updateTable({ id: tableId, status: TableStatus.AVAILABLE, reservation_details: null });
    setIsTableActionModalOpen(false);
  };

  const handleClearTableOccupation = async (tableId: string) => {
    // The core logic is now in AppContext's updateTable.
    // We call updateTable, and it will show an alert if not allowed.
    await updateTable({ id: tableId, status: TableStatus.NEEDS_CLEANING }); 
    setIsTableActionModalOpen(false);
  };

  const handleMarkTableAsClean = (tableId: string) => {
    updateTable({ id: tableId, status: TableStatus.AVAILABLE });
    setIsTableActionModalOpen(false);
  };


  const getStatusClass = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE: return 'bg-green-500 hover:bg-green-600';
      case TableStatus.OCCUPIED: return 'bg-red-500 hover:bg-red-600';
      case TableStatus.RESERVED: return 'bg-blue-500 hover:bg-blue-600';
      case TableStatus.NEEDS_CLEANING: return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
            <TicketIcon className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-semibold text-gray-800">Gerenciamento de Mesas</h1>
        </div>
        <button 
            onClick={openNewTableModal}
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
        >
            <PlusIcon className="w-5 h-5 mr-2" /> Adicionar Mesa
        </button>
      </div>
      
      {tables.length === 0 && (
         <div className="text-center py-10 bg-white rounded-lg shadow">
            <img src="https://picsum.photos/seed/empty-tables/150/150" alt="Nenhuma mesa cadastrada" className="mx-auto mb-4 rounded-lg opacity-70" />
            <p className="text-gray-500 text-xl">Nenhuma mesa cadastrada.</p>
            <p className="text-gray-400 mt-2">Adicione mesas para começar a gerenciar o salão.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {tables.sort((a,b) => a.name.localeCompare(b.name)).map(table => (
          <div 
            key={table.id} 
            className={`p-4 rounded-lg shadow-lg text-white cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 ${getStatusClass(table.status)}`}
            onClick={() => handleTableCardClick(table)}
            role="button"
            tabIndex={0}
            aria-label={`Mesa ${table.name}, status ${table.status}`}
          >
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{table.name}</h3>
                <span className="text-xs px-2 py-0.5 bg-black/20 rounded-full">{table.status}</span>
            </div>
            <p className="text-sm mt-1">Capacidade: {table.capacity} pessoas</p>
            
            {table.status === TableStatus.OCCUPIED && table.current_order_id && (
              <p className="text-xs mt-1 truncate" title={`Pedido #${table.current_order_id}`}>Pedido: #{table.current_order_id.substring(0,6)}...</p>
            )}
            {table.status === TableStatus.RESERVED && table.reservation_details && (
              <div className="mt-1 text-xs space-y-0.5 bg-black/10 p-1.5 rounded">
                <p className="truncate" title={table.reservation_details.customerName}>
                    <UsersIcon className="w-3 h-3 inline mr-1"/> {table.reservation_details.customerName || 'Cliente'}
                </p>
                <p><CalendarIcon className="w-3 h-3 inline mr-1"/> {table.reservation_details.time ? new Date(table.reservation_details.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
                {table.reservation_details.guestCount && <p>Pessoas: {table.reservation_details.guestCount}</p>}
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-white/20 flex justify-end space-x-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); openEditTableModal(table); }}
                    className="p-1 text-white hover:bg-white/20 rounded-full" 
                    title="Editar Mesa">
                    <PencilAltIcon className="w-4 h-4"/>
                </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id, table.name); }}
                    className="p-1 text-white hover:bg-white/20 rounded-full" 
                    title="Excluir Mesa">
                    <TrashIcon className="w-4 h-4"/>
                </button>
            </div>
          </div>
        ))}
      </div>

      {isTableFormModalOpen && (
        <TableFormModal
          table={editingTable}
          onClose={() => { setIsTableFormModalOpen(false); setEditingTable(null); }}
        />
      )}

      {isTableActionModalOpen && selectedTableForAction && (
        <TableActionModal
          isOpen={isTableActionModalOpen}
          onClose={() => setIsTableActionModalOpen(false)}
          table={selectedTableForAction}
          onInitiateOrder={handleInitiateOrder}
          onOpenActiveTableOrder={handleOpenActiveTableOrder} // Pass the new handler
          onReserveTable={handleOpenReservationModal}
          onCancelReservation={handleCancelReservation}
          onClearTableOccupation={handleClearTableOccupation}
          onMarkTableAsClean={handleMarkTableAsClean}
        />
      )}

      {isReservationModalOpen && tableToReserve && (
        <ReservationFormModal
          isOpen={isReservationModalOpen}
          onClose={() => { setIsReservationModalOpen(false); setTableToReserve(null); }}
          table={tableToReserve}
          onSaveReservation={handleSaveReservation}
        />
      )}
      
      {isManualOrderModalOpenForTable && (
        <ManualOrderFormModal
            isOpen={isManualOrderModalOpenForTable}
            onClose={() => { setIsManualOrderModalOpenForTable(false); setInitialTableIdForOrder(null); }}
            initialTableId={initialTableIdForOrder || undefined}
        />
      )}

      {isActiveTableOrderModalOpen && activeOrderForTable && activeTableContext && (
        <ActiveTableOrderModal
          isOpen={isActiveTableOrderModalOpen}
          onClose={() => {
            setIsActiveTableOrderModalOpen(false);
            setActiveOrderForTable(null);
            setActiveTableContext(null);
          }}
          order={activeOrderForTable}
          table={activeTableContext}
        />
      )}

    </div>
  );
};

export default TableManagementPage;
