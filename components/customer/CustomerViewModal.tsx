import React from 'react';
import { Profile } from '../../types';
import Modal from '@/shared/Modal';
import { UserCircleIcon, PhoneIcon, MailIcon, CalendarIcon, ShoppingCartIcon, CurrencyDollarIcon, LocationMarkerIcon, AnnotationIcon } from '../icons';

interface CustomerViewModalProps {
  customer: Profile | null;
  onClose: () => void;
}

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null | Date }> = ({ icon, label, value }) => {
  if (value === null || value === undefined || value === '') return null;

  let processedValue: string | number;

  if (value instanceof Date) {
    processedValue = value.toLocaleDateString('pt-BR');
  } else if (typeof value === 'number') {
    // Assuming only 'totalSpent' needs R$ formatting for now among numeric values
    if (label.toLowerCase().includes('gasto') || label.toLowerCase().includes('total spent')) {
      processedValue = `R$ ${value.toFixed(2)}`;
    } else {
      processedValue = value;
    }
  } else {
    processedValue = String(value); // Ensure it's a string if not Date or Number
  }

  return (
    <div className="flex items-start space-x-2 py-1.5">
      <span className="text-primary flex-shrink-0 w-5 h-5 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{processedValue}</p>
      </div>
    </div>
  );
};

const CustomerViewModal: React.FC<CustomerViewModalProps> = ({ customer, onClose }) => {
  if (!customer) return null;

  // Casting to 'any' for derived fields that are not on Profile type directly
  const customerAsAny = customer as any;

  return (
    <Modal title={`Detalhes de ${customer.full_name || 'Cliente'}`} onClose={onClose}>
      <div className="space-y-3 p-2">
        <DetailItem icon={<UserCircleIcon />} label="Nome Completo" value={customer.full_name} />
        <DetailItem icon={<PhoneIcon />} label="Telefone" value={customer.phone} />
        {customer.email && <DetailItem icon={<MailIcon />} label="Email" value={customer.email} />}
        {customer.default_address && <DetailItem icon={<LocationMarkerIcon />} label="Endereço Principal" value={customer.default_address} />}
        {customer.default_address_reference && <DetailItem icon={<LocationMarkerIcon className="opacity-70" />} label="Referência Endereço" value={customer.default_address_reference} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t mt-2">
          <DetailItem icon={<CalendarIcon />} label="Último Pedido" value={customerAsAny.lastOrderDate} />
          <DetailItem icon={<ShoppingCartIcon />} label="Total de Pedidos" value={customerAsAny.totalOrders} />
          <DetailItem icon={<CurrencyDollarIcon />} label="Total Gasto" value={customerAsAny.totalSpent} />
          {customer.created_at && <DetailItem icon={<CalendarIcon className="opacity-70" />} label="Cliente Desde" value={new Date(customer.created_at)} />}
        </div>
        {customer.notes && <DetailItem icon={<AnnotationIcon />} label="Observações do Cliente" value={customer.notes} />}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerViewModal;
