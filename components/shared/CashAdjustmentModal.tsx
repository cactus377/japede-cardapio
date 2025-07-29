

import React, { useState } from 'react';
import { CashAdjustmentType } from '../../types';
import { useAppContext } from '@/contexts/AppContext';
import Modal from './Modal';
// FIX: Replaced MinusIcon with MinusCircleIcon as it was not exported.
import { PlusIcon, MinusCircleIcon } from '../icons';

interface CashAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionId: string | null;
}

const CashAdjustmentModal: React.FC<CashAdjustmentModalProps> = ({ isOpen, onClose, activeSessionId }) => {
  const { addCashAdjustment, setAlert } = useAppContext();
  const [type, setType] = useState<CashAdjustmentType>(CashAdjustmentType.ADD);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionId) {
      setAlert({ message: "Nenhuma sessão de caixa ativa.", type: "error" });
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setAlert({ message: "Valor inválido. Deve ser um número positivo.", type: "error" });
      return;
    }
    if (!reason.trim()) {
      setAlert({ message: "O motivo/observação é obrigatório.", type: "error" });
      return;
    }

    const success = await addCashAdjustment(activeSessionId, type, numericAmount, reason);
    if (success) {
      setAmount('');
      setReason('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal title="Ajuste Manual de Caixa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ajuste*</label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setType(CashAdjustmentType.ADD)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center border
                                ${type === CashAdjustmentType.ADD ? 'bg-green-500 text-white border-green-600 ring-2 ring-green-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'}`}
            >
              <PlusIcon className="w-4 h-4 mr-1" /> Adicionar (Entrada)
            </button>
            <button
              type="button"
              onClick={() => setType(CashAdjustmentType.REMOVE)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center border
                                ${type === CashAdjustmentType.REMOVE ? 'bg-red-500 text-white border-red-600 ring-2 ring-red-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'}`}
            >
              <MinusCircleIcon className="w-4 h-4 mr-1" /> Retirar (Saída)
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="adjustmentAmount" className="block text-sm font-medium text-gray-700">Valor (R$)*</label>
          <input
            type="number"
            id="adjustmentAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="adjustmentReason" className="block text-sm font-medium text-gray-700">Motivo/Observação*</label>
          <textarea
            id="adjustmentReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ex: Sangria, Adição de troco, etc."
            required
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm">Confirmar Ajuste</button>
        </div>
      </form>
    </Modal>
  );
};

export default CashAdjustmentModal;