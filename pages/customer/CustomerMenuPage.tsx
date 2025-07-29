
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import CustomerProductCard from '@/components/customer/CustomerProductCard';
import { MenuItem } from '../../types';
import { BookOpenIcon, ShoppingBagIcon } from '@/components/icons'; 

interface CustomerMenuPageProps {
  onCustomizePizza: (pizzaItem: MenuItem) => void;
}

const CustomerMenuPage: React.FC<CustomerMenuPageProps> = ({ onCustomizePizza }) => {
  const { 
    categories, 
    menuItems, 
    addToCart, 
    setAlert, 
    settings, 
    isStoreOpenNow 
  } = useAppContext();

  const handleStandardItemAddToCart = (item: MenuItem) => {
    if (!isStoreOpenNow) {
      setAlert({ message: "A loja está fechada. Não é possível adicionar itens.", type: 'info' });
      return;
    }
    if (!item.available) {
      setAlert({ message: `${item.name} está indisponível no momento.`, type: 'info'});
      return;
    }
    addToCart(item); 
    setAlert({ message: `${item.name} adicionado ao carrinho!`, type: 'success'});
  };

  const availableMenuItems = menuItems.filter(item => item.available);
  const storeName = settings?.store?.store_name || "Nosso Cardápio";

  return (
    <div className="space-y-10">
      <div className="text-center pt-8 pb-10 bg-gradient-to-br from-primary-light via-primary to-primary-dark rounded-b-xl shadow-xl mb-8">
        <BookOpenIcon className="w-16 h-16 sm:w-20 sm:h-20 text-white mx-auto mb-3 opacity-90" />
        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">{storeName}</h2>
        <p className="text-md sm:text-lg text-white/90 mt-2 px-4">
          {isStoreOpenNow ? "Escolha seus pratos favoritos com facilidade!" : "Estamos fechados. Você pode visualizar nosso cardápio."}
        </p>
      </div>

      {categories.length === 0 && availableMenuItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <ShoppingBagIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <p className="text-2xl font-semibold text-gray-600">Cardápio em Construção!</p>
          <p className="text-gray-500 mt-3">Estamos preparando delícias para você. Volte em breve!</p>
        </div>
      )}

      {categories.map(category => {
        const itemsInCategory = availableMenuItems.filter(item => item.category_id === category.id);
        if (itemsInCategory.length === 0) return null; 

        return (
          <section key={category.id} aria-labelledby={`category-title-${category.id}`} className="scroll-mt-20">
            <h3 
              id={`category-title-${category.id}`} 
              className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6 border-b-2 border-primary pb-3"
            >
              {category.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {itemsInCategory.map(item => (
                <CustomerProductCard 
                  key={item.id} 
                  item={item} 
                  onAddToCart={handleStandardItemAddToCart} 
                  onCustomizePizza={onCustomizePizza}
                  isStoreOpen={isStoreOpenNow} // Pass store open status
                />
              ))}
            </div>
          </section>
        );
      })}
       {!isStoreOpenNow && categories.length > 0 && (
        <div className="mt-12 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-md shadow-md text-center">
          <p className="font-semibold">Atenção: A loja está fechada no momento.</p>
          <p className="text-sm">Você pode visualizar os itens, mas não será possível adicionar ao carrinho ou fazer pedidos até a reabertura.</p>
        </div>
      )}
    </div>
  );
};

export default CustomerMenuPage;