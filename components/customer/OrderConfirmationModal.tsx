import React from 'react';
import Modal from '@/shared/Modal';
import { CheckCircleIcon } from '../icons';

interface OrderConfirmationModalProps {
  orderId: string;
  onClose: () => void;
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({ orderId, onClose }) => {
  return (
    <Modal title="Pedido Realizado com Sucesso!" onClose={onClose}>
      <div className="text-center p-6">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Obrigado pelo seu pedido!</h2>
        <p className="text-gray-600">
          Seu pedido <strong className="text-primary">#{orderId.substring(0, 8)}</strong> foi recebido e está sendo processado.
        </p>
        <p className="text-gray-600 mt-1">
          Em breve você receberá atualizações sobre o status.
        </p>
        <button
          onClick={onClose}
          className="mt-8 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-150 ease-in-out text-lg"
        >
          Fazer Novo Pedido
        </button>
      </div>
    </Modal>
  );
};

export default OrderConfirmationModal;
