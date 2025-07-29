
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { KeyIcon, MailIcon, GoogleIcon as GoogleIconSvg } from '@/components/icons';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import SuperAdminCreationModal from '@/components/auth/SuperAdminCreationModal';

// --- Internal Components for Structure and Clarity ---

const LoginHeader: React.FC<{ logoUrl: string, storeName: string }> = ({ logoUrl, storeName }) => (
  <div className="text-center">
    <img 
      src={logoUrl} 
      alt="Logo da Loja" 
      className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-primary-light object-cover"
      onError={(e) => { 
        (e.currentTarget as HTMLImageElement).src = 'https://picsum.photos/seed/login_logo_fallback/80/80'; 
        (e.currentTarget as HTMLImageElement).alt = 'Logo Padrão';
      }}
    />
    <h1 className="text-3xl font-bold text-gray-800">{storeName}</h1>
    <p className="text-gray-500">Acesse o painel de controle</p>
  </div>
);

const AuthForm: React.FC<{
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  authLoading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
}> = ({ email, setEmail, password, setPassword, authLoading, handleSubmit, onForgotPassword }) => (
  <form onSubmit={handleSubmit} className="space-y-5">
    <div>
      <label htmlFor="email" className="sr-only">Email</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MailIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu email" className="input-style" required autoComplete="email" />
      </div>
    </div>
    <div>
      <label htmlFor="password" className="sr-only">Senha</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <KeyIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" className="input-style" required autoComplete="current-password" />
      </div>
    </div>
    <div className="flex items-center justify-end text-sm">
      <button type="button" onClick={onForgotPassword} className="font-medium text-primary hover:text-primary-dark">
        Esqueceu sua senha?
      </button>
    </div>
    <div>
      <button type="submit" disabled={authLoading} className="button-primary w-full">
        {authLoading && <LoadingSpinner size="w-5 h-5 mr-2" color="text-white" />}
        Entrar
      </button>
    </div>
  </form>
);

const SocialLogins: React.FC<{ onGoogleSignIn: () => void; authLoading: boolean, disabled: boolean }> = ({ onGoogleSignIn, authLoading, disabled }) => (
  <>
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
      <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Ou continue com</span></div>
    </div>
    <div>
      <button type="button" onClick={onGoogleSignIn} disabled={authLoading || disabled} className="button-secondary w-full">
        <GoogleIconSvg className="w-5 h-5 mr-2" />
        Entrar com Google
      </button>
    </div>
  </>
);

const InitializingView: React.FC = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <LoadingSpinner size="w-16 h-16" color="text-primary" />
        <p className="mt-4 text-lg text-gray-600">Verificando configuração inicial...</p>
    </div>
);

// --- Main LoginPage Component ---

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
  
  // This effect is crucial. It waits for the profile check to finish.
  // If it finishes and there are no profiles, it forces the admin creation.
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

  const beforeSubmitCheck = () => {
    if (profiles.length === 0 && !isLoadingProfiles) {
      setAlert({ message: 'Nenhum administrador cadastrado. Crie o super administrador primeiro.', type: 'error'});
      setIsSuperAdminCreationModalOpen(true);
      return false;
    }
    return true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beforeSubmitCheck()) return;
    if (!email.trim() || !password.trim()) {
      setAlert({ message: 'Email e senha são obrigatórios.', type: 'error' });
      return;
    }
    await signIn(email, password); 
  };

  const handleGoogleSignIn = async () => {
    if (!beforeSubmitCheck()) return;
    await signInWithGoogle(); 
  };
  
  const storeLogoUrl = settings?.store?.logo_url || 'https://picsum.photos/seed/login_logo/80/80';
  const storeName = settings?.store?.store_name || 'JáPede Admin';
  const disableSocialLogin = isLoadingProfiles && profiles.length === 0;

  // This is the loading state that was causing the issue. 
  // It only shows if profiles are loading AND there are no profiles yet (initial state).
  if (isLoadingProfiles && profiles.length === 0) {
    return <InitializingView />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
          <LoginHeader logoUrl={storeLogoUrl} storeName={storeName} />
          <AuthForm 
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            authLoading={authLoading && (!!email || !!password)}
            handleSubmit={handleSubmit}
            onForgotPassword={() => setIsForgotPasswordModalOpen(true)}
          />
          <SocialLogins onGoogleSignIn={handleGoogleSignIn} authLoading={authLoading} disabled={disableSocialLogin}/>
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
                if (profiles.length === 0) {
                     setAlert({ message: "É necessário criar um super administrador para usar o sistema.", type: "error"});
                }
            }}
            onSuccess={() => {
                setIsSuperAdminCreationModalOpen(false);
                // After success, App.tsx will handle the redirect because currentUser will be set.
            }}
        />
      )}
      <style>{`
        .input-style {
            appearance: none;
            display: block;
            width: 100%;
            padding-left: 2.5rem; /* 40px */
            padding-right: 0.75rem; /* 12px */
            padding-top: 0.75rem; /* 12px */
            padding-bottom: 0.75rem; /* 12px */
            border: 1px solid #D1D5DB; /* gray-300 */
            border-radius: 0.375rem; /* rounded-md */
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            placeholder-color: #9CA3AF; /* gray-400 */
        }
        .input-style:focus {
            outline: none;
            --tw-ring-color: #F97316; /* primary */
            --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
            --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
            box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
            border-color: #F97316; /* primary */
        }
        .button-primary {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0.75rem 1rem;
            border: 1px solid transparent;
            border-radius: 0.375rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            font-size: 0.875rem;
            font-weight: 500;
            color: white;
            background-color: #F97316; /* primary */
            transition: background-color 0.15s ease-in-out;
        }
        .button-primary:hover { background-color: #EA580C; /* primary-dark */ }
        .button-primary:focus { outline: none; box-shadow: 0 0 0 2px white, 0 0 0 4px #FB923C; }
        .button-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .button-secondary {
            display: inline-flex;
            justify-content: center;
            padding: 0.75rem 1rem;
            border: 1px solid #D1D5DB; /* gray-300 */
            border-radius: 0.375rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            background-color: white;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151; /* gray-700 */
            transition: background-color 0.15s ease-in-out;
        }
        .button-secondary:hover { background-color: #F9FAFB; /* gray-50 */ }
        .button-secondary:focus { outline: none; box-shadow: 0 0 0 2px white, 0 0 0 4px #FED7AA; }
        .button-secondary:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
    </>
  );
};

export default LoginPage;
