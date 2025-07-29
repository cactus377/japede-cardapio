
import React, { useState } from 'react';
import { useAppContext } from '@contexts/AppContext';
import Modal from '@components/shared/Modal';
import LoadingSpinner from '@components/shared/LoadingSpinner';
import { MailIcon } from '@components/icons';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const { requestPasswordReset, authLoading, setAlert } = useAppContext();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setAlert({ message: 'Por favor, insira seu email.', type: 'error' });
      return;
    }
    const success = await requestPasswordReset(email); // Calls custom backend
    if (success) {
      // Alert is handled by requestPasswordReset within AppContext
      onClose(); 
    }
  };

  return (
    <Modal title="Recuperar Senha" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Digite seu email e enviaremos um link para você redefinir sua senha.
        </p>
        <div>
          <label htmlFor="forgotPasswordEmail" className="block text-sm font-medium text-gray-700 sr-only">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MailIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="email"
                id="forgotPasswordEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="seu.email@exemplo.com"
                required
                autoComplete="email"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={authLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm flex items-center disabled:opacity-70"
          >
            {authLoading && <LoadingSpinner size="w-4 h-4 mr-2" color="text-white" />}
            Enviar Link de Recuperação
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ForgotPasswordModal;
