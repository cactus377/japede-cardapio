
import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Modal from '@/shared/Modal';
import LoadingSpinner from '@/shared/LoadingSpinner';

interface LoginFormProps {
  onClose: () => void;
  onSuccess: () => void; // Callback for successful login
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose, onSuccess, onSwitchToRegister }) => {
  const { signIn, setAlert, authLoading } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAlert({ message: 'Email e senha são obrigatórios.', type: 'error' });
      return;
    }
    const user = await signIn(email, password);
    if (user) {
      onSuccess(); // Call success callback which might close modal or navigate
    }
    // Errors are handled by setAlert within signIn
  };

  return (
    <Modal title="Entrar na sua Conta" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="loginEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700">Senha</label>
          <input
            type="password"
            id="loginPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            Não tem conta? Cadastre-se
          </button>
          <button
            type="submit"
            disabled={authLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-50 flex items-center"
          >
            {authLoading && <LoadingSpinner size="w-4 h-4 mr-2" color="text-white" />}
            Entrar
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LoginForm;
