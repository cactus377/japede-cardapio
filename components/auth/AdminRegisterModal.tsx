
import React, { useState } from 'react';
import { useAppContext } from '@contexts/AppContext';
import Modal from '@components/shared/Modal';
import LoadingSpinner from '@components/shared/LoadingSpinner';
import { UserCircleIcon, MailIcon, KeyIcon, PhoneIcon } from '@components/icons'; // Added PhoneIcon

interface AdminRegisterModalProps {
  onClose: () => void;
  // onSuccess could be added if needed for specific post-registration actions
}

const AdminRegisterModal: React.FC<AdminRegisterModalProps> = ({ onClose }) => {
  const { signUp, authLoading, setAlert } = useAppContext();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Added phone state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setAlert({ message: 'Nome, email e campos de senha são obrigatórios.', type: 'error' });
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
     if (phone.trim() && !/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(phone)) {
        setAlert({message: "Telefone inválido. Use formato (XX) XXXXX-XXXX.", type: "error"});
        return;
    }

    // Pass phone to signUp if provided
    const user = await signUp(email, password, fullName, phone.trim() ? phone : undefined); 
    if (user) {
      setAlert({ message: 'Cadastro de administrador realizado! Faça login para continuar.', type: 'success'});
      onClose();
    }
    // Error alerts are handled by signUp
  };

  return (
    <Modal title="Cadastrar Novo Administrador (Genérico)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="adminFullName" className="block text-sm font-medium text-gray-700 sr-only">Nome Completo</label>
           <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text" id="adminFullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome completo"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required autoComplete="name"
                />
           </div>
        </div>
        <div>
          <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 sr-only">Email</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailIcon className="h-5 w-5 text-gray-400" />
                </div>
                 <input
                    type="email" id="adminEmail" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email de acesso"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required autoComplete="email"
                />
            </div>
        </div>
         <div>
          <label htmlFor="adminPhone" className="block text-sm font-medium text-gray-700 sr-only">Telefone (Opcional)</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                 <input
                    type="tel" id="adminPhone" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="Telefone (opcional)"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    autoComplete="tel"
                />
            </div>
        </div>
        <div>
          <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 sr-only">Senha</label>
           <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password" id="adminPassword" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha (mín. 6 caracteres)"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required minLength={6} autoComplete="new-password"
                />
           </div>
        </div>
        <div>
          <label htmlFor="adminConfirmPassword" className="block text-sm font-medium text-gray-700 sr-only">Confirmar Senha</label>
           <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password" id="adminConfirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua senha"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required minLength={6} autoComplete="new-password"
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
            Cadastrar Administrador
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminRegisterModal;
