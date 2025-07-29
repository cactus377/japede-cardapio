
import React, { useEffect, useState } from 'react';
import { Order, OrderItem, MenuItem } from '../types';
import { useAppContext } from '@/contexts/AppContext'; // To access menuItems for send_to_kitchen flag
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface PrintPageProps {
  orderId: string;
  printType: 'kitchen' | 'order';
}

const PrintPage: React.FC<PrintPageProps> = ({ orderId, printType }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { menuItems, settings } = useAppContext(); // Get menuItems for send_to_kitchen logic

  useEffect(() => {
    const orderDataString = sessionStorage.getItem('printOrder_' + orderId);
    if (orderDataString) {
      try {
        const parsedOrder: Order = JSON.parse(orderDataString);
        setOrder(parsedOrder);
        // Optional: Remove immediately after reading if that's the desired behavior
        // sessionStorage.removeItem('printOrder_' + orderId); 
      } catch (e) {
        console.error("Error parsing order data from sessionStorage:", e);
        setError("Erro ao carregar dados do pedido para impressão.");
      }
    } else {
      setError(`Dados do pedido ${orderId} não encontrados para impressão.`);
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    if (order && !loading && !error) {
      // Allow content to render before printing
      setTimeout(() => {
        window.print();
        // Attempt to close the window after print dialog is likely handled.
        // This might not work perfectly in all browsers or if the user cancels print.
        setTimeout(() => {
            sessionStorage.removeItem('printOrder_' + orderId); // Clean up after print attempt
            window.close();
        }, 1000); 
      }, 500); // Small delay to ensure rendering
    }
  }, [order, loading, error, orderId]);

  if (loading) {
    return (
      <div className="print-container p-4 flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
        <p className="mt-2">Carregando para impressão...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="print-container p-4 text-center">
        <p className="text-red-500 font-semibold">Erro:</p>
        <p>{error || "Não foi possível carregar o pedido."}</p>
        <button onClick={() => window.close()} className="mt-4 px-3 py-1.5 bg-gray-300 rounded">Fechar</button>
      </div>
    );
  }
  
  const storeName = settings?.store?.store_name || "Estabelecimento";
  const orderTime = new Date(order.order_time).toLocaleString('pt-BR', {hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'});

  // Filter kitchen items
  const kitchenItems = order.items.filter(orderItem => {
    const menuItemDetail = menuItems.find(mi => mi.id === orderItem.menu_item_id);
    return menuItemDetail?.send_to_kitchen !== false; // Default to true if undefined or null
  });


  return (
    <div className="print-container p-2">
      <style>{`
        @media print {
          body, html {
            margin: 0;
            padding: 0;
            width: 72mm; /* Common thermal width, adjust as needed */
            font-family: 'Courier New', Courier, monospace;
            font-size: 9pt;
            background-color: white !important; /* Ensure white background for printing */
            -webkit-print-color-adjust: exact !important; /* Chrome, Safari */
            color-adjust: exact !important; /* Standard */
          }
          .print-container {
            padding: 2mm !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            background-color: white !important;
          }
          .no-print { display: none !important; }
          .section-title { 
            text-align: center;
            font-weight: bold;
            font-size: 11pt;
            margin-top: 3mm;
            margin-bottom: 2mm;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding-top: 1mm;
            padding-bottom: 1mm;
          }
          .item-list { margin-top: 2mm; }
          .item { display: flex; justify-content: space-between; margin-bottom: 1mm; }
          .item-name { flex-grow: 1; }
          .item-qty { margin-right: 2mm; }
          .item-price { text-align: right; }
          .total-line { display: flex; justify-content: space-between; font-weight: bold; margin-top: 2mm; border-top: 1px solid #000; padding-top: 1mm; }
          .header-info p, .customer-info p, .order-info p, .footer-info p { margin: 0.5mm 0; }
          .header-info h1 { font-size: 12pt; text-align: center; margin-bottom: 1mm; }
          .kitchen-item-name { font-size: 10pt; font-weight: bold; }
          .kitchen-notes { font-style: italic; margin-top: 1mm; }
        }
        /* Screen styles (optional, for reviewing before print) */
        body { font-family: sans-serif; }
        .print-container { 
          width: 300px; /* Approx 80mm for screen preview */
          margin: 20px auto; 
          padding: 10px; 
          border: 1px solid #ccc; 
          box-shadow: 0 0 5px rgba(0,0,0,0.1);
          font-size: 10pt;
        }
        .section-title { font-weight: bold; text-align: center; margin: 5px 0; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 3px 0; }
        .item { display: flex; justify-content: space-between; }
        .total-line { display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px; border-top: 1px solid #ccc; padding-top: 3px;}
        .header-info h1 { font-size: 1.2em; text-align: center; margin-bottom: 5px; }
        .kitchen-item-name { font-size: 1.1em; font-weight: bold; }
        .kitchen-notes { font-style: italic; }
      `}</style>
      
      <button onClick={() => window.print()} className="no-print p-2 bg-blue-500 text-white rounded mb-3">Imprimir</button>
      <button onClick={() => window.close()} className="no-print p-2 bg-gray-300 rounded mb-3 ml-2">Fechar</button>

      {printType === 'kitchen' && (
        <>
          <div className="header-info">
            <h1 style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center' }}>VIA DA COZINHA</h1>
          </div>
          <div className="order-info">
            <p><strong>Pedido:</strong> #{order.id.substring(0, 6)}</p>
            <p><strong>Horário:</strong> {orderTime}</p>
            <p><strong>Cliente:</strong> {order.customer_name}</p>
            {order.order_type && <p><strong>Tipo:</strong> {order.order_type}{order.table_id ? ` (Mesa: ${order.table_id})` : ''}</p>}
          </div>
          
          <div className="section-title">ITENS PARA PREPARO</div>
          <div className="item-list">
            {kitchenItems.length > 0 ? kitchenItems.map((item: OrderItem, index: number) => (
              <div key={index} className="item" style={{ marginBottom: '2mm' }}>
                <span className="item-qty" style={{ fontSize: '11pt', fontWeight: 'bold' }}>{item.quantity}x</span>
                <span className="kitchen-item-name">{item.name}</span>
              </div>
            )) : <p>Nenhum item para cozinha neste pedido.</p>}
          </div>
          {order.notes && (
            <>
              <div className="section-title" style={{ marginTop: '3mm' }}>OBSERVAÇÕES</div>
              <p className="kitchen-notes">{order.notes}</p>
            </>
          )}
        </>
      )}

      {printType === 'order' && (
        <>
          <div className="header-info">
            <h1>{storeName}</h1>
            {settings?.store.address_street && <p style={{textAlign: 'center', fontSize: '8pt'}}>{settings.store.address_street}, {settings.store.address_number} - {settings.store.address_neighborhood}</p>}
            {settings?.store.phone_number && <p style={{textAlign: 'center', fontSize: '8pt'}}>Tel: {settings.store.phone_number}</p>}
          </div>
          <div className="section-title">COMPROVANTE DE PEDIDO</div>
          <div className="order-info">
            <p><strong>Pedido:</strong> #{order.id.substring(0, 6)}</p>
            <p><strong>Data/Hora:</strong> {orderTime}</p>
          </div>
          <div className="customer-info" style={{ marginTop: '2mm', borderTop: '1px dashed #000', paddingTop: '1mm' }}>
            <p><strong>Cliente:</strong> {order.customer_name}</p>
            {order.customer_phone && <p><strong>Telefone:</strong> {order.customer_phone}</p>}
            {order.customer_address && <p><strong>Endereço:</strong> {order.customer_address}</p>}
            {order.order_type && <p><strong>Tipo:</strong> {order.order_type}{order.table_id ? ` (Mesa: ${order.table_id})` : ''}</p>}
          </div>
          <div className="section-title">ITENS</div>
          <div className="item-list">
            {order.items.map((item: OrderItem, index: number) => (
              <div key={index} className="item">
                <span className="item-name">{item.quantity}x {item.name}</span>
                <span className="item-price">R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="total-line" style={{fontSize: '11pt'}}>
            <span>TOTAL:</span>
            <span>R$ {order.total_amount.toFixed(2)}</span>
          </div>
          {order.payment_method && (
             <div style={{ marginTop: '2mm', fontSize: '9pt'}}>
                <p><strong>Pagamento:</strong> {order.payment_method}</p>
                {order.payment_method === "Dinheiro" && order.amount_paid && order.amount_paid > 0 && (
                    <>
                        <p><strong>Valor Pago:</strong> R$ {order.amount_paid.toFixed(2)}</p>
                        <p><strong>Troco:</strong> R$ {(order.change_due ?? 0).toFixed(2)}</p>
                    </>
                )}
            </div>
          )}
          {order.notes && (
            <>
              <div className="section-title" style={{ marginTop: '3mm' }}>OBSERVAÇÕES</div>
              <p style={{fontSize: '9pt'}}>{order.notes}</p>
            </>
          )}
           <div className="footer-info" style={{ textAlign: 'center', marginTop: '4mm', fontSize: '8pt' }}>
            <p>Obrigado pela preferência!</p>
          </div>
        </>
      )}
    </div>
  );
};

export default PrintPage;
