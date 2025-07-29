
import React, { useState } from 'react';
import { useAppContext } from '@contexts/AppContext';
import Modal from '@components/shared/Modal';
import LoadingSpinner from '@components/shared/LoadingSpinner';
import { UserCircleIcon, MailIcon, KeyIcon } from '@components/icons';

interface SuperAdminCreationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SuperAdminCreationModal: React.FC<SuperAdminCreationModalProps> = ({ onClose, onSuccess }) => {
  const { signUp, authLoading, setAlert } = useAppContext();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setAlert({ message: 'Todos os campos são obrigatórios.', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setAlert({ message: 'As senhas não coincidem.', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setAlert({ message: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    // The signUp function in AppContext will call the backend.
    // The backend should be designed to make the very first registered user an admin.
    const user = await signUp(email, password, fullName); 
    if (user) {
      // The user is logged in automatically by signUp.
      setAlert({ message: 'Super Administrador criado com sucesso! Redirecionando para o painel...', type: 'success'});
      onSuccess(); // Trigger success callback (e.g., to close modal and allow redirect)
    }
    // Error alerts are handled by signUp in AppContext
  };

  return (
    <Modal title="Criar Super Administrador Inicial" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Bem-vindo! Como este é o primeiro acesso, por favor, crie uma conta de Super Administrador para gerenciar o sistema.
        </p>
        <div>
          <label htmlFor="superAdminFullName" className="block text-sm font-medium text-gray-700 sr-only">Nome Completo</label>
           <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text" id="superAdminFullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required autoComplete="name" autoFocus
                />
           </div>
        </div>
        <div>
          <label htmlFor="superAdminEmail" className="block text-sm font-medium text-gray-700 sr-only">Email</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailIcon className="h-5 w-5 text-gray-400" />
                </div>
                 <input
                    type="email" id="superAdminEmail" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu email de acesso"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required autoComplete="email"
                />
            </div>
        </div>
        <div>
          <label htmlFor="superAdminPassword" className="block text-sm font-medium text-gray-700 sr-only">Senha</label>
           <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password" id="superAdminPassword" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Crie uma senha (mín. 6 caracteres)"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required minLength={6} autoComplete="new-password"
                />
           </div>
        </div>
        <div>
          <label htmlFor="superAdminConfirmPassword" className="block text-sm font-medium text-gray-700 sr-only">Confirmar Senha</label>
           <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password" id="superAdminConfirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua senha"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required minLength={6} autoComplete="new-password"
                />
           </div>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          {/* No cancel button as this is a mandatory step */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm flex items-center justify-center disabled:opacity-70"
          >
            {authLoading && <LoadingSpinner size="w-4 h-4 mr-2" color="text-white" />}
            Criar Super Administrador
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SuperAdminCreationModal;
