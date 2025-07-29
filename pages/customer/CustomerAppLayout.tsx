
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import CustomerMenuPage from './CustomerMenuPage';
import ShoppingCartModal from '@/components/customer/ShoppingCartModal';
import CustomerDetailsForm from '@/components/customer/CustomerDetailsForm';
import OrderConfirmationModal from '@/components/customer/OrderConfirmationModal';
import PizzaCustomizationModal from '@/components/customer/PizzaCustomizationModal';
import { MenuItem, Order } from '../../types';
import { ShoppingCartIcon, CheckCircleIcon, XCircleIcon } from '@/components/icons'; 
import LoadingSpinner from '@/components/shared/LoadingSpinner';

type CustomerStep = 'menu' | 'cart' | 'details' | 'confirmation' | 'customizePizza';

const CustomerAppLayout: React.FC = () => {
  console.log('[CustomerAppLayout] Component rendering/mounting...');
  const { 
    cart, 
    placeOrder, 
    setAlert, 
    settings, 
    isStoreOpenNow, 
    isLoading: appContextIsLoading, 
    isLoadingSettings
  } = useAppContext();

  const [currentStep, setCurrentStep] = useState<CustomerStep>('menu');
  const [orderPlacedId, setOrderPlacedId] = useState<string | null>(null);
  const [pizzaToCustomize, setPizzaToCustomize] = useState<MenuItem | null>(null);
  
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProceedToDetails = () => {
    if (!isStoreOpenNow) {
      setAlert({ message: "A loja está fechada. Não é possível finalizar o pedido.", type: 'info' });
      return;
    }
    if (cart.length === 0) {
      setAlert({ message: 'Seu carrinho está vazio.', type: 'info'});
      return;
    }
    setCurrentStep('details');
  };

  const handlePlaceOrder = async () => {
    if (!isStoreOpenNow) {
      setAlert({ message: "A loja está fechada. Não é possível realizar pedidos.", type: 'error' });
      return;
    }
    const newOrder: Order | null = await placeOrder();
    if (newOrder && typeof newOrder === 'object' && 'id' in newOrder && newOrder.id) {
      setOrderPlacedId(newOrder.id);
      setCurrentStep('confirmation');
    } 
  };
  
  const resetToMenu = () => {
    setOrderPlacedId(null);
    setCurrentStep('menu');
  };

  const openPizzaCustomizationModal = (pizza: MenuItem) => {
    if (!isStoreOpenNow) {
      setAlert({ message: "A loja está fechada. Não é possível adicionar itens.", type: 'info' });
      return;
    }
    setPizzaToCustomize(pizza);
    setCurrentStep('customizePizza');
  };

  const closePizzaCustomizationModal = () => {
    setPizzaToCustomize(null);
    setCurrentStep('menu'); 
  };

  const storeDisplayName = settings?.store?.store_name || "Cardápio Online";
  const storeLogoUrl = settings?.store?.logo_url || 'https://picsum.photos/seed/default_logo/60/60';


  if (appContextIsLoading || isLoadingSettings) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <LoadingSpinner size="w-16 h-16" color="text-primary" />
            <p className="mt-4 text-lg text-gray-600">Carregando cardápio...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white text-gray-800 shadow-md sticky top-0 z-30 border-b-4 border-primary">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src={storeLogoUrl} 
              alt="Logo da Loja" 
              className="h-10 w-10 sm:h-12 sm:w-12 mr-2 sm:mr-3 rounded-full border-2 border-primary-light object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://picsum.photos/seed/logo_fallback_customer/60/60'; }}
            />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
              {storeDisplayName}
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className={`flex items-center px-2 py-1 rounded-md text-xs sm:text-sm font-semibold
                             ${isStoreOpenNow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isStoreOpenNow ? 
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1"/> : 
                <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1"/>
              }
              {isStoreOpenNow ? 'Aberto Agora' : 'Fechado Agora'}
            </div>
            <button
              onClick={() => {
                if (cart.length === 0 && currentStep !== 'cart') {
                    setAlert({message: "Carrinho vazio!", type: "info"});
                    return;
                }
                setCurrentStep(currentStep === 'cart' ? 'menu' : 'cart');
              }}
              className="relative p-1.5 sm:p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              aria-label={`Ver carrinho com ${totalCartItems} itens`}
            >
              <ShoppingCartIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              {totalCartItems > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 transform -translate-y-1 translate-x-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-sm border-2 border-white">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6">
        {(currentStep === 'menu' || currentStep === 'customizePizza') && (
            <CustomerMenuPage onCustomizePizza={openPizzaCustomizationModal} />
        )}
      </main>

      {currentStep === 'cart' && (
        <ShoppingCartModal onClose={() => setCurrentStep('menu')} onCheckout={handleProceedToDetails} />
      )}

      {currentStep === 'details' && (
        <CustomerDetailsForm onClose={() => setCurrentStep('cart')} onSubmit={handlePlaceOrder} />
      )}
      
      {currentStep === 'confirmation' && orderPlacedId && (
        <OrderConfirmationModal orderId={orderPlacedId} onClose={resetToMenu} />
      )}

      {currentStep === 'customizePizza' && pizzaToCustomize && (
        <PizzaCustomizationModal pizzaItem={pizzaToCustomize} onClose={closePizzaCustomizationModal} />
      )}
      
      <footer className="text-center py-8 mt-10 text-sm text-gray-500 border-t border-gray-200">
        <p>&copy; {new Date().getFullYear()} {storeDisplayName}. Tecnologia para seu delivery.</p>
        <p>Um cardápio digital moderno e eficiente.</p>
      </footer>
    </div>
  );
};

export default CustomerAppLayout;