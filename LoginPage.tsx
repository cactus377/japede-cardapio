
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@contexts/AppContext';
import LoadingSpinner from '@components/shared/LoadingSpinner';
import { KeyIcon, MailIcon, StorefrontIcon, GoogleIcon as GoogleIconSvg } from '@components/icons'; 
import ForgotPasswordModal from '@components/auth/ForgotPasswordModal';
// AdminRegisterModal import removed as it's no longer triggered from here for profiles.length === 0
import SuperAdminCreationModal from '@components/auth/SuperAdminCreationModal'; // New modal

const LoginPage: React.FC = () => {
  const { 
    signIn, 
    signInWithGoogle, 
    authLoading, 
    settings, 
    setAlert,
    profiles, 
    isLoadingProfiles, 
  } = useAppContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isSuperAdminCreationModalOpen, setIsSuperAdminCreationModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoadingProfiles) {
      if (profiles.length === 0) {
        console.log('[LoginPage] No profiles found, opening Super Admin Creation Modal.');
        setIsSuperAdminCreationModalOpen(true);
      } else {
        setIsSuperAdminCreationModalOpen(false);
      }
    }
  }, [profiles, isLoadingProfiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profiles.length === 0 && !isLoadingProfiles) {
        setAlert({ message: 'Nenhum administrador cadastrado. Crie o super administrador primeiro.', type: 'error'});
        setIsSuperAdminCreationModalOpen(true);
        return;
    }
    if (!email.trim() || !password.trim()) {
      setAlert({ message: 'Email e senha são obrigatórios.', type: 'error' });
      return;
    }
    await signIn(email, password); 
  };

  const handleGoogleSignIn = async () => {
    if (profiles.length === 0 && !isLoadingProfiles) {
        setAlert({ message: 'Nenhum administrador cadastrado. Crie o super administrador primeiro.', type: 'error'});
        setIsSuperAdminCreationModalOpen(true);
        return;
    }
    await signInWithGoogle(); 
  };
  
  const storeLogoUrl = settings?.store?.logo_url || 'https://picsum.photos/seed/login_logo/80/80';
  const storeName = settings?.store?.store_name || 'JáPede Admin';

  // If loading profiles and it's not certain if a super admin needs to be created, show a global loader.
  if (isLoadingProfiles && !isSuperAdminCreationModalOpen && profiles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <LoadingSpinner size="w-16 h-16" color="text-primary" />
        <p className="mt-4 text-lg text-gray-600">Verificando configuração inicial...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <img 
              src={storeLogoUrl} 
              alt="Logo da Loja" 
              className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-primary-light object-cover"
              onError={(e) => { 
                (e.currentTarget as HTMLImageElement).src = 'https://picsum.photos/seed/login_logo_fallback/80/80'; 
                (e.currentTarget as HTMLImageElement).alt = 'Logo Padrão';
              }}
            />
            <h1 className="text-3xl font-bold text-gray-800">
              {storeName}
            </h1>
            <p className="text-gray-500">Acesse o painel de controle</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 sr-only">Email</label>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MailIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu email"
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  required
                  autoComplete="email"
                  />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 sr-only">Senha</label>
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  required
                  autoComplete="current-password"
                  />
              </div>
            </div>

            <div className="flex items-center justify-end text-sm"> 
              <button
                type="button"
                onClick={() => setIsForgotPasswordModalOpen(true)}
                className="font-medium text-primary hover:text-primary-dark"
              >
                Esqueceu sua senha?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={authLoading || (isLoadingProfiles && profiles.length === 0)}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-70"
              >
                {authLoading && (email || password) ? ( 
                    <LoadingSpinner size="w-5 h-5 mr-2" color="text-white" />
                ) : null}
                Entrar
              </button>
            </div>
          </form>
          
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continue com</span>
            </div>
          </div>

          <div>
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading || (isLoadingProfiles && profiles.length === 0)}
                className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-70"
            >
               {authLoading ? <LoadingSpinner size="w-5 h-5 mr-2" /> : <GoogleIconSvg className="w-5 h-5 mr-2" />}
                Entrar com Google
            </button>
          </div>

        </div>
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} JáPede. Todos os direitos reservados.</p>
        </footer>
      </div>

      {isForgotPasswordModalOpen && (
        <ForgotPasswordModal onClose={() => setIsForgotPasswordModalOpen(false)} />
      )}
      {isSuperAdminCreationModalOpen && (
        <SuperAdminCreationModal
            onClose={() => {
                setIsSuperAdminCreationModalOpen(false);
                // Re-check after close. If still no profiles, system is unusable.
                if (profiles.length === 0) {
                     setAlert({ message: "É necessário criar um super administrador para usar o sistema. Atualize a página se o modal não reabrir.", type: "error"});
                }
            }}
            onSuccess={() => {
                setIsSuperAdminCreationModalOpen(false);
                // `signIn` (called by `signUp` if successful) will update currentUser and trigger redirect in App.tsx
            }}
        />
      )}
    </>
  );
};

export default LoginPage;
