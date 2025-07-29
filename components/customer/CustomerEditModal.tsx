import React, { useState, useEffect } from 'react';
import { Profile, CustomerFormValues } from '../../types';
import Modal from '@/shared/Modal';
import { UserCircleIcon, PhoneIcon, MailIcon, LocationMarkerIcon, AnnotationIcon } from '../icons';
import { useAppContext } from '@/contexts/AppContext';

interface CustomerEditModalProps {
  initialCustomer: Profile | null;
  onSave: (customerData: CustomerFormValues, id?: string) => void;
  onClose: () => void;
}

const CustomerEditModal: React.FC<CustomerEditModalProps> = ({ initialCustomer, onSave, onClose }) => {
  const { setAlert } = useAppContext();
  const [formData, setFormData] = useState<CustomerFormValues>({
    name: '',
    phone: '',
    email: '',
    address: '',
    addressReference: '',
    notes: '',
  });

  useEffect(() => {
    if (initialCustomer) {
      setFormData({
        name: initialCustomer.full_name || '',
        phone: initialCustomer.phone || '',
        email: initialCustomer.email || '',
        address: initialCustomer.default_address || '',
        addressReference: initialCustomer.default_address_reference || '',
        notes: initialCustomer.notes || '',
      });
    } else {
      setFormData({ name: '', phone: '', email: '', address: '', addressReference: '', notes: '' });
    }
  }, [initialCustomer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setAlert({ message: 'Nome e telefone são obrigatórios.', type: 'error' });
      return;
    }
    const phoneTrimmed = formData.phone.trim();
    if (phoneTrimmed && !/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(phoneTrimmed)) {
      setAlert({ message: 'Telefone inválido. Use formato (XX) XXXXX-XXXX ou similar.', type: 'error' });
      return;
    }
    const emailTrimmed = formData.email?.trim();
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setAlert({ message: 'Email inválido.', type: 'error' });
      return;
    }
    onSave(formData, initialCustomer?.id);
  };

  return (
    <Modal title={initialCustomer ? `Editar Cliente: ${initialCustomer.full_name}` : 'Adicionar Novo Cliente (Perfil)'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 flex items-center">
            <UserCircleIcon className="w-4 h-4 mr-1 text-gray-500" />Nome Completo*
          </label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 input-style w-full" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 flex items-center">
            <PhoneIcon className="w-4 h-4 mr-1 text-gray-500" />Telefone*
          </label>
          <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 input-style w-full" placeholder="(XX) XXXXX-XXXX" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center">
            <MailIcon className="w-4 h-4 mr-1 text-gray-500" />Email
          </label>
          <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="mt-1 input-style w-full" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 flex items-center">
            <LocationMarkerIcon className="w-4 h-4 mr-1 text-gray-500" />Endereço Principal
          </label>
          <input type="text" name="address" id="address" value={formData.address || ''} onChange={handleChange} className="mt-1 input-style w-full" />
        </div>
        <div>
          <label htmlFor="addressReference" className="block text-sm font-medium text-gray-700 flex items-center">
            <LocationMarkerIcon className="w-4 h-4 mr-1 text-gray-400 opacity-70" />Referência do Endereço
          </label>
          <input type="text" name="addressReference" id="addressReference" value={formData.addressReference || ''} onChange={handleChange} className="mt-1 input-style w-full" />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 flex items-center">
            <AnnotationIcon className="w-4 h-4 mr-1 text-gray-500" />Observações sobre o Cliente
          </label>
          <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className="mt-1 input-style w-full" />
        </div>
        <div className="flex justify-end space-x-3 pt-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm">
            {initialCustomer ? 'Salvar Alterações' : 'Adicionar Cliente'}
          </button>
        </div>
      </form>
      <style>{`
        .input-style {
          padding: 0.5rem 0.75rem;
          border: 1px solid #D1D5DB;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          font-size: 0.875rem;
        }
        .input-style:focus {
          outline: none;
          border-color: #F97316;
          box-shadow: 0 0 0 0.2rem rgba(249, 115, 22, 0.25);
        }
      `}</style>
    </Modal>
  );
};

export default CustomerEditModal;
