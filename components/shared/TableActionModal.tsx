
import React from 'react';
import { Table, TableStatus, OrderStatus } from '../../types';
import Modal from './Modal';
import { PlusIcon, EyeIcon, CalendarIcon, XIcon, TrashIcon, CheckCircleIcon, BanIcon, DocumentTextIcon } from '../icons';
import { useAppContext } from '@/contexts/AppContext'; // Import useAppContext

interface TableActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  onInitiateOrder: (tableId: string) => void;
  onOpenActiveTableOrder: (orderId: string, tableId: string) => void; 
  onReserveTable: (table: Table) => void;
  onCancelReservation: (tableId: string) => void;
  onClearTableOccupation: (tableId: string) => void; 
  onMarkTableAsClean: (tableId: string) => void;
}

const TableActionModal: React.FC<TableActionModalProps> = ({
  isOpen,
  onClose,
  table,
  onInitiateOrder,
  onOpenActiveTableOrder,
  onReserveTable,
  onCancelReservation,
  onClearTableOccupation,
  onMarkTableAsClean,
}) => {
  const { orders } = useAppContext(); // Get orders from context

  if (!isOpen || !table) return null;

  const renderActions = () => {
    switch (table.status) {
      case TableStatus.AVAILABLE:
        return (
          <>
            <button
              onClick={() => { onInitiateOrder(table.id); onClose(); }}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm"
            >
              <PlusIcon className="w-5 h-5 mr-2" /> Iniciar Novo Pedido
            </button>
            <button
              onClick={() => { onReserveTable(table); onClose(); }}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-sm"
            >
              <CalendarIcon className="w-5 h-5 mr-2" /> Reservar Mesa
            </button>
          </>
        );
      case TableStatus.OCCUPIED:
        const currentOrderForTable = orders.find(o => o.id === table.current_order_id);
        const canClearTable = currentOrderForTable && 
                              (currentOrderForTable.status === OrderStatus.DELIVERED || currentOrderForTable.status === OrderStatus.CANCELLED);
        return (
          <>
            {table.current_order_id && (
              <button
                onClick={() => { onOpenActiveTableOrder(table.current_order_id!, table.id); onClose(); }}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm"
              >
                <DocumentTextIcon className="w-5 h-5 mr-2" /> Gerenciar Pedido da Mesa
              </button>
            )}
            {canClearTable && (
              <button
                onClick={() => { onClearTableOccupation(table.id); onClose(); }}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg shadow-sm mt-2"
              >
                <BanIcon className="w-5 h-5 mr-2" /> Liberar Mesa (Marcar p/ Limpeza)
              </button>
            )}
            {!canClearTable && currentOrderForTable && (
                 <p className="mt-2 text-xs text-center text-gray-500 bg-gray-100 p-2 rounded-md">
                    A mesa só pode ser liberada para limpeza após o fechamento da conta (pedido atual: {currentOrderForTable.status}).
                </p>
            )}
             <button
              onClick={() => { onReserveTable(table); onClose(); }} // Still allow future reservations
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-sm mt-2"
            >
              <CalendarIcon className="w-5 h-5 mr-2" /> Agendar Reserva Futura
            </button>
          </>
        );
      case TableStatus.RESERVED:
        return (
          <>
            <button
              onClick={() => { onInitiateOrder(table.id); onClose(); }} 
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm"
            >
              <PlusIcon className="w-5 h-5 mr-2" /> Iniciar Pedido (Confirmar Reserva)
            </button>
            <button
              onClick={() => { onCancelReservation(table.id); onClose(); }}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm"
            >
              <XIcon className="w-5 h-5 mr-2" /> Cancelar Reserva
            </button>
             {table.reservation_details && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 text-left">
                    <p><strong>Reserva:</strong> {table.reservation_details.customerName}</p>
                    <p><strong>Horário:</strong> {table.reservation_details.time ? new Date(table.reservation_details.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) : 'N/A'}</p>
                    <p><strong>Pessoas:</strong> {table.reservation_details.guestCount || 'N/A'}</p>
                </div>
            )}
          </>
        );
      case TableStatus.NEEDS_CLEANING:
        return (
          <button
            onClick={() => { onMarkTableAsClean(table.id); onClose(); }}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg shadow-sm"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" /> Marcar como Limpa e Disponível
          </button>
        );
      default:
        return <p className="text-gray-500">Nenhuma ação disponível para esta mesa.</p>;
    }
  };

  return (
    <Modal title={`Ações para ${table.name} (${table.status})`} onClose={onClose}>
      <div className="space-y-3">
        {renderActions()}
      </div>
    </Modal>
  );
};

export default TableActionModal;