
import React, { useState, useEffect } from 'react';
import { Table } from '../../types';
import { useAppContext } from '@/contexts/AppContext';
import Modal from './Modal';
import { TicketIcon } from '../icons'; // Or another suitable icon for tables

interface TableFormModalProps {
  table?: Table | null; // For editing existing table
  onClose: () => void;
}

const TableFormModal: React.FC<TableFormModalProps> = ({ table, onClose }) => {
  const { addTable, updateTable, setAlert } = useAppContext();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number>(2);

  useEffect(() => {
    if (table) {
      setName(table.name);
      setCapacity(table.capacity);
    } else {
      setName('');
      setCapacity(2); // Default capacity for new table
    }
  }, [table]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || capacity <= 0) {
      setAlert({ message: 'Nome da mesa e capacidade válida são obrigatórios.', type: 'error' });
      return;
    }

    if (table) { // Editing existing table
      updateTable({ ...table, name, capacity: Number(capacity) });
      setAlert({ message: `Mesa "${name}" atualizada com sucesso!`, type: 'success' });
    } else { // Adding new table
      addTable({ name, capacity: Number(capacity) });
      setAlert({ message: `Mesa "${name}" adicionada com sucesso!`, type: 'success' });
    }
    onClose();
  };

  return (
    <Modal title={table ? `Editar Mesa: ${table.name}` : 'Adicionar Nova Mesa'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tableName" className="block text-sm font-medium text-gray-700">
            <TicketIcon className="w-4 h-4 inline mr-1 mb-0.5"/> Nome da Mesa/Identificador*
          </label>
          <input
            type="text"
            id="tableName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="tableCapacity" className="block text-sm font-medium text-gray-700">
            Capacidade (pessoas)*
          </label>
          <input
            type="number"
            id="tableCapacity"
            value={capacity}
            onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
            min="1"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
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
            {table ? 'Salvar Alterações' : 'Adicionar Mesa'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TableFormModal;