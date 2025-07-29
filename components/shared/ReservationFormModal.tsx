
import React, { useState, useEffect } from 'react';
import { Table, ReservationDetails } from '../../types';
import Modal from './Modal';
import { CalendarIcon, UsersIcon, DocumentTextIcon } from '../icons';
import { useAppContext } from '@/contexts/AppContext'; // Import useAppContext for alerts

interface ReservationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  onSaveReservation: (tableId: string, details: ReservationDetails) => void;
}

const ReservationFormModal: React.FC<ReservationFormModalProps> = ({ 
  isOpen, 
  onClose, 
  table, 
  onSaveReservation 
}) => {
  const { setAlert } = useAppContext(); // Use context for alerts
  const [customerName, setCustomerName] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (table && table.reservation_details) {
      setCustomerName(table.reservation_details.customerName || '');
      setReservationTime(table.reservation_details.time || '');
      setGuestCount(table.reservation_details.guestCount || 1);
      setNotes(table.reservation_details.notes || '');
    } else {
      // Set default time to now + 1 hour for new reservations, formatted for datetime-local
      const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const day = String(defaultDate.getDate()).padStart(2, '0');
      const hours = String(defaultDate.getHours()).padStart(2, '0');
      const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
      setReservationTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      
      setCustomerName('');
      setGuestCount(table?.capacity || 1);
      setNotes('');
    }
  }, [table, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !reservationTime) {
      setAlert({ message: "Nome do cliente e horário da reserva são obrigatórios.", type: "error" });
      return;
    }
    onSaveReservation(table.id, { 
      customerName, 
      time: reservationTime, 
      guestCount: Number(guestCount) || 1, 
      notes 
    });
  };

  if (!isOpen) return null;

  return (
    <Modal title={`Reservar Mesa: ${table.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="resCustomerName" className="block text-sm font-medium text-gray-700">
            <UsersIcon className="w-4 h-4 inline mr-1 mb-0.5"/> Nome do Cliente*
          </label>
          <input
            type="text"
            id="resCustomerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="resTime" className="block text-sm font-medium text-gray-700">
             <CalendarIcon className="w-4 h-4 inline mr-1 mb-0.5"/> Horário da Reserva*
          </label>
          <input
            type="datetime-local"
            id="resTime"
            value={reservationTime}
            onChange={(e) => setReservationTime(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="resGuestCount" className="block text-sm font-medium text-gray-700">
            <UsersIcon className="w-4 h-4 inline mr-1 mb-0.5"/> Número de Pessoas
          </label>
          <input
            type="number"
            id="resGuestCount"
            value={guestCount}
            onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
            min="1"
            max={table.capacity * 2} // Allow slightly more for exceptions
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
           <p className="text-xs text-gray-500 mt-1">Capacidade da mesa: {table.capacity}</p>
        </div>
        <div>
          <label htmlFor="resNotes" className="block text-sm font-medium text-gray-700">
            <DocumentTextIcon className="w-4 h-4 inline mr-1 mb-0.5"/> Observações
          </label>
          <textarea
            id="resNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ex: Preferência por local, aniversário, etc."
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm"
          >
            Salvar Reserva
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReservationFormModal;