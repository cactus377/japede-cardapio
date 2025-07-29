import React from 'react';
import { ShoppingCartItem as CartItem } from '../../types';
import { MinusCircleIcon, PlusCircleIcon, TrashIcon } from '../icons';

interface ShoppingCartItemProps {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

const ShoppingCartItem: React.FC<ShoppingCartItemProps> = ({ item, onRemove, onUpdateQuantity }) => {
  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.quantity + 1);
  };

  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 ease-in-out">
      <div className="flex items-center space-x-4">
        <img
          src={item.image || '/placeholder-product.png'}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
        />
        <div>
          <h4 className="text-sm font-medium text-gray-800">{item.name}</h4>
          <p className="text-xs text-gray-500">R$ {item.price.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={handleDecrement}
          className="text-gray-500 hover:text-primary focus:outline-none"
          title="Diminuir quantidade"
        >
          <MinusCircleIcon className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-700">{item.quantity}</span>
        <button
          onClick={handleIncrement}
          className="text-gray-500 hover:text-primary focus:outline-none"
          title="Aumentar quantidade"
        >
          <PlusCircleIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 focus:outline-none"
          title="Remover item"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ShoppingCartItem;
