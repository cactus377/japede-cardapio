
import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Modal from '@/shared/Modal';
import LoadingSpinner from '@/shared/LoadingSpinner';

interface RegisterFormProps {
  onClose: () => void;
  onSuccess: () => void; // Callback for successful registration
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onClose, onSuccess, onSwitchToLogin }) => {
  const { signUp, setAlert, authLoading } = useAppContext();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setAlert({ message: 'Todos os campos são obrigatórios.', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setAlert({ message: 'As senhas não coincidem.', type: 'error' });
      return;
    }
    // Basic phone validation (optional, can be enhanced)
    // Allow empty phone, but if provided, validate it.
    const phoneTrimmed = phone.trim();
    if (phoneTrimmed && !/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(phoneTrimmed)) {
        setAlert({message: "Telefone inválido. Use formato (XX) XXXXX-XXXX.", type: "error"});
        return;
    }

    const user = await signUp(email, password, fullName, phoneTrimmed ? phoneTrimmed : undefined);
    if (user) {
      onSuccess(); // Call success callback
    }
    // Errors are handled by setAlert within signUp
  };

  return (
    <Modal title="Criar Nova Conta" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="registerFullName" className="block text-sm font-medium text-gray-700">Nome Completo</label>
          <input
            type="text"
            id="registerFullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="registerPhone" className="block text-sm font-medium text-gray-700">Telefone (Opcional)</label>
          <input
            type="tel"
            id="registerPhone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(XX) XXXXX-XXXX"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            autoComplete="tel"
          />
        </div>
        <div>
          <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="registerEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-700">Senha</label>
          <input
            type="password"
            id="registerPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="registerConfirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
          <input
            type="password"
            id="registerConfirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            Já tem conta? Faça login
          </button>
          <button
            type="submit"
            disabled={authLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-50 flex items-center"
          >
            {authLoading && <LoadingSpinner size="w-4 h-4 mr-2" color="text-white" />}
            Cadastrar
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RegisterForm;
