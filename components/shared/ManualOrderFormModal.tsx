
import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, ManualOrderItem, ManualOrderData, OrderType, PaymentMethod, PizzaSize, PizzaCrust, Table } from '../../types';
import { useAppContext } from '@/contexts/AppContext';
import Modal from './Modal';
import { PlusIcon, TrashIcon } from '../icons'; 
import { generateId, ORDER_TYPES, PAYMENT_METHODS, DEFAULT_PIZZA_IMAGE } from '../../constants';

interface ManualOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTableId?: string; 
}

const ManualOrderFormModal: React.FC<ManualOrderFormModalProps> = ({ isOpen, onClose, initialTableId }) => {
  console.log(`[ManualOrderFormModal] Component rendering. isOpen: ${isOpen}, initialTableId: ${initialTableId}`);
  const { 
    menuItems, 
    createManualOrder, 
    setAlert, 
    tables,
    prefilledCustomerForOrder, // Added from context
    clearPrefilledCustomerForOrder, // Added from context
  } = useAppContext();

  const [orderType, setOrderType] = useState<OrderType>(initialTableId ? OrderType.MESA : OrderType.BALCAO);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [addressReference, setAddressReference] = useState('');
  const [tableId, setTableId] = useState(initialTableId || ''); 
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethodState, setPaymentMethodState] = useState<PaymentMethod>(PaymentMethod.DINHEIRO);
  const [amountPaid, setAmountPaid] = useState<number | undefined>(undefined);
  const [changeDue, setChangeDue] = useState<number | undefined>(undefined);

  const [currentOrderItems, setCurrentOrderItems] = useState<ManualOrderItem[]>([]);
  
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [selectedPizzaSizeId, setSelectedPizzaSizeId] = useState<string | null>(null);
  const [selectedPizzaCrustId, setSelectedPizzaCrustId] = useState<string | null>(null); 
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  const [isManualHalfAndHalf, setIsManualHalfAndHalf] = useState(false);
  const [manualSecondFlavorId, setManualSecondFlavorId] = useState<string | null>(null);


  const selectedMenuItem = menuItems.find(item => item.id === selectedMenuItemId);
  const selectedPizzaSizeObject = selectedMenuItem?.item_type === 'pizza' ? selectedMenuItem.sizes?.find(s => s.id === selectedPizzaSizeId) : null;

  const totalAmount = currentOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const availableSecondFlavors = useMemo(() => {
    if (!selectedMenuItem || selectedMenuItem.item_type !== 'pizza' || !isManualHalfAndHalf) {
      return [];
    }
    return menuItems.filter(
      item => item.id !== selectedMenuItem.id && item.item_type === 'pizza' && item.available && item.allow_half_and_half && item.sizes && item.sizes.length > 0
    );
  }, [menuItems, selectedMenuItem, isManualHalfAndHalf]);

  const availableTablesForDropdown = useMemo(() => {
    return tables.filter(t => t.status === 'Disponível' || t.id === initialTableId);
  }, [tables, initialTableId]);


  useEffect(() => {
    setSelectedPizzaSizeId(null);
    setSelectedPizzaCrustId(null);
    setIsManualHalfAndHalf(false);
    setManualSecondFlavorId(null);

    if (selectedMenuItem?.item_type === 'pizza' && selectedMenuItem.sizes && selectedMenuItem.sizes.length > 0) {
        const defaultSize = selectedMenuItem.sizes[0];
        setSelectedPizzaSizeId(defaultSize.id); 
        if (defaultSize.crusts && defaultSize.crusts.length > 0) {
            const defaultCrustForSize = defaultSize.crusts.find(c => c.additionalPrice === 0) || defaultSize.crusts[0];
            setSelectedPizzaCrustId(defaultCrustForSize.id);
        } else {
            setSelectedPizzaCrustId(null);
        }
    }
  }, [selectedMenuItemId, selectedMenuItem]);

   useEffect(() => {
    if (selectedPizzaSizeObject && selectedPizzaSizeObject.crusts && selectedPizzaSizeObject.crusts.length > 0) {
        const defaultCrustForSize = selectedPizzaSizeObject.crusts.find(c => c.additionalPrice === 0) || selectedPizzaSizeObject.crusts[0];
        setSelectedPizzaCrustId(defaultCrustForSize.id);
    } else {
        setSelectedPizzaCrustId(null);
    }
  }, [selectedPizzaSizeId, selectedPizzaSizeObject]);


  useEffect(() => {
    if (paymentMethodState === PaymentMethod.DINHEIRO && amountPaid !== undefined && totalAmount > 0) {
        setChangeDue(amountPaid - totalAmount);
    } else {
        setChangeDue(undefined);
    }
  }, [amountPaid, totalAmount, paymentMethodState]);

  useEffect(() => {
    console.log(`[ManualOrderFormModal] isOpen effect triggered. isOpen: ${isOpen}, initialTableId: ${initialTableId}`);
    if (isOpen) {
        const determinedOrderType = initialTableId ? OrderType.MESA : OrderType.BALCAO;
        console.log(`[ManualOrderFormModal] Modal opening. Determined OrderType: ${determinedOrderType}`);
        setOrderType(determinedOrderType);
        setTableId(initialTableId || '');
        setPaymentMethodState(determinedOrderType === OrderType.MESA ? PaymentMethod.DINHEIRO : PaymentMethod.DINHEIRO); 
        
        if (prefilledCustomerForOrder) {
            console.log('[ManualOrderFormModal] Prefilling customer data from context:', prefilledCustomerForOrder);
            setCustomerName(prefilledCustomerForOrder.full_name || '');
            setCustomerPhone(prefilledCustomerForOrder.phone || '');
            // Clear the prefilled customer from context after using it
            clearPrefilledCustomerForOrder();
        } else if (!initialTableId) { 
            console.log('[ManualOrderFormModal] Resetting customer fields for new non-table, non-prefilled order.');
            setCustomerName('');
            setCustomerPhone('');
            setCustomerAddress('');
            setAddressReference('');
            setOrderNotes('');
        }
        // If initialTableId exists and no prefilledCustomer, customer fields remain as they were (potentially from previous state or empty if reset)
    } else {
       console.log('[ManualOrderFormModal] Modal closing. Calling resetFormFields.');
       resetFormFields(); 
    }
  }, [isOpen, initialTableId, prefilledCustomerForOrder, clearPrefilledCustomerForOrder]); 
  
  useEffect(() => {
    if (!initialTableId || orderType !== OrderType.MESA) {
        setTableId('');
    }
    if (orderType !== OrderType.DELIVERY) {
        setCustomerAddress('');
        setAddressReference('');
    }
  }, [orderType, initialTableId]);


  const handleAddItemToOrder = () => {
    if (!selectedMenuItem) {
      setAlert({ message: 'Selecione um item do cardápio.', type: 'error' });
      return;
    }
    if (itemQuantity <= 0) {
      setAlert({ message: 'A quantidade deve ser maior que zero.', type: 'error' });
      return;
    }

    let itemName = selectedMenuItem.name;
    let itemPrice: number;
    let firstHalfFlavorDetails: ManualOrderItem['firstHalfFlavor'] = undefined;
    let secondHalfFlavorDetails: ManualOrderItem['secondHalfFlavor'] = undefined;
    let chosenCrust: PizzaCrust | undefined = undefined;

    if (selectedMenuItem.item_type === 'pizza') {
      if (!selectedPizzaSizeId || !selectedPizzaSizeObject) {
        setAlert({ message: 'Selecione o tamanho da pizza.', type: 'error' });
        return;
      }
      const size = selectedPizzaSizeObject; 
      
      chosenCrust = size.crusts?.find(c => c.id === selectedPizzaCrustId);
      const crustPrice = chosenCrust?.additionalPrice || 0;

      if (isManualHalfAndHalf && manualSecondFlavorId) {
        const secondFlavorItem = menuItems.find(item => item.id === manualSecondFlavorId);
        if (!secondFlavorItem || secondFlavorItem.item_type !== 'pizza') {
          setAlert({ message: 'Segundo sabor da pizza inválido.', type: 'error' });
          return;
        }

        const firstFlavorPriceForSize = selectedMenuItem.sizes?.find(s => s.id === selectedPizzaSizeId)?.price || 0;
        const secondFlavorPriceForSize = secondFlavorItem.sizes?.find(s => s.id === selectedPizzaSizeId)?.price || 0;
        
        if (firstFlavorPriceForSize === 0 || secondFlavorPriceForSize === 0) {
            setAlert({ message: 'Não foi possível determinar o preço para um dos sabores no tamanho selecionado.', type: 'error'});
            return;
        }

        itemPrice = Math.max(firstFlavorPriceForSize, secondFlavorPriceForSize) + crustPrice;
        itemName = `Meia/Meia: ${selectedMenuItem.name} / ${secondFlavorItem.name} (${size.name})`;
        if (chosenCrust && chosenCrust.name) itemName += ` - ${chosenCrust.name}`;

        firstHalfFlavorDetails = {
          menuItemId: selectedMenuItem.id,
          name: selectedMenuItem.name,
          priceForSize: firstFlavorPriceForSize,
          imageUrl: selectedMenuItem.image_url,
        };
        secondHalfFlavorDetails = {
          menuItemId: secondFlavorItem.id,
          name: secondFlavorItem.name,
          priceForSize: secondFlavorPriceForSize,
          imageUrl: secondFlavorItem.image_url,
        };

      } else { 
        itemPrice = size.price + crustPrice;
        itemName = `${selectedMenuItem.name} (${size.name})`;
        if (chosenCrust && chosenCrust.name) itemName += ` - ${chosenCrust.name}`;
        firstHalfFlavorDetails = { 
            menuItemId: selectedMenuItem.id,
            name: selectedMenuItem.name,
            priceForSize: size.price, 
            imageUrl: selectedMenuItem.image_url,
        };
      }
    } else { 
      itemPrice = selectedMenuItem.price;
    }

    const newItem: ManualOrderItem = {
      id: generateId(), 
      menuItemId: selectedMenuItem.id,
      name: itemName,
      price: itemPrice,
      quantity: itemQuantity,
      imageUrl: selectedMenuItem.image_url || (selectedMenuItem.item_type === 'pizza' ? DEFAULT_PIZZA_IMAGE : undefined),
      itemType: selectedMenuItem.item_type,
      selectedSize: selectedMenuItem.item_type === 'pizza' ? selectedPizzaSizeObject : undefined,
      selectedCrust: chosenCrust,
      isHalfAndHalf: selectedMenuItem.item_type === 'pizza' && isManualHalfAndHalf && !!manualSecondFlavorId,
      firstHalfFlavor: firstHalfFlavorDetails,
      secondHalfFlavor: secondHalfFlavorDetails,
    };

    setCurrentOrderItems(prevItems => [...prevItems, newItem]);
    setSelectedMenuItemId(''); 
    setItemQuantity(1);
  };

  const handleRemoveItemFromOrder = (itemId: string) => {
    setCurrentOrderItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const resetFormFields = () => {
    const defaultOrderType = initialTableId ? OrderType.MESA : OrderType.BALCAO;
    setOrderType(defaultOrderType);
    setTableId(initialTableId || '');
    // Do not reset customerName and customerPhone here if they were prefilled
    // The prefill logic in useEffect handles setting them and subsequent non-prefilled opens will reset them.
    if (!prefilledCustomerForOrder) {
      setCustomerName('');
      setCustomerPhone('');
    }
    setCustomerAddress('');
    setAddressReference('');
    setOrderNotes('');
    setPaymentMethodState(PaymentMethod.DINHEIRO);
    setAmountPaid(undefined);
    setChangeDue(undefined);
    setCurrentOrderItems([]);
    setSelectedMenuItemId('');
    setItemQuantity(1);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderType === OrderType.DELIVERY && (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim())) {
        setAlert({ message: 'Para Delivery, nome, telefone e endereço são obrigatórios.', type: 'error' });
        return;
    } else if (orderType === OrderType.BALCAO && (!customerName.trim() || !customerPhone.trim())) {
        setAlert({ message: 'Para Balcão, nome e telefone são obrigatórios.', type: 'error' });
        return;
    } else if (orderType === OrderType.MESA && !tableId.trim()) {
         setAlert({ message: 'Para Mesa, o número/nome da mesa é obrigatório.', type: 'error'});
         return;
    }

    if (currentOrderItems.length === 0) {
      setAlert({ message: 'Adicione pelo menos um item ao pedido.', type: 'error' });
      return;
    }

    if (orderType !== OrderType.MESA && paymentMethodState === PaymentMethod.DINHEIRO && (amountPaid === undefined || amountPaid < totalAmount)) {
        setAlert({message: "Para pagamento em dinheiro, o valor pago deve ser informado e ser maior ou igual ao total.", type: "error"});
        return;
    }

    const manualOrderData: ManualOrderData = {
      customerName, 
      customerPhone: customerPhone || undefined,
      customerAddress: orderType === OrderType.DELIVERY ? customerAddress : undefined,
      addressReference: orderType === OrderType.DELIVERY ? addressReference || undefined : undefined,
      notes: orderNotes || undefined,
      items: currentOrderItems,
      orderType,
      tableId: orderType === OrderType.MESA ? tableId : undefined,
      paymentMethod: orderType !== OrderType.MESA ? paymentMethodState : undefined, 
      amountPaid: orderType !== OrderType.MESA && paymentMethodState === PaymentMethod.DINHEIRO ? amountPaid : undefined, 
    };

    const createdOrder = createManualOrder(manualOrderData);
    if (createdOrder) {
      resetFormFields();
      onClose(); 
    }
  };

  if (!isOpen) return null;

  return (
    <Modal title={initialTableId ? `Novo Pedido para Mesa ${tables.find(t=>t.id === initialTableId)?.name || initialTableId}` : "Novo Pedido Manual"} onClose={() => { resetFormFields(); onClose();}}>
      <form onSubmit={handleSubmitOrder} className="space-y-5 max-h-[80vh] overflow-y-auto pr-2 pb-4">
        <fieldset className="border p-3 rounded-md">
            <legend className="text-sm font-medium text-gray-700 px-1">Tipo de Pedido*</legend>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ORDER_TYPES.map(typeOpt => (
                    <label key={typeOpt.value} className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all ${orderType === typeOpt.value ? 'bg-primary text-white ring-2 ring-primary-dark' : 'hover:bg-gray-50'}`}>
                        <input type="radio" name="orderType" value={typeOpt.value} checked={orderType === typeOpt.value} onChange={() => setOrderType(typeOpt.value)} className="form-radio h-4 w-4 text-primary focus:ring-primary-dark" disabled={!!initialTableId && typeOpt.value !== OrderType.MESA}/>
                        <span>{typeOpt.label}</span>
                    </label>
                ))}
            </div>
        </fieldset>

        <fieldset className="border p-3 rounded-md">
          <legend className="text-sm font-medium text-gray-700 px-1">Dados do Cliente</legend>
          <div className="space-y-3 mt-1">
            <div>
              <label htmlFor="manualCustomerName" className="block text-xs font-medium text-gray-600">Nome do Cliente {orderType === OrderType.DELIVERY || orderType === OrderType.BALCAO ? '*' : '(Opcional para Mesa)'}</label>
              <input type="text" id="manualCustomerName" value={customerName} onChange={e => setCustomerName(e.target.value)} required={orderType === OrderType.DELIVERY || orderType === OrderType.BALCAO} className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label htmlFor="manualCustomerPhone" className="block text-xs font-medium text-gray-600">Telefone {orderType === OrderType.DELIVERY || orderType === OrderType.BALCAO ? '*' : '(Opcional para Mesa)'}</label>
              <input type="tel" id="manualCustomerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required={orderType === OrderType.DELIVERY || orderType === OrderType.BALCAO} className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary" />
            </div>

            {orderType === OrderType.DELIVERY && (
                <>
                    <div>
                        <label htmlFor="manualCustomerAddress" className="block text-xs font-medium text-gray-600">Endereço Completo*</label>
                        <textarea id="manualCustomerAddress" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} rows={2} required className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label htmlFor="manualAddressReference" className="block text-xs font-medium text-gray-600">Ponto de Referência</label>
                        <input type="text" id="manualAddressReference" value={addressReference} onChange={e => setAddressReference(e.target.value)} className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary" />
                    </div>
                </>
            )}
            {orderType === OrderType.MESA && (
                 <div>
                    <label htmlFor="manualTableId" className="block text-xs font-medium text-gray-600">Número/Nome da Mesa*</label>
                     <select 
                        id="manualTableId" 
                        value={tableId} 
                        onChange={e => setTableId(e.target.value)} 
                        required 
                        className="mt-1 block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary"
                        disabled={!!initialTableId} 
                     >
                        <option value="" disabled>Selecione uma mesa disponível</option>
                        {availableTablesForDropdown.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                        ))}
                        {availableTablesForDropdown.length === 0 && !initialTableId && <option value="" disabled>Nenhuma mesa disponível</option>}
                    </select>
                </div>
            )}
          </div>
        </fieldset>

        <fieldset className="border p-3 rounded-md">
          <legend className="text-sm font-medium text-gray-700 px-1">Adicionar Itens ao Pedido</legend>
          <div className="space-y-3 mt-1">
            <div>
              <label htmlFor="manualMenuItem" className="block text-xs font-medium text-gray-600">Item do Cardápio*</label>
              <select id="manualMenuItem" value={selectedMenuItemId} onChange={e => setSelectedMenuItemId(e.target.value)} className="mt-1 block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary">
                <option value="" disabled>Selecione um item</option>
                {menuItems.filter(mi => mi.available).map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.item_type === 'pizza' ? 'Pizza' : 'Padrão'}) - R$ {item.price.toFixed(2)}</option>
                ))}
              </select>
            </div>

            {selectedMenuItem?.item_type === 'pizza' && (
              <>
                <div>
                  <label htmlFor="manualPizzaSize" className="block text-xs font-medium text-gray-600">Tamanho da Pizza*</label>
                  <select id="manualPizzaSize" value={selectedPizzaSizeId || ''} onChange={e => setSelectedPizzaSizeId(e.target.value)} required={selectedMenuItem.item_type === 'pizza'} className="mt-1 block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary">
                    <option value="" disabled>Selecione um tamanho</option>
                    {selectedMenuItem.sizes?.map(size => (
                      <option key={size.id} value={size.id}>{size.name} (R$ {size.price.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                {selectedPizzaSizeObject && selectedPizzaSizeObject.crusts && selectedPizzaSizeObject.crusts.length > 0 && (
                    <div>
                        <label htmlFor="manualPizzaCrust" className="block text-xs font-medium text-gray-600">Borda da Pizza (Tamanho: {selectedPizzaSizeObject.name})</label>
                        <select id="manualPizzaCrust" value={selectedPizzaCrustId || ''} onChange={e => setSelectedPizzaCrustId(e.target.value)} className="mt-1 block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary">
                        <option value="">Sem borda selecionada</option>
                        {selectedPizzaSizeObject.crusts.map(crust => (
                            <option key={crust.id} value={crust.id}>{crust.name} (+R$ {crust.additionalPrice.toFixed(2)})</option>
                        ))}
                        </select>
                    </div>
                )}
                {selectedMenuItem.allow_half_and_half && (
                    <div className="mt-2 space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isManualHalfAndHalf}
                                onChange={e => {
                                    setIsManualHalfAndHalf(e.target.checked);
                                    if (!e.target.checked) setManualSecondFlavorId(null);
                                }}
                                className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                            />
                            <span className="text-xs font-medium text-gray-600">Pedido Meia a Meia?</span>
                        </label>
                        {isManualHalfAndHalf && (
                            <div>
                                <label htmlFor="manualSecondFlavor" className="block text-xs font-medium text-gray-600">2º Sabor da Pizza*</label>
                                <select 
                                    id="manualSecondFlavor" 
                                    value={manualSecondFlavorId || ''} 
                                    onChange={e => setManualSecondFlavorId(e.target.value)}
                                    required={isManualHalfAndHalf}
                                    className="mt-1 block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary"
                                >
                                    <option value="" disabled>Selecione o segundo sabor</option>
                                    {availableSecondFlavors.map(flavor => (
                                        <option key={flavor.id} value={flavor.id}>{flavor.name}</option>
                                    ))}
                                </select>
                                {availableSecondFlavors.length === 0 && <p className="text-xs text-gray-500 italic mt-1">Nenhum outro sabor compatível disponível.</p>}
                            </div>
                        )}
                    </div>
                )}
              </>
            )}

            <div>
              <label htmlFor="manualItemQuantity" className="block text-xs font-medium text-gray-600">Quantidade*</label>
              <input type="number" id="manualItemQuantity" value={itemQuantity} onChange={e => setItemQuantity(parseInt(e.target.value, 10))} min="1" required className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary" />
            </div>
            <button type="button" onClick={handleAddItemToOrder} className="w-full flex items-center justify-center text-sm font-medium text-white bg-green-500 hover:bg-green-600 py-2 px-3 rounded-md shadow-sm">
              <PlusIcon className="w-4 h-4 mr-1" /> Adicionar Item
            </button>
          </div>
        </fieldset>

        {currentOrderItems.length > 0 && (
          <fieldset className="border p-3 rounded-md">
            <legend className="text-sm font-medium text-gray-700 px-1">Itens no Pedido</legend>
            <div className="space-y-2 mt-1 max-h-40 overflow-y-auto">
              {currentOrderItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <p className="font-medium text-gray-700">{item.quantity}x {item.name}</p>
                    <p className="text-xs text-gray-500">R$ {item.price.toFixed(2)} cada</p>
                  </div>
                  <div className="flex items-center">
                    <p className="font-medium text-gray-800 mr-2">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    <button type="button" onClick={() => handleRemoveItemFromOrder(item.id)} className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-100">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right font-bold text-xl text-gray-800 mt-2 pt-2 border-t">
              Total: R$ {totalAmount.toFixed(2)}
            </div>
          </fieldset>
        )}
        
        {orderType !== OrderType.MESA && (
            <fieldset className="border p-3 rounded-md">
                <legend className="text-sm font-medium text-gray-700 px-1">Forma de Pagamento*</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map(methodOpt => (
                        <label key={methodOpt.value} className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethodState === methodOpt.value ? 'bg-secondary text-white ring-2 ring-secondary-dark' : 'hover:bg-gray-50'}`}>
                            <input type="radio" name="paymentMethod" value={methodOpt.value} checked={paymentMethodState === methodOpt.value} onChange={() => setPaymentMethodState(methodOpt.value)} className="form-radio h-4 w-4 text-secondary focus:ring-secondary-dark"/>
                            <span>{methodOpt.label}</span>
                        </label>
                    ))}
                </div>
                {paymentMethodState === PaymentMethod.DINHEIRO && (
                    <div className="mt-4 space-y-2">
                        <div>
                            <label htmlFor="amountPaid" className="block text-xs font-medium text-gray-600">Valor Pago Pelo Cliente (R$)</label>
                            <input type="number" id="amountPaid" value={amountPaid === undefined ? '' : amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || undefined)} step="0.01" min="0" className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary" />
                        </div>
                        {changeDue !== undefined && (
                            <div>
                                <label className="block text-xs font-medium text-gray-600">Troco a ser dado (R$)</label>
                                <input type="text" readOnly value={changeDue.toFixed(2)} className={`mt-1 block w-full px-2 py-1.5 border rounded-md shadow-sm text-sm bg-gray-100 ${changeDue < 0 ? 'text-red-600 border-red-400' : 'text-green-600 border-gray-300'}`} />
                                {changeDue < 0 && <p className="text-xs text-red-500 mt-1">Valor pago é insuficiente.</p>}
                            </div>
                        )}
                    </div>
                )}
            </fieldset>
        )}
        
         <div>
            <label htmlFor="manualOrderNotes" className="block text-xs font-medium text-gray-600">Observações do Pedido</label>
            <textarea id="manualOrderNotes" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={2} className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary" placeholder="Ex: Cliente pediu troco para R$100..." />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t mt-4">
          <button
            type="button"
            onClick={() => { resetFormFields(); onClose();}}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm"
          >
            Salvar Pedido Manual
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ManualOrderFormModal;

