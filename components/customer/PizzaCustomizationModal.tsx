
import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, PizzaSize, PizzaCrust, CartItem } from '../../types';
import { useAppContext } from '@/contexts/AppContext';
import Modal from '@/shared/Modal';
import { generateId, DEFAULT_PIZZA_IMAGE } from '../../constants';
import { PlusIcon, CheckCircleIcon, XIcon as QuantityMinusIcon, PlusIcon as QuantityPlusIcon } from '../icons'; // Changed MinusIcon to XIcon

interface PizzaCustomizationModalProps {
  pizzaItem: MenuItem;
  onClose: () => void;
}

const PizzaCustomizationModal: React.FC<PizzaCustomizationModalProps> = ({ pizzaItem, onClose }) => {
  const { menuItems, addRawCartItem, setAlert } = useAppContext();

  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null);
  const [selectedCrust, setSelectedCrust] = useState<PizzaCrust | null>(null);
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false);
  const [firstHalfFlavor, setFirstHalfFlavor] = useState<MenuItem>(pizzaItem);
  const [secondHalfFlavor, setSecondHalfFlavor] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (pizzaItem.sizes && pizzaItem.sizes.length > 0) {
      const defaultSize = pizzaItem.sizes[0];
      setSelectedSize(defaultSize);
      if (defaultSize.crusts && defaultSize.crusts.length > 0) {
        const defaultCrustForSize = defaultSize.crusts.find(c => c.additionalPrice === 0) || defaultSize.crusts[0];
        setSelectedCrust(defaultCrustForSize);
      } else {
        setSelectedCrust(null);
      }
    } else {
        // If pizzaItem itself doesn't have sizes (which it should if item_type is 'pizza'),
        // try to find a default size if available globally, or handle error.
        // For now, assume pizzaItem.sizes is populated if it's a pizza.
        setSelectedSize(null);
        setSelectedCrust(null);
    }
    setFirstHalfFlavor(pizzaItem);
    setIsHalfAndHalf(false);
    setSecondHalfFlavor(null);
    setQuantity(1);
  }, [pizzaItem]);

  useEffect(() => {
    if (selectedSize) {
      if (selectedSize.crusts && selectedSize.crusts.length > 0) {
        const defaultCrustForSize = selectedSize.crusts.find(c => c.additionalPrice === 0) || selectedSize.crusts[0];
        setSelectedCrust(defaultCrustForSize);
      } else {
        setSelectedCrust(null);
      }
    } else {
        setSelectedCrust(null);
    }
    // Reset half-and-half if size changes to avoid inconsistent state
    if (isHalfAndHalf) {
        setIsHalfAndHalf(false);
        setSecondHalfFlavor(null);
    }
  }, [selectedSize]);

  const availablePizzaFlavors = useMemo(() => {
    return menuItems.filter(
      item => item.id !== firstHalfFlavor.id && item.item_type === 'pizza' && item.available && item.allow_half_and_half && item.sizes && item.sizes.length > 0
    );
  }, [menuItems, firstHalfFlavor]);

  const calculatedPrice = useMemo(() => {
    if (!selectedSize) return 0;

    let basePriceForSelectedSize = 0;

    if (isHalfAndHalf && firstHalfFlavor && secondHalfFlavor) {
        const firstFlavorPriceData = firstHalfFlavor.sizes?.find(s => s.id === selectedSize.id || s.name === selectedSize.name);
        const secondFlavorPriceData = secondHalfFlavor.sizes?.find(s => s.id === selectedSize.id || s.name === selectedSize.name);
        
        const price1 = firstFlavorPriceData?.price || 0;
        const price2 = secondFlavorPriceData?.price || 0;

        if (price1 === 0 && price2 === 0) basePriceForSelectedSize = selectedSize.price; // Fallback
        else basePriceForSelectedSize = Math.max(price1, price2);

    } else if (firstHalfFlavor) {
        const flavorPriceData = firstHalfFlavor.sizes?.find(s => s.id === selectedSize.id || s.name === selectedSize.name);
        basePriceForSelectedSize = flavorPriceData?.price || selectedSize.price; // Fallback
    } else {
        basePriceForSelectedSize = selectedSize.price; // Fallback if firstHalfFlavor is somehow not set
    }
    
    const crustPrice = selectedCrust?.additionalPrice || 0;
    return (basePriceForSelectedSize + crustPrice) * quantity;
  }, [selectedSize, selectedCrust, isHalfAndHalf, firstHalfFlavor, secondHalfFlavor, quantity]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setAlert({ message: 'Por favor, selecione um tamanho para a pizza.', type: 'error' });
      return;
    }
    if (isHalfAndHalf && !secondHalfFlavor) {
      setAlert({ message: 'Por favor, selecione o segundo sabor para a pizza meia a meia.', type: 'error' });
      return;
    }

    let cartItemName = `${firstHalfFlavor.name}`;
    if (isHalfAndHalf && secondHalfFlavor) {
      cartItemName = `Meia/Meia: ${firstHalfFlavor.name} / ${secondHalfFlavor.name}`;
    }
    if (selectedSize) cartItemName += ` (${selectedSize.name})`;
    
    if (selectedCrust && selectedCrust.name) {
      // Only add crust name if it's not a "default" or "no crust" type with zero price
      const crustNameLower = selectedCrust.name.toLowerCase();
      if (selectedCrust.additionalPrice > 0 || (selectedCrust.additionalPrice === 0 && crustNameLower !== "sem borda" && crustNameLower !== "borda padrão" && crustNameLower !== "tradicional")) {
           cartItemName += ` - Borda ${selectedCrust.name}`;
      }
    }

    const unitPrice = calculatedPrice / quantity;

    const cartItemToAdd: CartItem = {
      id: generateId(),
      menuItemId: firstHalfFlavor.id, // The primary item ID reference
      name: cartItemName,
      price: unitPrice, 
      quantity: quantity,
      imageUrl: firstHalfFlavor.image_url || DEFAULT_PIZZA_IMAGE,
      itemType: 'pizza',
      selectedSize: selectedSize,
      selectedCrust: selectedCrust || undefined,
      isHalfAndHalf: isHalfAndHalf && !!secondHalfFlavor,
      firstHalfFlavor: {
        menuItemId: firstHalfFlavor.id,
        name: firstHalfFlavor.name,
        priceForSize: firstHalfFlavor.sizes?.find(s => s.id === selectedSize.id)?.price || selectedSize.price,
        imageUrl: firstHalfFlavor.image_url,
      },
      secondHalfFlavor: (isHalfAndHalf && secondHalfFlavor && selectedSize) ? {
        menuItemId: secondHalfFlavor.id,
        name: secondHalfFlavor.name,
        priceForSize: secondHalfFlavor.sizes?.find(s => s.id === selectedSize.id)?.price || selectedSize.price,
        imageUrl: secondHalfFlavor.image_url,
      } : undefined,
    };

    addRawCartItem(cartItemToAdd);
    setAlert({ message: `${cartItemName} adicionada ao carrinho!`, type: 'success' });
    onClose();
  };

  return (
    <Modal title={`Montar Pizza: ${pizzaItem.name}`} onClose={onClose}>
      <div className="space-y-4 text-sm sm:text-base">
        <img 
          src={pizzaItem.image_url || DEFAULT_PIZZA_IMAGE} 
          alt={pizzaItem.name} 
          className="w-full h-48 object-cover rounded-lg shadow-md mb-3"
          onError={(e) => (e.currentTarget.src = DEFAULT_PIZZA_IMAGE)}
        />

        {/* Tamanho */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho*</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {pizzaItem.sizes?.map(size => (
              <button
                key={size.id}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`p-2 border rounded-md text-xs sm:text-sm transition-all ${selectedSize?.id === size.id ? 'bg-primary text-white ring-2 ring-primary-dark shadow-md' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                {size.name} (R$ {size.price.toFixed(2)})
              </button>
            ))}
          </div>
        </div>

        {/* Borda */}
        {selectedSize && selectedSize.crusts && selectedSize.crusts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Borda (para {selectedSize.name})</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedSize.crusts.map(crust => (
                <button
                  key={crust.id}
                  type="button"
                  onClick={() => setSelectedCrust(crust)}
                  className={`p-2 border rounded-md text-xs sm:text-sm transition-all ${selectedCrust?.id === crust.id ? 'bg-secondary text-white ring-1 ring-secondary-dark shadow-sm' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  {crust.name} (+R$ {crust.additionalPrice.toFixed(2)})
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Meia a Meia */}
        {pizzaItem.allow_half_and_half && (
          <div className="pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isHalfAndHalf} 
                onChange={(e) => {
                    setIsHalfAndHalf(e.target.checked);
                    if (!e.target.checked) setSecondHalfFlavor(null);
                }}
                className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Pedir Meia a Meia?</span>
            </label>
            {isHalfAndHalf && (
              <div className="mt-2 pl-2">
                <p className="text-xs text-gray-600 mb-1">1º Sabor: {firstHalfFlavor.name}</p>
                <label htmlFor="secondFlavor" className="block text-xs font-medium text-gray-700 mb-0.5">2º Sabor*</label>
                <select 
                  id="secondFlavor" 
                  value={secondHalfFlavor?.id || ''} 
                  onChange={e => {
                    const selectedId = e.target.value;
                    setSecondHalfFlavor(menuItems.find(item => item.id === selectedId) || null);
                  }}
                  className="block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm text-xs focus:ring-primary focus:border-primary"
                >
                  <option value="" disabled>Selecione o segundo sabor</option>
                  {availablePizzaFlavors.map(flavor => (
                    <option key={flavor.id} value={flavor.id}>{flavor.name}</option>
                  ))}
                </select>
                {availablePizzaFlavors.length === 0 && <p className="text-xs text-red-500 mt-1">Nenhum outro sabor compatível disponível para meia a meia.</p>}
              </div>
            )}
          </div>
        )}

        {/* Quantidade */}
        <div className="flex items-center justify-between pt-2">
          <label className="text-sm font-medium text-gray-700">Quantidade:</label>
          <div className="flex items-center space-x-2">
            <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1.5 border rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-50" disabled={quantity <= 1} aria-label="Diminuir quantidade">
              <QuantityMinusIcon className="w-4 h-4" />
            </button>
            <span className="text-base font-medium w-8 text-center">{quantity}</span>
            <button type="button" onClick={() => setQuantity(q => q + 1)} className="p-1.5 border rounded-md hover:bg-gray-100 text-gray-600" aria-label="Aumentar quantidade">
              <QuantityPlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preço e Botão Adicionar */}
        <div className="border-t pt-3 mt-3">
          <p className="text-lg sm:text-xl font-bold text-gray-800 text-right mb-3">
            Total: R$ {calculatedPrice.toFixed(2).replace('.', ',')}
          </p>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedSize || (isHalfAndHalf && !secondHalfFlavor)}
              className="flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2"/> Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PizzaCustomizationModal;
