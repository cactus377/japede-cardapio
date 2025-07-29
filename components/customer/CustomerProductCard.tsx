
import React from 'react';
import { MenuItem } from '../../types';
import { PlusIcon, ShoppingBagIcon } from '../icons'; 
import { DEFAULT_PIZZA_IMAGE } from '../../constants';

interface CustomerProductCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void; 
  onCustomizePizza: (item: MenuItem) => void; 
  isStoreOpen: boolean;
}

const CustomerProductCard: React.FC<CustomerProductCardProps> = ({ item, onAddToCart, onCustomizePizza, isStoreOpen }) => {
  
  const smallestSizePrice = item.item_type === 'pizza' && item.sizes && item.sizes.length > 0
    ? Math.min(...item.sizes.map(s => s.price))
    : item.price;

  const displayPrice = item.item_type === 'pizza' 
    ? `A partir de R$ ${smallestSizePrice.toFixed(2).replace('.', ',')}`
    : `R$ ${item.price.toFixed(2).replace('.', ',')}`;

  const canInteract = item.available && isStoreOpen;

  const handleCardClick = () => {
    if (!canInteract) return;
    if (item.item_type === 'pizza') {
      onCustomizePizza(item);
    } else {
      onAddToCart(item);
    }
  };
  
  const handleButtonClick = (e: React.MouseEvent) => {
    if (!canInteract) return;
    e.stopPropagation(); 
    handleCardClick(); 
  };


  return (
    <div 
      className={`bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 ease-in-out transform 
                  ${!canInteract ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:shadow-2xl hover:scale-[1.02]'}`}
      onClick={handleCardClick} 
      role="button"
      tabIndex={canInteract ? 0 : -1}
      aria-label={canInteract ? `${item.item_type === 'pizza' ? 'Montar' : 'Adicionar'} ${item.name}` : `${item.name} (${!item.available ? 'Indisponível' : 'Loja Fechada'})`}
      title={!item.available ? `${item.name} (Indisponível)` : !isStoreOpen ? `${item.name} (Loja Fechada)`: item.name}
    >
      <div className="relative w-full pt-[60%]"> {/* Aspect ratio container for image */}
        <img 
          src={item.image_url || (item.item_type === 'pizza' ? DEFAULT_PIZZA_IMAGE : `https://picsum.photos/seed/${item.id}/400/250`)} 
          alt={item.name} 
          className={`absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 ${canInteract ? 'group-hover:scale-105' : ''} ${!item.available ? 'filter grayscale' : ''}`}
          onError={(e) => (e.currentTarget.src = item.item_type === 'pizza' ? DEFAULT_PIZZA_IMAGE : 'https://picsum.photos/seed/placeholder_food/400/250')}
        />
        {!item.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm sm:text-base bg-red-600 px-3 py-1 rounded-md shadow-md">Indisponível</span>
          </div>
        )}
         {item.available && !isStoreOpen && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
            Loja Fechada
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <h4 className={`text-md sm:text-lg font-semibold text-gray-800 mb-1 truncate ${!item.available ? 'text-gray-500' : ''}`} title={item.name}>{item.name}</h4>
        <p className={`text-gray-600 text-xs sm:text-sm mb-3 min-h-[2.5em] line-clamp-2 ${!item.available ? 'text-gray-400' : ''}`} title={item.description}>{item.description || "Experimente esta delícia do nosso cardápio."}</p>
        <div className="mt-auto">
          <p className={`text-lg sm:text-xl font-bold mb-3 ${item.item_type === 'pizza' ? 'text-gray-700' : 'text-primary'} ${!item.available ? '!text-gray-400' : ''}`}>
            {displayPrice}
          </p>
          <button
            onClick={handleButtonClick} 
            disabled={!canInteract}
            className={`w-full flex items-center justify-center text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150 ease-in-out
              ${canInteract 
                ? 'bg-primary hover:bg-primary-dark text-white shadow-md focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-1' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            aria-disabled={!canInteract}
          >
            {item.item_type === 'pizza' ? <ShoppingBagIcon className="w-5 h-5 mr-1.5"/> : <PlusIcon className="w-5 h-5 mr-1.5"/>}
            {item.item_type === 'pizza' ? 'Montar Pizza' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProductCard;