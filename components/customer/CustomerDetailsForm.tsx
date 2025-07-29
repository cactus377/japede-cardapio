import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { CustomerDetails } from '../../types';
import Modal from '@/shared/Modal';

interface CustomerDetailsFormProps {
  onClose: () => void;
  onSubmit: () => void;
}

const CustomerDetailsForm: React.FC<CustomerDetailsFormProps> = ({ onClose, onSubmit }) => {
  const {
    customerDetails: initialCustomerDetails,
    setCustomerDetails,
    cart,
    setAlert,
  } = useAppContext();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressReference, setAddressReference] = useState('');
  const [notes, setNotes] = useState('');

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (initialCustomerDetails) {
      console.log("[CustomerDetailsForm] Using initialCustomerDetails (transient) for prefill:", initialCustomerDetails);
      setName(initialCustomerDetails.name);
      setPhone(initialCustomerDetails.phone);
      setAddress(initialCustomerDetails.address);
      setAddressReference(initialCustomerDetails.addressReference || '');
      setNotes(initialCustomerDetails.notes || '');
    } else {
      console.log("[CustomerDetailsForm] No prefill data found. Starting with empty fields.");
      setName('');
      setPhone('');
      setAddress('');
      setAddressReference('');
      setNotes('');
    }
  }, [initialCustomerDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setAlert({ message: 'Por favor, preencha seu nome, telefone e endereço.', type: 'error' });
      return;
    }

    const phonePatternString = "^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$";
    const phoneRegex = new RegExp(phonePatternString);

    if (!phoneRegex.test(phone)) {
      setAlert({ message: 'Por favor, insira um telefone válido (ex: (XX) XXXXX-XXXX).', type: 'error' });
      return;
    }

    const currentDetails: CustomerDetails = { name, phone, address, addressReference, notes };
    setCustomerDetails(currentDetails);

    onSubmit();
  };

  return (
    <Modal title="Detalhes para Entrega e Contato" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Nome Completo*</label>
          <input
            type="text"
            id="customerName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">Telefone (WhatsApp)*</label>
          <input
            type="tel"
            id="customerPhone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(XX) XXXXX-XXXX"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700">Endereço Completo (Rua, N°, Bairro)*</label>
          <textarea
            id="customerAddress"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="customerAddressReference" className="block text-sm font-medium text-gray-700">Ponto de Referência (opcional)</label>
          <input
            type="text"
            id="customerAddressReference"
            value={addressReference}
            onChange={(e) => setAddressReference(e.target.value)}
            placeholder="Ex: Próximo ao mercado X, casa azul"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="orderNotes" className="block text-sm font-medium text-gray-700">Observações para o pedido (opcional)</label>
          <textarea
            id="orderNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex: Sem cebola, troco para R$50, etc."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Resumo do Pedido</h3>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-gray-600">
              <span>{item.quantity}x {item.name}</span>
              <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          <div className="flex justify-between text-base font-bold text-gray-800 mt-2 pt-2 border-t">
            <span>Total do Pedido:</span>
            <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Taxa de entrega será confirmada pelo estabelecimento.</p>
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Voltar ao Carrinho
          </button>
          <button
            type="submit"
            className="px-6 py-3 text-base font-semibold text-white bg-green-500 hover:bg-green-600 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Confirmar e Enviar Pedido
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerDetailsForm;
