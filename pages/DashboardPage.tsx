
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ClockIcon, ShoppingCartIcon, CurrencyDollarIcon, BookOpenIcon, ChartBarIcon, FireIcon, IconProps } from '@/components/icons'; 
import { OrderStatus, Order } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<IconProps>; // Use specific IconProps type
  colorClass: string;
  subValue?: string;
  subValueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, subValue, subValueColor = 'text-white opacity-80' }) => (
  <div className={`bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4`}>
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-20`}>
      {React.cloneElement(icon, { // Removed 'as React.ReactElement' cast
        className: `w-7 h-7 ${colorClass.replace('bg-', 'text-').replace('-500', '-600')}` 
      })}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
      {subValue && <p className={`text-xs ${subValueColor}`}>{subValue}</p>}
    </div>
  </div>
);


const DashboardPage: React.FC = () => {
  const { orders, menuItems, categories } = useAppContext();

  console.log(`[DashboardPage] Initial data - Orders: ${orders.length}, MenuItems: ${menuItems.length}, Categories: ${categories.length}`);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Orders placed today
  const ordersToday = orders.filter(o => {
    const orderDate = new Date(o.order_time);
    return orderDate >= startOfToday && orderDate <= endOfToday;
  });

  // Pending orders from today
  const pendingOrdersTodayList = ordersToday.filter(o => o.status === OrderStatus.PENDING);
  const pendingOrdersTodayCount = pendingOrdersTodayList.length;
  const totalValuePendingOrdersToday = pendingOrdersTodayList.reduce((sum, o) => sum + o.total_amount, 0);

  // Delivered orders from today for revenue
  const deliveredTodayOrders = ordersToday.filter(o => o.status === OrderStatus.DELIVERED);
  const totalRevenueToday = deliveredTodayOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const paidOrdersTodayCount = deliveredTodayOrders.length;

  // Active menu items and categories
  const activeMenuItemsCount = menuItems.filter(item => item.available).length;
  const totalCategoriesCount = categories.length;

  // Total orders today (any status)
  const totalOrdersTodayCount = ordersToday.length;
  const inProgressOrdersTodayCount = ordersToday.filter(o => 
    o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED
  ).length;

  // Average Order Value Today
  const averageOrderValueToday = paidOrdersTodayCount > 0 ? totalRevenueToday / paidOrdersTodayCount : 0;

  // Orders in Preparation Today
  const ordersPreparingTodayCount = ordersToday.filter(o => o.status === OrderStatus.PREPARING).length;
  
  // Most recent 5 orders for the "Últimos Pedidos" list (regardless of date)
  const recentOrders = [...orders].sort((a,b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()).slice(0,5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-y-3">
        <h1 className="text-3xl font-semibold text-gray-800">Painel Principal</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Pendentes Hoje" 
          value={pendingOrdersTodayCount} 
          icon={<ClockIcon />} 
          colorClass="bg-yellow-500"
          subValue={`Valor: R$ ${totalValuePendingOrdersToday.toFixed(2)}`}
          subValueColor="text-yellow-700"
        />
        <StatCard 
          title="Receita de Hoje" 
          value={`R$ ${totalRevenueToday.toFixed(2)}`}
          icon={<CurrencyDollarIcon />} 
          colorClass="bg-green-500"
          subValue={`${paidOrdersTodayCount} pedidos pagos`}
          subValueColor="text-green-700"
        />
        <StatCard 
          title="Pedidos de Hoje" 
          value={totalOrdersTodayCount}
          icon={<ShoppingCartIcon />}
          colorClass="bg-purple-500"
          subValue={`${inProgressOrdersTodayCount} em andamento`}
          subValueColor="text-purple-700"
        />
        <StatCard
          title="Ticket Médio Hoje"
          value={`R$ ${averageOrderValueToday.toFixed(2)}`}
          icon={<ChartBarIcon />}
          colorClass="bg-indigo-500"
          subValue="Baseado em pedidos pagos"
          subValueColor="text-indigo-700"
        />
        <StatCard
          title="Em Preparo Hoje"
          value={ordersPreparingTodayCount}
          icon={<FireIcon />}
          colorClass="bg-orange-500"
          subValueColor="text-orange-700"
        />
        <StatCard 
          title="Itens Ativos no Cardápio" 
          value={activeMenuItemsCount}
          icon={<BookOpenIcon />} 
          colorClass="bg-blue-500"
          subValue={`${totalCategoriesCount} categorias`}
          subValueColor="text-blue-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Últimos Pedidos Recebidos</h2>
          {recentOrders.length > 0 ? recentOrders.map(order => (
            <div key={order.id} className="border-b last:border-b-0 py-3">
              <div className="flex justify-between items-center">
                <div>
                    <p className="text-gray-800 font-medium">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">Pedido #{order.id.substring(0,6)} - {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                    <span className={`px-2.5 py-1 text-xs font-semibold text-white rounded-full ${
                        order.status === OrderStatus.PENDING ? 'bg-yellow-400' :
                        order.status === OrderStatus.PREPARING ? 'bg-blue-400' :
                        order.status === OrderStatus.READY_FOR_PICKUP ? 'bg-purple-400' :
                        order.status === OrderStatus.OUT_FOR_DELIVERY ? 'bg-teal-400' :
                        order.status === OrderStatus.DELIVERED ? 'bg-green-400' : 'bg-red-400' // Assuming Cancelled for other
                    }`}>{order.status}</span>
                    <p className="text-sm text-gray-700 font-semibold mt-0.5">R$ {order.total_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )) : <p className="text-gray-500 italic">Nenhum pedido recente.</p>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Visão Geral do Cardápio</h2>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600 flex justify-between">Total de Categorias: <span className="font-semibold text-gray-800">{totalCategoriesCount}</span></p>
            <p className="text-gray-600 flex justify-between">Total de Itens no Cardápio: <span className="font-semibold text-gray-800">{menuItems.length}</span></p>
            <p className="text-gray-600 flex justify-between">Itens Indisponíveis: <span className="font-semibold text-red-500">{menuItems.filter(item => !item.available).length}</span></p>
          </div>
          <div className="mt-4 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
            <ChartBarIcon className="w-16 h-16 text-gray-300"/>
            <p className="text-gray-400 ml-2">Mais estatísticas em breve</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg text-center">
        <img src="https://picsum.photos/seed/welcome-dash/200/150" alt="Bem-vindo" className="mx-auto mb-4 rounded-lg opacity-80"/>
        <p className="text-xl text-gray-700">Bem-vindo ao Painel Administrativo JáPede!</p>
        <p className="text-gray-500 mt-1">Utilize a barra lateral para navegar e gerenciar seu estabelecimento.</p>
      </div>
    </div>
  );
};

export default DashboardPage;