

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { CurrencyDollarIcon, CalendarIcon, DocumentTextIcon, FilterIcon } from '@/components/icons'; // Changed DocumentReportIcon to DocumentTextIcon, FilterIconHero to FilterIcon
import { Order, OrderStatus, PaymentMethod, CashRegisterSession, CashRegisterSessionStatus, AlertInfo, CashAdjustment, CashAdjustmentType, MenuItem as MenuItemType, Category as CategoryType } from '../types'; 
import Modal from '@/components/shared/Modal';
import Alert from '@/components/shared/Alert';
import CashAdjustmentModal from '@/components/shared/CashAdjustmentModal'; 


const OpenCashRegisterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpen: (openingBalance: number, notes?: string) => void;
  setAlertProp: (alertInfo: AlertInfo | null) => void; 
}> = ({ isOpen, onClose, onOpen, setAlertProp }) => {
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) {
      setAlertProp({ message: "Saldo inicial inválido. Deve ser um número não negativo.", type: "error" }); 
      return;
    }
    onOpen(balance, notes);
    setOpeningBalance('');
    setNotes('');
  };

  if (!isOpen) return null;

  return (
    <Modal title="Abrir Caixa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700">Saldo Inicial (R$)*</label>
          <input
            type="number"
            id="openingBalance"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            step="0.01"
            min="0"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="openingNotes" className="block text-sm font-medium text-gray-700">Observações de Abertura</label>
          <textarea
            id="openingNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ex: Fundo de troco, etc."
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md shadow-sm">Confirmar Abertura</button>
        </div>
      </form>
    </Modal>
  );
};

const CloseCashRegisterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCloseSession: (closingBalanceInformed: number, notes?: string) => void;
  activeSession: CashRegisterSession | null;
  ordersInSession: Order[];
  adjustmentsInSession: CashAdjustment[];
}> = ({ isOpen, onClose, onCloseSession, activeSession, ordersInSession, adjustmentsInSession }) => {
  const [closingBalanceInformed, setClosingBalanceInformed] = useState('');
  const [notes, setNotes] = useState('');
  const { setAlert } = useAppContext();

  const calculatedSalesFromOrders = useMemo(() => {
    return ordersInSession
        .filter(o => o.status === OrderStatus.DELIVERED && (o.payment_method === PaymentMethod.DINHEIRO || o.payment_method === PaymentMethod.PIX))
        .reduce((sum, order) => sum + order.total_amount, 0);
  }, [ordersInSession]);

  const totalAddedAdjustments = useMemo(() => {
    return adjustmentsInSession.filter(adj => adj.type === CashAdjustmentType.ADD).reduce((sum, adj) => sum + adj.amount, 0);
  }, [adjustmentsInSession]);
  
  const totalRemovedAdjustments = useMemo(() => {
    return adjustmentsInSession.filter(adj => adj.type === CashAdjustmentType.REMOVE).reduce((sum, adj) => sum + adj.amount, 0);
  }, [adjustmentsInSession]);

  const expectedInCash = activeSession ? activeSession.opening_balance + calculatedSalesFromOrders + totalAddedAdjustments - totalRemovedAdjustments : 0;
  const difference = closingBalanceInformed ? parseFloat(closingBalanceInformed) - expectedInCash : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(closingBalanceInformed);
    if (isNaN(balance) || balance < 0) {
      setAlert({ message: "Saldo final informado inválido. Deve ser um número não negativo.", type: 'error' });
      return;
    }
    if (!activeSession) {
        setAlert({ message: "Nenhuma sessão ativa para fechar.", type: 'error'});
        return;
    }
    onCloseSession(balance, notes);
    setClosingBalanceInformed('');
    setNotes('');
  };

  if (!isOpen || !activeSession) return null;

  return (
    <Modal title="Fechar Caixa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="p-3 bg-gray-50 rounded-md border">
            <p><strong>Caixa Aberto em:</strong> {new Date(activeSession.opened_at).toLocaleString()}</p>
            <p><strong>Saldo Inicial:</strong> <span className="font-semibold text-blue-600">R$ {activeSession.opening_balance.toFixed(2)}</span></p>
        </div>
         <div className="p-3 bg-yellow-50 rounded-md border border-yellow-300">
            <p><strong>Vendas (Dinheiro/PIX):</strong> <span className="font-semibold text-green-600">R$ {calculatedSalesFromOrders.toFixed(2)}</span></p>
            <p><strong>Ajustes de Entrada:</strong> <span className="font-semibold text-green-500">R$ {totalAddedAdjustments.toFixed(2)}</span></p>
            <p><strong>Ajustes de Saída:</strong> <span className="font-semibold text-red-500">R$ {totalRemovedAdjustments.toFixed(2)}</span></p>
            <p><strong>Total Esperado em Caixa:</strong> <span className="font-semibold text-indigo-600">R$ {expectedInCash.toFixed(2)}</span></p>
        </div>
        <div>
          <label htmlFor="closingBalanceInformed" className="block text-sm font-medium text-gray-700">Saldo Contado em Caixa (R$)*</label>
          <input type="number" id="closingBalanceInformed" value={closingBalanceInformed} onChange={(e) => setClosingBalanceInformed(e.target.value)} step="0.01" min="0" className="mt-1 block w-full input-style" required />
        </div>
        {difference !== undefined && (
             <div className={`p-3 rounded-md border ${difference === 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <p><strong>Diferença:</strong> <span className={`font-semibold ${difference === 0 ? 'text-green-700' : 'text-red-700'}`}> R$ {difference.toFixed(2)} {difference > 0 ? "(Sobra)" : difference < 0 ? "(Falta)" : "(Correto)"} </span></p>
            </div>
        )}
        <div>
          <label htmlFor="closingNotes" className="block text-sm font-medium text-gray-700">Observações de Fechamento</label>
          <textarea id="closingNotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 block w-full input-style" placeholder="Ex: Diferença devido a troco, etc." />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-danger">Confirmar Fechamento</button>
        </div>
      </form>
    </Modal>
  );
};

interface DateRange { startDate: string; endDate: string; }
interface SalesReportData {
  totalDeliveredOrders: number;
  grossRevenue: number;
  averageTicket: number;
  salesByPaymentMethod: { method: PaymentMethod; count: number; total: number }[];
  bestSellingItems: { itemId: string; name: string; quantity: number; revenue: number; }[];
  salesByCategory: { categoryId: string; name: string; quantity: number; revenue: number; }[];
}

const FinancialsPage: React.FC = () => {
  const { orders, activeCashSession, cashSessions, cashAdjustments, openCashRegister, closeCashRegister, alert: globalAlert, setAlert, menuItems, categories } = useAppContext();
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [reportData, setReportData] = useState<SalesReportData | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0]; today.setDate(today.getDate() + 1); // Reset today
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))).toISOString().split('T')[0]; today.setDate(today.getDate() + today.getDay() - (today.getDay() === 0 ? -6 : 1) ); // Reset today
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];


  const adjustmentsForActiveSession = useMemo(() => activeCashSession ? cashAdjustments.filter(adj => adj.session_id === activeCashSession.id) : [], [cashAdjustments, activeCashSession]);
  const totalAddedInActiveSession = useMemo(() => adjustmentsForActiveSession.filter(adj => adj.type === CashAdjustmentType.ADD).reduce((sum, adj) => sum + adj.amount, 0), [adjustmentsForActiveSession]);
  const totalRemovedInActiveSession = useMemo(() => adjustmentsForActiveSession.filter(adj => adj.type === CashAdjustmentType.REMOVE).reduce((sum, adj) => sum + adj.amount, 0), [adjustmentsForActiveSession]);
  const ordersInActiveSession = useMemo(() => activeCashSession ? orders.filter(order => order.cash_register_session_id === activeCashSession.id) : [], [orders, activeCashSession]);
  const salesInActiveSessionFromOrders = useMemo(() => activeCashSession ? ordersInActiveSession.filter(o => o.status === OrderStatus.DELIVERED && (o.payment_method === PaymentMethod.DINHEIRO || o.payment_method === PaymentMethod.PIX)).reduce((sum, order) => sum + order.total_amount, 0) : 0, [ordersInActiveSession, activeCashSession]);
  const expectedInActiveCash = activeCashSession ? activeCashSession.opening_balance + salesInActiveSessionFromOrders + totalAddedInActiveSession - totalRemovedInActiveSession : 0;

  const handleOpenCashRegister = async (openingBalance: number, notes?: string) => { await openCashRegister(openingBalance, notes); setIsOpeningModalOpen(false); };
  const handleCloseCashRegister = async (closingBalanceInformed: number, notes?: string) => { if (activeCashSession) { await closeCashRegister(activeCashSession.id, closingBalanceInformed, notes); setIsClosingModalOpen(false); } else { setAlert({message: "Nenhuma sessão de caixa ativa para fechar.", type: 'error'}); } };

  const handleGenerateReport = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setAlert({ message: "Selecione as datas de início e fim para gerar o relatório.", type: "error" });
      return;
    }
    const start = new Date(dateRange.startDate + "T00:00:00");
    const end = new Date(dateRange.endDate + "T23:59:59");

    const filteredDeliveredOrders = orders.filter(order => {
      const orderTime = new Date(order.order_time);
      return order.status === OrderStatus.DELIVERED && orderTime >= start && orderTime <= end;
    });

    const grossRevenue = filteredDeliveredOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalDeliveredOrdersCount = filteredDeliveredOrders.length;
    const averageTicket = totalDeliveredOrdersCount > 0 ? grossRevenue / totalDeliveredOrdersCount : 0;

    const salesByPaymentMethod = Object.values(PaymentMethod).map(method => {
      const ordersForMethod = filteredDeliveredOrders.filter(o => o.payment_method === method);
      return {
        method,
        count: ordersForMethod.length,
        total: ordersForMethod.reduce((sum, o) => sum + o.total_amount, 0),
      };
    }).filter(pm => pm.count > 0);

    // Best Selling Items
    const itemSales: { [itemId: string]: { name: string; quantity: number; revenue: number; categoryId: string; } } = {};
    filteredDeliveredOrders.forEach(order => {
        order.items.forEach(orderItem => {
            const menuItem = menuItems.find(mi => mi.id === orderItem.menu_item_id);
            if (!menuItem) return;

            if (!itemSales[orderItem.menu_item_id]) {
                itemSales[orderItem.menu_item_id] = { name: menuItem.name, quantity: 0, revenue: 0, categoryId: menuItem.category_id };
            }
            itemSales[orderItem.menu_item_id].quantity += orderItem.quantity;
            itemSales[orderItem.menu_item_id].revenue += orderItem.price * orderItem.quantity;
        });
    });
    const bestSellingItems = Object.entries(itemSales)
        .map(([itemId, data]) => ({ itemId, ...data }))
        .sort((a, b) => b.quantity - a.quantity);

    // Sales by Category
    const categorySales: { [categoryId: string]: { name: string; quantity: number; revenue: number; } } = {};
    bestSellingItems.forEach(itemSale => {
        const category = categories.find(cat => cat.id === itemSale.categoryId);
        if (!category) return;

        if (!categorySales[itemSale.categoryId]) {
            categorySales[itemSale.categoryId] = { name: category.name, quantity: 0, revenue: 0 };
        }
        categorySales[itemSale.categoryId].quantity += itemSale.quantity;
        categorySales[itemSale.categoryId].revenue += itemSale.revenue;
    });
    const salesByCategory = Object.entries(categorySales)
        .map(([categoryId, data]) => ({ categoryId, ...data }))
        .sort((a, b) => b.revenue - a.revenue);


    setReportData({ totalDeliveredOrders: totalDeliveredOrdersCount, grossRevenue, averageTicket, salesByPaymentMethod, bestSellingItems, salesByCategory });
    setAlert({ message: `Relatório gerado para o período de ${start.toLocaleDateString()} a ${end.toLocaleDateString()}.`, type: "success"});
  };

  return (
    <div className="space-y-8">
      {globalAlert && <Alert message={globalAlert.message} type={globalAlert.type} onClose={() => setAlert(null)} />}
      <div className="flex items-center space-x-2"> <CurrencyDollarIcon className="w-8 h-8 text-green-600" /> <h1 className="text-3xl font-semibold text-gray-800">Financeiro e Caixa</h1> </div>
      
      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">Gerenciamento de Caixa</h2>
        {/* Caixa content remains unchanged */}
         {activeCashSession ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
                <div className="mb-2 sm:mb-0"> <p className="text-xl font-semibold text-green-700">Caixa Aberto</p> <p className="text-xs text-gray-600">Aberto em: {new Date(activeCashSession.opened_at).toLocaleString()}</p> </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button onClick={() => setIsAdjustmentModalOpen(true)} className="btn-info text-sm">Ajustar Caixa</button>
                    <button onClick={() => setIsClosingModalOpen(true)} className="btn-danger text-sm">Fechar Caixa</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="stat-box"><p>Saldo Inicial:</p><p className="stat-value text-blue-600">R$ {activeCashSession.opening_balance.toFixed(2)}</p></div>
                <div className="stat-box"><p>Vendas (Dinheiro/PIX):</p><p className="stat-value text-green-600">R$ {salesInActiveSessionFromOrders.toFixed(2)}</p></div>
                <div className="stat-box"><p>Ajustes de Entrada:</p><p className="stat-value text-green-500">R$ {totalAddedInActiveSession.toFixed(2)}</p></div>
                <div className="stat-box"><p>Ajustes de Saída:</p><p className="stat-value text-red-500">R$ {totalRemovedInActiveSession.toFixed(2)}</p></div>
            </div>
             <div className="p-3 bg-indigo-50 rounded-md border border-indigo-300 mt-2"><p className="text-gray-600 text-sm">Total Esperado (Atual):</p><p className="text-xl font-bold text-indigo-700">R$ {expectedInActiveCash.toFixed(2)}</p></div>
            {activeCashSession.notes_opening && <p className="text-xs italic text-gray-500 mt-2">Obs. Abertura: {activeCashSession.notes_opening}</p>}
            {adjustmentsForActiveSession.length > 0 && ( <div className="mt-4"> <h3 className="text-md font-semibold text-gray-600 mb-1">Ajustes Manuais Nesta Sessão:</h3> <ul className="max-h-40 overflow-y-auto space-y-1 text-xs border p-2 rounded-md bg-gray-50"> {adjustmentsForActiveSession.map(adj => ( <li key={adj.id} className={`p-1.5 rounded flex justify-between items-center ${adj.type === CashAdjustmentType.ADD ? 'bg-green-50' : 'bg-red-50'}`}> <div><span className={`font-medium ${adj.type === CashAdjustmentType.ADD ? 'text-green-700' : 'text-red-700'}`}>{adj.type === CashAdjustmentType.ADD ? 'ENTRADA' : 'SAÍDA'}: R$ {adj.amount.toFixed(2)}</span><span className="text-gray-500 block text-xxs">Motivo: {adj.reason}</span></div> <span className="text-gray-400 text-xxs">{new Date(adj.adjusted_at).toLocaleTimeString()}</span></li>))}</ul></div>)}
          </div>
        ) : ( <div className="flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-500 rounded-md"> <div> <p className="text-xl font-semibold text-red-700">Caixa Fechado</p> <p className="text-xs text-gray-600">Nenhuma sessão ativa.</p> </div> <button onClick={() => setIsOpeningModalOpen(true)} className="btn-success">Abrir Caixa</button> </div> )}
      </section>

      <OpenCashRegisterModal isOpen={isOpeningModalOpen} onClose={() => setIsOpeningModalOpen(false)} onOpen={handleOpenCashRegister} setAlertProp={setAlert} />
      <CloseCashRegisterModal isOpen={isClosingModalOpen} onClose={() => setIsClosingModalOpen(false)} onCloseSession={handleCloseCashRegister} activeSession={activeCashSession} ordersInSession={ordersInActiveSession} adjustmentsInSession={adjustmentsForActiveSession} />
      {activeCashSession && ( <CashAdjustmentModal isOpen={isAdjustmentModalOpen} onClose={() => setIsAdjustmentModalOpen(false)} activeSessionId={activeCashSession.id} /> )}

      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center"><DocumentTextIcon className="w-6 h-6 mr-2 text-indigo-600"/>Relatórios Financeiros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
          <div> <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Data Início</label> <input type="date" id="startDate" value={dateRange.startDate} onChange={e => setDateRange(prev => ({...prev, startDate: e.target.value}))} className="mt-1 input-style w-full" /> </div>
          <div> <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Data Fim</label> <input type="date" id="endDate" value={dateRange.endDate} onChange={e => setDateRange(prev => ({...prev, endDate: e.target.value}))} className="mt-1 input-style w-full" /> </div>
          <button onClick={handleGenerateReport} className="btn-primary h-10 flex items-center justify-center"><FilterIcon className="w-5 h-5 mr-2"/>Gerar Relatório</button>
        </div>
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <button onClick={() => setDateRange({ startDate: todayStr, endDate: todayStr })} className="btn-outline-secondary">Hoje</button>
            <button onClick={() => setDateRange({ startDate: yesterdayStr, endDate: yesterdayStr })} className="btn-outline-secondary">Ontem</button>
            <button onClick={() => setDateRange({ startDate: startOfWeek, endDate: todayStr })} className="btn-outline-secondary">Esta Semana</button>
            <button onClick={() => setDateRange({ startDate: startOfMonth, endDate: endOfMonth })} className="btn-outline-secondary">Este Mês</button>
        </div>

        {reportData && (
          <div className="space-y-6 mt-6 pt-4 border-t">
            <h3 className="text-xl font-semibold text-gray-700">Resultados para o Período Selecionado:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat-box"><p>Total Pedidos Entregues:</p><p className="stat-value">{reportData.totalDeliveredOrders}</p></div>
              <div className="stat-box"><p>Receita Bruta:</p><p className="stat-value text-green-600">R$ {reportData.grossRevenue.toFixed(2)}</p></div>
              <div className="stat-box"><p>Ticket Médio:</p><p className="stat-value text-blue-600">R$ {reportData.averageTicket.toFixed(2)}</p></div>
            </div>
            
            <div className="report-table-section"> <h4 className="report-table-title">Vendas por Forma de Pagamento</h4> <div className="overflow-x-auto"> <table className="report-table"><thead><tr><th>Forma de Pagamento</th><th>Nº Pedidos</th><th>Valor Total (R$)</th></tr></thead><tbody> {reportData.salesByPaymentMethod.map(pm => (<tr key={pm.method}><td>{pm.method}</td><td>{pm.count}</td><td className="text-right">R$ {pm.total.toFixed(2)}</td></tr>))}</tbody></table></div></div>
            <div className="report-table-section"> <h4 className="report-table-title">Itens Mais Vendidos</h4> <div className="overflow-x-auto"> <table className="report-table"><thead><tr><th>Item</th><th>Qtd. Vendida</th><th>Receita Gerada (R$)</th></tr></thead><tbody> {reportData.bestSellingItems.map(item => (<tr key={item.itemId}><td>{item.name}</td><td className="text-center">{item.quantity}</td><td className="text-right">R$ {item.revenue.toFixed(2)}</td></tr>))}</tbody></table></div></div>
            <div className="report-table-section"> <h4 className="report-table-title">Vendas por Categoria</h4> <div className="overflow-x-auto"> <table className="report-table"><thead><tr><th>Categoria</th><th>Itens Vendidos</th><th>Receita Gerada (R$)</th></tr></thead><tbody> {reportData.salesByCategory.map(cat => (<tr key={cat.categoryId}><td>{cat.name}</td><td className="text-center">{cat.quantity}</td><td className="text-right">R$ {cat.revenue.toFixed(2)}</td></tr>))}</tbody></table></div></div>
          </div>
        )}
      </section>
      
      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"> <CalendarIcon className="w-6 h-6 mr-2 text-gray-600"/> Histórico de Caixas </h2>
        {/* Histórico de Caixas content remains unchanged */}
        <div className="overflow-x-auto"> <table className="min-w-full divide-y divide-gray-200 text-sm"> <thead className="bg-gray-50"><tr><th className="th-style">Abertura</th><th className="th-style">Fechamento</th><th className="th-style text-right">Saldo Inicial</th><th className="th-style text-right">Vendas (Din/PIX)</th><th className="th-style text-right">Esperado</th><th className="th-style text-right">Contado Final</th><th className="th-style text-right">Diferença</th><th className="th-style">Status</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{cashSessions.length > 0 ? cashSessions.map(session => (<tr key={session.id} className="hover:bg-gray-50"><td className="td-style">{new Date(session.opened_at).toLocaleString()}</td><td className="td-style">{session.closed_at ? new Date(session.closed_at).toLocaleString() : '---'}</td><td className="td-style text-right">R$ {session.opening_balance.toFixed(2)}</td><td className="td-style text-right text-green-600">R$ {session.calculated_sales?.toFixed(2) || '0.00'}</td><td className="td-style text-right text-indigo-600">R$ {session.expected_in_cash?.toFixed(2) || '0.00'}</td><td className="td-style text-right">R$ {session.closing_balance_informed?.toFixed(2) || '---'}</td><td className={`td-style text-right font-semibold ${session.difference === 0 ? 'text-green-700' : session.difference && session.difference > 0 ? 'text-blue-700' : session.difference && session.difference < 0 ? 'text-red-700' : ''}`}>{session.difference?.toFixed(2) || '---'}{session.difference !== undefined && session.difference !== 0 && (<span className="ml-1 text-xs">({session.difference > 0 ? "Sobra" : "Falta"})</span>)}</td><td className="td-style"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${session.status === CashRegisterSessionStatus.OPEN ? 'bg-green-500' : 'bg-gray-500'}`}>{session.status === CashRegisterSessionStatus.OPEN ? 'Aberto' : 'Fechado'}</span></td></tr>)) : (<tr><td colSpan={8} className="px-4 py-3 text-center text-gray-500 italic">Nenhuma sessão de caixa registrada.</td></tr>)}</tbody></table></div>
      </section>
      
      {orders.length === 0 && cashSessions.length === 0 && !activeCashSession && !reportData && ( <div className="text-center py-10 bg-white rounded-lg shadow mt-6"> <img src="https://picsum.photos/seed/empty-financials/150/150" alt="Sem dados financeiros" className="mx-auto mb-4 rounded-lg opacity-70" /> <p className="text-gray-500 text-xl">Nenhum dado financeiro ou de caixa disponível.</p> <p className="text-gray-400 mt-2">Abra um caixa e registre pedidos para ver os dados aqui.</p> </div> )}
      <style>{`
        .input-style { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); font-size: 0.875rem; }
        .btn-primary { background-color: #F97316; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 600; transition: background-color 0.15s ease-in-out; } .btn-primary:hover { background-color: #EA580C; }
        .btn-secondary { background-color: #E5E7EB; color: #374151; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 600; transition: background-color 0.15s ease-in-out; border: 1px solid #D1D5DB } .btn-secondary:hover { background-color: #D1D5DB; }
        .btn-outline-secondary { background-color: transparent; color: #4B5563; padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-weight: 500; transition: background-color 0.15s ease-in-out; border: 1px solid #D1D5DB } .btn-outline-secondary:hover { background-color: #F3F4F6; }
        .btn-danger { background-color: #EF4444; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 600; transition: background-color 0.15s ease-in-out; } .btn-danger:hover { background-color: #DC2626; }
        .btn-success { background-color: #22C55E; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 600; transition: background-color 0.15s ease-in-out; } .btn-success:hover { background-color: #16A34A; }
        .btn-info { background-color: #3B82F6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 600; transition: background-color 0.15s ease-in-out; } .btn-info:hover { background-color: #2563EB; }
        .stat-box { background-color: #F9FAFB; padding: 1rem; border-radius: 0.5rem; border: 1px solid #E5E7EB; }
        .stat-value { font-size: 1.5rem; font-weight: 600; margin-top: 0.25rem; }
        .th-style { padding: 0.5rem 1rem; text-align: left; font-weight: 500; color: #6B7280; text-transform: uppercase; font-size: 0.75rem; }
        .td-style { padding: 0.5rem 1rem; white-space: nowrap; }
        .report-table-section { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
        .report-table-title { font-size: 1.125rem; font-weight: 600; color: #374151; margin-bottom: 0.75rem; }
        .report-table { min-width: 100%; font-size: 0.875rem; }
        .report-table th { background-color: #f9fafb; padding: 0.5rem 0.75rem; text-align: left; font-weight: 500; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
        .report-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f3f4f6; }
        .report-table tbody tr:last-child td { border-bottom: none; }
        .report-table tbody tr:hover { background-color: #f9fafb; }
      `}</style>
    </div>
  );
};

export default FinancialsPage;
