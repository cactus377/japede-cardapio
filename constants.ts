import React from 'react';
// FIX: Aliasing OrderStatus to AppOrderStatus to resolve import conflicts and ensure correct type usage.
// This addresses errors like "Import declaration conflicts with local declaration" and "used before declaration".
import { OrderStatus as AppOrderStatus, OrderType, PaymentMethod } from './types';
import { ClockIcon, TruckIcon, CheckCircleIcon, BanIcon, FireIcon } from './components/icons';


// This model name might be used by the backend when it calls the Gemini API.
export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17'; 
// This endpoint assumes your custom backend will have a route to proxy requests to the Gemini API.
export const GEMINI_API_ENDPOINT = '/api/generate-description'; 

export const DEFAULT_PIZZA_IMAGE = 'https://picsum.photos/seed/pizza-default/400/250';


// Client-side ID generation, e.g. for cart items before they become order items
export const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

// Defines the sequence of automatic progression
// FIX: Using aliased AppOrderStatus.
export const ORDER_PROGRESSION_SEQUENCE: Partial<Record<AppOrderStatus, AppOrderStatus>> = {
  [AppOrderStatus.PENDING]: AppOrderStatus.PREPARING,
  [AppOrderStatus.PREPARING]: AppOrderStatus.READY_FOR_PICKUP,
  [AppOrderStatus.READY_FOR_PICKUP]: AppOrderStatus.OUT_FOR_DELIVERY, // Or DELIVERED if it's not for delivery
  [AppOrderStatus.OUT_FOR_DELIVERY]: AppOrderStatus.DELIVERED,
};

export const AUTO_PROGRESS_INTERVAL = 5000; // Check every 5 seconds (client-side UI update interval)

// For form options
export const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: OrderType.MESA, label: 'Mesa' },
  { value: OrderType.DELIVERY, label: 'Delivery' },
  { value: OrderType.BALCAO, label: 'Balcão/Retirada' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.DINHEIRO, label: 'Dinheiro' },
  { value: PaymentMethod.CARTAO_DEBITO, label: 'Cartão de Débito' },
  { value: PaymentMethod.CARTAO_CREDITO, label: 'Cartão de Crédito' },
  { value: PaymentMethod.PIX, label: 'PIX' },
  { value: PaymentMethod.MULTIPLO, label: 'Múltiplos/Dividido' },
];

// For OrderDashboardPage column headers
// FIX: Using aliased AppOrderStatus and React.createElement for JSX to make it valid in a .ts file.
// Ensured all enum members are covered.
export const ORDER_STATUS_ICONS: Record<AppOrderStatus, React.ReactNode> = {
    [AppOrderStatus.PENDING]: React.createElement(ClockIcon, { className: "w-5 h-5 mr-2 text-yellow-600" }),
    [AppOrderStatus.PREPARING]: React.createElement(FireIcon, { className: "w-5 h-5 mr-2 text-blue-600" }),
    [AppOrderStatus.READY_FOR_PICKUP]: React.createElement(TruckIcon, { className: "w-5 h-5 mr-2 text-purple-600" }),
    [AppOrderStatus.OUT_FOR_DELIVERY]: React.createElement(TruckIcon, { className: "w-5 h-5 mr-2 text-teal-600" }),
    [AppOrderStatus.DELIVERED]: React.createElement(CheckCircleIcon, { className: "w-5 h-5 mr-2 text-green-600" }),
    [AppOrderStatus.CANCELLED]: React.createElement(BanIcon, { className: "w-5 h-5 mr-2 text-red-600" }),
};

// FIX: Using aliased AppOrderStatus.
export const ORDER_STATUS_COLUMN_TITLES: Record<AppOrderStatus, string> = {
    [AppOrderStatus.PENDING]: 'Pendentes',
    [AppOrderStatus.PREPARING]: 'Em Preparo',
    [AppOrderStatus.READY_FOR_PICKUP]: 'Prontos para Retirada',
    [AppOrderStatus.OUT_FOR_DELIVERY]: 'Em Entrega',
    [AppOrderStatus.DELIVERED]: 'Entregues',
    [AppOrderStatus.CANCELLED]: 'Cancelados',
};
