
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { KeyIcon, StorefrontIcon } from '@/components/icons';

const ResetPasswordPage: React.FC = () => {
  const { updateUserPassword, authLoading, setAlert, settings } = useAppContext();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract token from URL (e.g., /reset-password?token=XYZ)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      setError(null);
    } else {
      setError("Token de recuperação não encontrado na URL. O link pode estar inválido.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setAlert({ message: "Token de recuperação inválido ou ausente.", type: 'error'});
      return;
    }
    if (!newPassword || !confirmPassword) {
      setAlert({ message: 'Por favor, preencha ambos os campos de senha.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ message: 'As senhas não coincidem.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setAlert({ message: 'A nova senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    const success = await updateUserPassword(token, newPassword);
    if (success) {
      // Alert is handled by updateUserPassword. App.tsx might redirect on success.
      setNewPassword('');
      setConfirmPassword('');
      setError("Senha redefinida com sucesso! Você será redirecionado para o login em instantes.");
      // Consider redirecting after a delay
      setTimeout(() => {
        window.location.href = '/'; // Or your login page path
      }, 3000);
    }
  };
  
  const storeLogoUrl = settings?.store?.logo_url || 'https://picsum.photos/seed/reset_logo/80/80';
  const storeName = settings?.store?.store_name || 'JáPede';

  if (authLoading) { 
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <LoadingSpinner size="w-12 h-12" color="text-primary"/>
        <p className="mt-3 text-gray-600">Processando...</p>
      </div>
    );
  }

  if (error && !token) { 
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-100 text-center">
        <KeyIcon className="w-16 h-16 text-red-500 mb-4"/>
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Erro na Recuperação</h1>
        <p className="text-gray-600 mb-4">
          {error}
        </p>
        <a href="/" className="text-primary hover:text-primary-dark font-medium">
          Voltar para o Login
        </a>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
           <img 
              src={storeLogoUrl} 
              alt="Logo da Loja" 
              className="w-16 h-16 mx-auto mb-2 rounded-full border-2 border-primary-light object-cover"
            />
          <h1 className="text-2xl font-bold text-gray-800">Redefinir Senha</h1>
          <p className="text-gray-500">Crie uma nova senha para sua conta em {storeName}.</p>
        </div>

        {error && !token && <p className="text-red-500 text-sm text-center">{error}</p>}
        
        {token && (
            <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 sr-only">Nova Senha</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite sua nova senha"
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        required minLength={6} autoComplete="new-password"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 sr-only">Confirmar Nova Senha</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme sua nova senha"
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        required minLength={6} autoComplete="new-password"
                    />
                </div>
            </div>
            <div>
                <button
                type="submit"
                disabled={authLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-70"
                >
                {authLoading ? <LoadingSpinner size="w-5 h-5" /> : 'Salvar Nova Senha'}
                </button>
            </div>
            </form>
        )}
      </div>
       <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} JáPede. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default ResetPasswordPage;
