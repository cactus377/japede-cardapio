import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import ShoppingCartItem from './ShoppingCartItem';
import Modal from '@/shared/Modal'; // Reusing the admin modal for now
import { ShoppingCartIcon, XIcon } from '../icons';

interface ShoppingCartModalProps {
  onClose: () => void;
  onCheckout: () => void;
}

const ShoppingCartModal: React.FC<ShoppingCartModalProps> = ({ onClose, onCheckout }) => {
  const { cart, removeFromCart, updateCartQuantity, clearCart, setAlert } = useAppContext();

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      setAlert({ message: "Seu carrinho está vazio. Adicione itens para continuar.", type: "info" });
      return;
    }
    onCheckout();
  };

  return (
    <Modal title="Meu Carrinho" onClose={onClose}>
      <div className="min-h-[300px] max-h-[60vh] flex flex-col">
        {cart.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 p-8">
            <ShoppingCartIcon className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-xl font-semibold">Seu carrinho está vazio.</p>
            <p className="mt-1">Adicione produtos do cardápio para começar!</p>
            <button
              onClick={onClose}
              className="mt-6 bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Ver Cardápio
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto pr-2 flex-grow mb-4 space-y-3">
              {cart.map(item => (
                <ShoppingCartItem
                  key={item.id}
                  item={item}
                  onRemove={() => removeFromCart(item.id)}
                  onUpdateQuantity={(quantity) => updateCartQuantity(item.id, quantity)}
                />
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 mt-auto">
              <div className="flex justify-between items-center text-lg font-semibold text-gray-800 mb-1">
                <span>Subtotal:</span>
                <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Taxa de entrega e outros custos serão calculados no checkout.</p>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => { clearCart(); setAlert({ message: "Carrinho esvaziado.", type: "info" }); }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 border border-red-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Esvaziar Carrinho
                </button>
                <button
                  onClick={handleCheckout}
                  className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-white bg-primary hover:bg-primary-dark border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Continuar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ShoppingCartModal;
