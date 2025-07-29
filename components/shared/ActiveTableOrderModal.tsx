
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Order, Table, CartItem, MenuItem, PizzaSize, PizzaCrust, OrderItem, PaymentMethod, OrderStatus, ManualOrderData, OrderType } from '../../types';
import { useAppContext } from '@/contexts/AppContext';
import Modal from './Modal';
import { PlusIcon, TrashIcon, CheckCircleIcon, CurrencyDollarIcon, CreditCardIcon, UsersIcon, DocumentTextIcon } from '../icons';
import { generateId, PAYMENT_METHODS, DEFAULT_PIZZA_IMAGE } from '../../constants';

interface ActiveTableOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order; // This is the main/original order for the table
  table: Table;
}

const ActiveTableOrderModal: React.FC<ActiveTableOrderModalProps> = ({ isOpen, onClose, order, table }) => {
  const { menuItems, addItemsToOrder, closeTableAccount, setAlert, activeCashSession, alert: globalContextAlert } = useAppContext();

  const [currentOrderItemsState, setCurrentOrderItemsState] = useState<OrderItem[]>(order.items);
  const [itemsToAdd, setItemsToAdd] = useState<CartItem[]>([]); 

  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [selectedPizzaSizeId, setSelectedPizzaSizeId] = useState<string | null>(null);
  const [selectedPizzaCrustId, setSelectedPizzaCrustId] = useState<string | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [isManualHalfAndHalf, setIsManualHalfAndHalf] = useState(false);
  const [manualSecondFlavorId, setManualSecondFlavorId] = useState<string | null>(null);

  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.DINHEIRO);
  const [amountPaid, setAmountPaid] = useState<number | undefined>(undefined);
  const [changeDue, setChangeDue] = useState<number | undefined>(undefined);

  const selectedMenuItem = menuItems.find(item => item.id === selectedMenuItemId);
  const selectedPizzaSizeObject = selectedMenuItem?.item_type === 'pizza' ? selectedMenuItem.sizes?.find(s => s.id === selectedPizzaSizeId) : null;
  
  const totalAmountOriginalOrder = useMemo(() => {
    // This now reflects the sum of items in the 'order' prop, which should be updated by the context
    return currentOrderItemsState.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [currentOrderItemsState]);

  const totalAmountNewItemsStaged = useMemo(() => {
    return itemsToAdd.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [itemsToAdd]);


  const availableSecondFlavors = useMemo(() => {
    if (!selectedMenuItem || selectedMenuItem.item_type !== 'pizza' || !isManualHalfAndHalf) return [];
    return menuItems.filter(
      item => item.id !== selectedMenuItem.id && item.item_type === 'pizza' && item.available && item.allow_half_and_half && item.sizes && item.sizes.length > 0
    );
  }, [menuItems, selectedMenuItem, isManualHalfAndHalf]);
  
  const prevOrderRef = useRef<Order | null>(null);

  useEffect(() => {
    // Update local state if the order prop changes (e.g., due to real-time updates from context)
    setCurrentOrderItemsState(order.items);
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        setShowPaymentSection(false); 
    }
    // Only reset other form states if the modal is being freshly opened for this order,
    // or if the order ID itself has changed (which shouldn't happen for an active modal instance typically)
    if (isOpen && (prevOrderRef.current?.id !== order.id || !prevOrderRef.current || prevOrderRef.current !== order)) {
        setItemsToAdd([]); 
        setShowPaymentSection(false);
        setPaymentMethod(PaymentMethod.DINHEIRO);
        setAmountPaid(undefined);
        setChangeDue(undefined);
        setSelectedMenuItemId(''); 
        setItemQuantity(1);
        // Pizza specific fields will be reset by selectedMenuItemId change effect
    }
    prevOrderRef.current = order;
  }, [order, isOpen]);
  

  useEffect(() => {
    setSelectedPizzaSizeId(null); setSelectedPizzaCrustId(null); setIsManualHalfAndHalf(false); setManualSecondFlavorId(null);
    if (selectedMenuItem?.item_type === 'pizza' && selectedMenuItem.sizes && selectedMenuItem.sizes.length > 0) {
        const defaultSize = selectedMenuItem.sizes[0];
        setSelectedPizzaSizeId(defaultSize.id);
        if (defaultSize.crusts && defaultSize.crusts.length > 0) {
            const defaultCrust = defaultSize.crusts.find(c => c.additionalPrice === 0) || defaultSize.crusts[0];
            setSelectedPizzaCrustId(defaultCrust.id);
        }
    }
  }, [selectedMenuItemId, selectedMenuItem]);

  useEffect(() => {
    if (selectedPizzaSizeObject?.crusts && selectedPizzaSizeObject.crusts.length > 0) {
        const defaultCrust = selectedPizzaSizeObject.crusts.find(c => c.additionalPrice === 0) || selectedPizzaSizeObject.crusts[0];
        setSelectedPizzaCrustId(defaultCrust.id);
    } else {
        setSelectedPizzaCrustId(null);
    }
  }, [selectedPizzaSizeId, selectedPizzaSizeObject]);
  
  useEffect(() => {
    if (paymentMethod === PaymentMethod.DINHEIRO && amountPaid !== undefined && totalAmountOriginalOrder > 0) {
        setChangeDue(amountPaid - totalAmountOriginalOrder);
    } else {
        setChangeDue(undefined);
    }
  }, [amountPaid, totalAmountOriginalOrder, paymentMethod]);


  const handleAddItemToList = () => { 
    if (!selectedMenuItem) { setAlert({ message: 'Selecione um item.', type: 'error' }); return; }
    if (itemQuantity <= 0) { setAlert({ message: 'Quantidade deve ser maior que zero.', type: 'error' }); return; }

    let itemName = selectedMenuItem.name;
    let itemPrice: number;
    let firstHalfFlavorDetails: CartItem['firstHalfFlavor'] = undefined;
    let secondHalfFlavorDetails: CartItem['secondHalfFlavor'] = undefined;
    let chosenCrust: PizzaCrust | undefined = undefined;

    if (selectedMenuItem.item_type === 'pizza') {
      if (!selectedPizzaSizeId || !selectedPizzaSizeObject) { setAlert({ message: 'Selecione o tamanho da pizza.', type: 'error' }); return; }
      const size = selectedPizzaSizeObject;
      chosenCrust = size.crusts?.find(c => c.id === selectedPizzaCrustId);
      const crustPrice = chosenCrust?.additionalPrice || 0;

      if (isManualHalfAndHalf && manualSecondFlavorId) {
        const secondFlavorItem = menuItems.find(item => item.id === manualSecondFlavorId);
        if (!secondFlavorItem || secondFlavorItem.item_type !== 'pizza') { setAlert({ message: 'Segundo sabor inválido.', type: 'error' }); return; }
        const firstFlavorPriceForSize = selectedMenuItem.sizes?.find(s => s.id === selectedPizzaSizeId)?.price || 0;
        const secondFlavorPriceForSize = secondFlavorItem.sizes?.find(s => s.id === selectedPizzaSizeId)?.price || 0;
        if (firstFlavorPriceForSize === 0 || secondFlavorPriceForSize === 0) { setAlert({ message: 'Preço não encontrado para sabor/tamanho.', type: 'error'}); return; }
        itemPrice = Math.max(firstFlavorPriceForSize, secondFlavorPriceForSize) + crustPrice;
        itemName = `Meia/Meia: ${selectedMenuItem.name} / ${secondFlavorItem.name} (${size.name})`;
        if (chosenCrust?.name) itemName += ` - ${chosenCrust.name}`;
        firstHalfFlavorDetails = { menuItemId: selectedMenuItem.id, name: selectedMenuItem.name, priceForSize: firstFlavorPriceForSize, imageUrl: selectedMenuItem.image_url };
        secondHalfFlavorDetails = { menuItemId: secondFlavorItem.id, name: secondFlavorItem.name, priceForSize: secondFlavorPriceForSize, imageUrl: secondFlavorItem.image_url };
      } else {
        itemPrice = size.price + crustPrice;
        itemName = `${selectedMenuItem.name} (${size.name})`;
        if (chosenCrust?.name) itemName += ` - ${chosenCrust.name}`;
        firstHalfFlavorDetails = { menuItemId: selectedMenuItem.id, name: selectedMenuItem.name, priceForSize: size.price, imageUrl: selectedMenuItem.image_url };
      }
    } else { itemPrice = selectedMenuItem.price; }

    const newItemToAdd: CartItem = {
      id: generateId(), menuItemId: selectedMenuItem.id, name: itemName, price: itemPrice, quantity: itemQuantity,
      imageUrl: selectedMenuItem.image_url || (selectedMenuItem.item_type === 'pizza' ? DEFAULT_PIZZA_IMAGE : undefined),
      itemType: selectedMenuItem.item_type, selectedSize: selectedMenuItem.item_type === 'pizza' ? selectedPizzaSizeObject : undefined,
      selectedCrust: chosenCrust, isHalfAndHalf: selectedMenuItem.item_type === 'pizza' && isManualHalfAndHalf && !!manualSecondFlavorId,
      firstHalfFlavor: firstHalfFlavorDetails, secondHalfFlavor: secondHalfFlavorDetails,
    };
    setItemsToAdd(prev => [...prev, newItemToAdd]);
    setSelectedMenuItemId(''); setItemQuantity(1); 
  };

  const handleRemoveNewItem = (itemId: string) => setItemsToAdd(prev => prev.filter(item => item.id !== itemId));

  const handleConfirmAddItemsToExistingOrder = async () => {
    if (itemsToAdd.length === 0) { 
        setAlert({message: "Nenhum item novo selecionado para adicionar.", type: "info"}); 
        return; 
    }
    
    const updatedOrder = await addItemsToOrder(order.id, itemsToAdd);
    if (updatedOrder) {
        setItemsToAdd([]); // Clear the staged items
        // The modal will re-render via context update of 'order' prop
        // Alert is handled by addItemsToOrder in context
    } else {
        // Alert is handled by addItemsToOrder in context
    }
  };

  const handleCloseAccount = async () => {
    console.log('[ActiveTableOrderModal] handleCloseAccount called. Current order status:', order.status);
    console.log('[ActiveTableOrderModal] Payment Method:', paymentMethod, 'Amount Paid:', amountPaid, 'Total Original Order:', totalAmountOriginalOrder);
    console.log('[ActiveTableOrderModal] Active Cash Session:', activeCashSession);

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        setAlert({message: `Este pedido já está ${order.status}. Não pode ser fechado novamente.`, type: "info"});
        console.log('[ActiveTableOrderModal] Order already closed or cancelled. Returning.');
        onClose(); 
        return;
    }

    if (paymentMethod === PaymentMethod.DINHEIRO && (amountPaid === undefined || amountPaid < totalAmountOriginalOrder)) {
        setAlert({message: "Valor pago em dinheiro é insuficiente para o pedido original.", type: "error"});
        console.log('[ActiveTableOrderModal] Insufficient amount paid for DINHEIRO. Returning.');
        return;
    }

    if (!activeCashSession && (paymentMethod === PaymentMethod.DINHEIRO || paymentMethod === PaymentMethod.PIX)) {
        console.log('[ActiveTableOrderModal] No active cash session and payment is DINHEIRO/PIX. Showing confirm dialog.');
        if (!window.confirm("Nenhum caixa aberto. Deseja fechar a conta do pedido original sem registrar no caixa? (Não recomendado)")) {
            console.log('[ActiveTableOrderModal] User cancelled closing without cash register. Returning.');
            setAlert({message: "Fechamento de conta cancelado. Abra um caixa para registrar pagamentos em Dinheiro/PIX.", type: "info"});
            return;
        }
        console.log('[ActiveTableOrderModal] User confirmed closing without cash register.');
    }

    const paymentDetails = { paymentMethod, amountPaid };
    console.log('[ActiveTableOrderModal] Calling context.closeTableAccount with orderId:', order.id, 'PaymentDetails:', paymentDetails);
    try {
        const resultOrder = await closeTableAccount(order.id, paymentDetails);
        console.log('[ActiveTableOrderModal] context.closeTableAccount result:', JSON.parse(JSON.stringify(resultOrder)));

        if (resultOrder) { 
            if (resultOrder.status === OrderStatus.DELIVERED) {
                setAlert({ message: `Conta da Mesa ${table.name} (Pedido #${order.id.substring(0,6)}) fechada com sucesso!`, type: 'success' });
                console.log('[ActiveTableOrderModal] Order closed successfully (status DELIVERED). Closing modal.');
            } else {
                setAlert({ message: `Pedido #${order.id.substring(0,6)} processado. Status atual: ${resultOrder.status}. Verifique o painel.`, type: 'info' });
                console.log(`[ActiveTableOrderModal] Order processed, but status is ${resultOrder.status}.`);
            }
            onClose(); 
        } else {
            if (!globalContextAlert) { 
                 setAlert({message: "Falha ao processar o fechamento da conta. Tente novamente.", type: "error"});
            }
            console.log('[ActiveTableOrderModal] closeTableAccount returned null. Modal remains open.');
        }
    } catch (error) { 
        console.error('[ActiveTableOrderModal] Error calling closeTableAccount:', error);
        setAlert({message: (error as Error).message, type: "error"}); 
    }
  };

  if (!isOpen) return null;

  return (
    <Modal title={`Gerenciar Pedido - Mesa ${table.name} (Comanda #${order.id.substring(0,6)})`} onClose={onClose}>
      <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1 text-sm">
        
        <section>
          <h3 className="text-md font-semibold text-gray-700 mb-2">Itens Atuais na Comanda:</h3>
          {currentOrderItemsState.length > 0 ? (
            <ul className="space-y-1 max-h-40 overflow-y-auto border p-2 rounded-md bg-gray-50">
              {currentOrderItemsState.map(item => (
                <li key={item.id || item.name} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="italic text-gray-500">Nenhum item nesta comanda.</p>}
          <p className="text-right font-semibold mt-1">Subtotal da Comanda: R$ {totalAmountOriginalOrder.toFixed(2)}</p>
        </section>

        {!showPaymentSection && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
          <fieldset className="border p-3 rounded-md">
            <legend className="text-sm font-medium text-gray-700 px-1">Adicionar Novos Itens à Comanda</legend>
            <div className="space-y-2 mt-1">
              <div>
                <label htmlFor="activeTableMenuItem" className="block text-xs font-medium text-gray-600">Item*</label>
                <select id="activeTableMenuItem" value={selectedMenuItemId} onChange={e => setSelectedMenuItemId(e.target.value)} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm text-xs focus:ring-primary focus:border-primary">
                  <option value="" disabled>Selecione</option>
                  {menuItems.filter(mi => mi.available).map(item => (
                    <option key={item.id} value={item.id}>{item.name} (R$ {item.price.toFixed(2)})</option>
                  ))}
                </select>
              </div>
              {selectedMenuItem?.item_type === 'pizza' && ( <>
                <div>
                  <label htmlFor="activeTablePizzaSize" className="block text-xs font-medium text-gray-600">Tamanho*</label>
                  <select id="activeTablePizzaSize" value={selectedPizzaSizeId || ''} onChange={e => setSelectedPizzaSizeId(e.target.value)} required className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm text-xs focus:ring-primary focus:border-primary">
                    <option value="" disabled>Selecione</option>
                    {selectedMenuItem.sizes?.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price.toFixed(2)})</option>)}
                  </select>
                </div>
                {selectedPizzaSizeObject?.crusts && selectedPizzaSizeObject.crusts.length > 0 && (
                    <div>
                        <label htmlFor="activeTablePizzaCrust" className="block text-xs font-medium text-gray-600">Borda ({selectedPizzaSizeObject.name})</label>
                        <select id="activeTablePizzaCrust" value={selectedPizzaCrustId || ''} onChange={e => setSelectedPizzaCrustId(e.target.value)} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm text-xs focus:ring-primary focus:border-primary">
                            <option value="">Sem borda</option>
                            {selectedPizzaSizeObject.crusts.map(c => <option key={c.id} value={c.id}>{c.name} (+R$ {c.additionalPrice.toFixed(2)})</option>)}
                        </select>
                    </div>
                )}
                {selectedMenuItem.allow_half_and_half && ( <div className="mt-1 space-y-1">
                    <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={isManualHalfAndHalf} onChange={e => setIsManualHalfAndHalf(e.target.checked)} className="form-checkbox h-3 w-3 text-primary"/> <span className="text-xs">Meia a Meia?</span></label>
                    {isManualHalfAndHalf && (<div><label htmlFor="activeTableSecondFlavor" className="text-xs">2º Sabor*</label>
                    <select id="activeTableSecondFlavor" value={manualSecondFlavorId || ''} onChange={e => setManualSecondFlavorId(e.target.value)} required className="mt-0.5 w-full text-xs p-1 border-gray-300 rounded bg-white"><option value="" disabled>Selecione</option>{availableSecondFlavors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>)}
                </div>)}
              </>)}
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                    <label htmlFor="activeTableItemQuantity" className="block text-xs font-medium text-gray-600">Qtd*</label>
                    <input type="number" id="activeTableItemQuantity" value={itemQuantity} onChange={e => setItemQuantity(parseInt(e.target.value,10))} min="1" className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs focus:ring-primary focus:border-primary" />
                </div>
                <button type="button" onClick={handleAddItemToList} className="h-8 text-xs flex items-center justify-center font-medium text-white bg-blue-500 hover:bg-blue-600 py-1 px-2 rounded-md shadow-sm"><PlusIcon className="w-3 h-3 mr-1"/> Add Item à Lista</button>
              </div>
            </div>
            {itemsToAdd.length > 0 && (
              <div className="mt-2 space-y-1 max-h-28 overflow-y-auto border p-1.5 rounded-md bg-gray-50">
                <h4 className="text-xs font-medium text-gray-600">Itens para Adicionar à Comanda:</h4>
                {itemsToAdd.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs p-1 bg-white rounded border">
                    <span>{item.quantity}x {item.name} (R$ {item.price.toFixed(2)})</span>
                    <button type="button" onClick={() => handleRemoveNewItem(item.id)} className="text-red-500 p-0.5"><TrashIcon className="w-3 h-3"/></button>
                  </div>
                ))}
                <p className="text-right text-xs font-semibold">Subtotal (Novos Itens): R$ {totalAmountNewItemsStaged.toFixed(2)}</p>
                <button type="button" onClick={handleConfirmAddItemsToExistingOrder} className="mt-1 w-full text-xs flex items-center justify-center font-medium text-white bg-green-500 hover:bg-green-600 py-1.5 px-3 rounded-md shadow-sm">
                    <CheckCircleIcon className="w-4 h-4 mr-1"/> Adicionar à Comanda Atual
                </button>
              </div>
            )}
          </fieldset>
        )}

        <div className="mt-3 pt-3 border-t">
          <p className="text-xl font-bold text-gray-800 text-right">Total da Comanda: R$ {totalAmountOriginalOrder.toFixed(2)}</p>

          {order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
            !showPaymentSection ? (
              <button onClick={() => setShowPaymentSection(true)} className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md">
                <CurrencyDollarIcon className="w-5 h-5 inline mr-2"/> Fechar Conta
              </button>
            ) : (
              <fieldset className="mt-3 border p-3 rounded-md bg-green-50">
                <legend className="text-md font-semibold text-green-700 px-1">Pagamento</legend>
                <div className="grid grid-cols-2 gap-2 my-2">
                  {PAYMENT_METHODS.filter(pm => pm.value !== PaymentMethod.MULTIPLO).map(method => (
                    <label key={method.value} className={`flex items-center space-x-1 p-2 border rounded-md cursor-pointer ${paymentMethod === method.value ? 'bg-green-600 text-white ring-1 ring-green-700' : 'hover:bg-green-100'}`}>
                      <input type="radio" name="tablePaymentMethod" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} className="form-radio h-3 w-3 text-green-600"/>
                      <span className="text-xs">{method.label}</span>
                    </label>
                  ))}
                </div>
                {paymentMethod === PaymentMethod.DINHEIRO && (
                  <div className="space-y-1">
                    <div>
                      <label htmlFor="activeTableAmountPaid" className="block text-xs font-medium text-gray-600">Valor Pago (R$)</label>
                      <input type="number" id="activeTableAmountPaid" value={amountPaid === undefined ? '' : amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || undefined)} step="0.01" min="0" className="mt-0.5 w-full text-xs p-1 border-gray-300 rounded" />
                    </div>
                    {changeDue !== undefined && (
                      <div><label className="text-xs">Troco:</label><input type="text" readOnly value={`R$ ${changeDue.toFixed(2)}`} className={`w-full text-xs p-1 border-0 rounded bg-transparent ${changeDue < 0 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}`} /></div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">Dividir Conta: <span className="italic">Feature em desenvolvimento.</span></p>
                <div className="mt-3 flex gap-2">
                    <button onClick={() => setShowPaymentSection(false)} className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 px-2 rounded-md">Cancelar Pagamento</button>
                    <button onClick={handleCloseAccount} disabled={paymentMethod === PaymentMethod.DINHEIRO && (amountPaid === undefined || amountPaid < totalAmountOriginalOrder)} className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-2 rounded-md disabled:opacity-50">Confirmar Pagamento e Fechar Comanda</button>
                </div>
              </fieldset>
            )
          )}
           {order.status === OrderStatus.DELIVERED && <p className="text-green-600 font-semibold text-center mt-3 p-2 bg-green-50 rounded-md">Comanda Fechada ({new Date(order.last_status_change_time).toLocaleString()})</p>}
           {order.status === OrderStatus.CANCELLED && <p className="text-red-600 font-semibold text-center mt-3 p-2 bg-red-50 rounded-md">Comanda Cancelada</p>}
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border rounded-md">
                Fechar Janela
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default ActiveTableOrderModal;
