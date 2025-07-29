

import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { CogIcon, StorefrontIcon, ChatAltIcon, CreditCardIcon, KeyIcon, BellIcon as NotificationBellIcon, SaveIcon, PlusIcon, TrashIcon, ClockIcon, LinkIcon, EyeIcon as ShowKeyIcon, EyeOffIcon as HideKeyIcon, ClipboardCopyIcon, PlayIcon as FlowIcon } from '@/components/icons';
// Removed useSettingsContext, defaultAppSettings etc. as they are now managed by AppContext
import { AppSettings, StoreSettings, PaymentSettings, OpeningHoursEntry, DeliveryFeeType, WhatsAppSettings, NotificationSettings, OpeningHours, OrderType, OrderStatus, OrderFlowDurations, defaultAppSettings, PredefinedSound } from '../types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAppContext } from '@/contexts/AppContext'; // Changed to useAppContext

type SettingsTab = 'store' | 'payments' | 'order_flow' | 'whatsapp' | 'notifications' | 'integrations' | 'security'; // Added 'order_flow'
const DAYS_OF_WEEK: (keyof OpeningHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<keyof OpeningHours, string> = {
    monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira', thursday: 'Quinta-feira',
    friday: 'Sexta-feira', saturday: 'Sábado', sunday: 'Domingo'
};

const ORDER_TYPES_FOR_FLOW: { key: OrderType; label: string }[] = [
    { key: OrderType.DELIVERY, label: "Delivery" },
    { key: OrderType.BALCAO, label: "Balcão/Retirada" },
    { key: OrderType.MESA, label: "Mesa" },
];

const ORDER_STATUSES_FOR_FLOW: { key: OrderStatus; label: string; relevantForTypes?: OrderType[] }[] = [
    { key: OrderStatus.PENDING, label: "Pendente" },
    { key: OrderStatus.PREPARING, label: "Em Preparo" },
    { key: OrderStatus.READY_FOR_PICKUP, label: "Pronto para Retirada/Entrega" }, // Might mean "prato pronto" for Mesa
    { key: OrderStatus.OUT_FOR_DELIVERY, label: "Saiu para Entrega", relevantForTypes: [OrderType.DELIVERY] },
];

// IMPORTANT: These are placeholder URLs using MDN example sounds. 
// Replace them with your actual, hosted sound files for reliable production playback.
const PREDEFINED_SOUND_OPTIONS: PredefinedSound[] = [
    { key: 'none', label: 'Nenhum Som', url: '' },
    // Using short, distinct sounds from MDN for example purposes
    { key: 'default_ifood_like', label: 'Padrão (Tipo iFood)', url: 'https://mdn.github.io/voice-change-o-matic/audio/triangle.mp3' }, // Example MP3 (short, distinct sound)
    { key: 'short_bell', label: 'Sino Curto', url: 'https://mdn.github.io/voice-change-o-matic/audio/sine.mp3' },       // Example MP3 (short beep)
    { key: 'quick_alert', label: 'Alerta Rápido', url: 'https://mdn.github.io/voice-change-o-matic/audio/viper.mp3' },  // Example MP3 (short hiss)
    { key: 'custom', label: 'Personalizado (URL)', url: '' }, // URL will be from input
];


const SettingsPage: React.FC = () => {
  const { settings, isLoadingSettings, updateSettings: updateSettingsInContext, setAlert } = useAppContext(); // Use AppContext
  const [activeTab, setActiveTab] = useState<SettingsTab>('store');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings || JSON.parse(JSON.stringify(defaultAppSettings))); // Deep copy defaultAppSettings
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newlyGeneratedApiKey, setNewlyGeneratedApiKey] = useState<string | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);


  useEffect(() => {
    if (settings) {
      setLocalSettings(JSON.parse(JSON.stringify(settings))); 
      if (newlyGeneratedApiKey && settings.n8n_api_key === newlyGeneratedApiKey) {
        setShowApiKey(true);
      } else {
        setShowApiKey(false); 
      }
      setNewlyGeneratedApiKey(null); 
    } else {
      setLocalSettings(JSON.parse(JSON.stringify(defaultAppSettings))); 
      setShowApiKey(false);
    }
  }, [settings, newlyGeneratedApiKey]);


  const handleStoreInputChange = (field: keyof StoreSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      store: {
        ...(prev.store || defaultAppSettings.store),
        [field]: value,
      },
    }));
  };

  const handlePaymentInputChange = (field: keyof PaymentSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      payments: {
        ...(prev.payments || defaultAppSettings.payments),
        [field]: value,
      },
    }));
  };
  
  const handleOpeningHoursChange = (day: keyof OpeningHours, field: keyof OpeningHoursEntry, value: string | boolean) => {
    setLocalSettings(prev => ({
        ...prev,
        store: {
            ...(prev.store || defaultAppSettings.store),
            opening_hours: {
                ...(prev.store?.opening_hours || defaultAppSettings.store.opening_hours),
                [day]: {
                    ...(prev.store?.opening_hours?.[day] || defaultAppSettings.store.opening_hours[day]),
                    [field]: value,
                }
            }
        }
    }));
  };

  const handleDeliveryFeeChange = (field: keyof StoreSettings['delivery_fee'], value: any) => {
    setLocalSettings(prev => ({
        ...prev,
        store: {
            ...(prev.store || defaultAppSettings.store),
            delivery_fee: {
                ...(prev.store?.delivery_fee || defaultAppSettings.store.delivery_fee),
                [field]: value,
            }
        }
    }));
  };

  const handleOrderFlowChange = (orderType: OrderType, status: OrderStatus, durationMinutes: string) => {
    const durationMs = (parseFloat(durationMinutes) || 0) * 60 * 1000;
    setLocalSettings(prev => {
        const newFlowSettings = JSON.parse(JSON.stringify(prev.order_flow || defaultAppSettings.order_flow));
        if (!newFlowSettings[orderType]) {
            newFlowSettings[orderType] = {};
        }
        newFlowSettings[orderType][status] = durationMs;
        return { ...prev, order_flow: newFlowSettings };
    });
  };

  const handleNotificationInputChange = (field: keyof NotificationSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      notifications: {
        ...(prev.notifications || defaultAppSettings.notifications),
        [field]: value,
      },
    }));
  };

  const handlePredefinedSoundChange = (selectedKey: string) => {
    const selectedSound = PREDEFINED_SOUND_OPTIONS.find(s => s.key === selectedKey);
    if (selectedSound) {
        handleNotificationInputChange('predefined_sound_key', selectedKey);
        if (selectedKey !== 'custom') {
            handleNotificationInputChange('sound_new_order_url', selectedSound.url);
        }
    }
  };

  const handleTestSound = () => {
    const soundUrl = localSettings.notifications?.sound_new_order_url;
    if (soundUrl) {
        if (testAudioRef.current) {
            testAudioRef.current.pause();
            testAudioRef.current.currentTime = 0;
            testAudioRef.current.src = ''; // Explicitly clear src
            testAudioRef.current.load(); // Reset the audio element
            testAudioRef.current = null;
        }
        try {
            const audio = new Audio(soundUrl);
            testAudioRef.current = audio;
            audio.play()
                .then(() => setAlert({message: "Tocando som de teste...", type: "info"}))
                .catch(err => {
                    console.error("Error playing test sound:", err);
                    setAlert({message: `Erro ao tocar som: ${err.message}. Verifique URL e permissões do navegador.`, type: "error"});
                });
        } catch (err) {
            console.error("Failed to create Audio object for test sound:", err);
            setAlert({message: `Falha ao iniciar som: ${(err as Error).message}. URL pode ser inválida.`, type: "error"});
        }
    } else {
        setAlert({message: "Nenhum som selecionado para testar.", type: "info"});
    }
  };


  const generateApiKey = () => {
    const newKey = 'japede_sk_' + Array(32).fill(null).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    setLocalSettings(prev => ({ ...prev, n8n_api_key: newKey }));
    setShowApiKey(true); 
    setNewlyGeneratedApiKey(newKey);
    setAlert({ message: 'Nova chave API gerada. Copie e salve em local seguro ANTES de salvar as configurações.', type: 'info' });
  };

  const revokeApiKey = () => {
    setLocalSettings(prev => ({ ...prev, n8n_api_key: null }));
    setShowApiKey(false); setNewlyGeneratedApiKey(null);
    setAlert({ message: 'Chave API marcada para revogação. Salve as configurações para confirmar.', type: 'info'});
  };

  const copyApiKeyToClipboard = () => {
    if (localSettings.n8n_api_key) {
      navigator.clipboard.writeText(localSettings.n8n_api_key)
        .then(() => setAlert({ message: 'Chave API copiada!', type: 'success' }))
        .catch(() => setAlert({ message: 'Falha ao copiar chave API.', type: 'error' }));
    }
  };


  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Ensure localSettings has all nested structures from default if they are missing
    const settingsToSave: AppSettings = {
        ...defaultAppSettings, // Start with all defaults
        ...localSettings,      // Override with user's local changes
        id: 'default_settings', // Ensure ID is always correct
        store: { ...defaultAppSettings.store, ...(localSettings.store || {}) },
        payments: { ...defaultAppSettings.payments, ...(localSettings.payments || {}) },
        whatsapp: { ...defaultAppSettings.whatsapp, ...(localSettings.whatsapp || {}) },
        notifications: { ...defaultAppSettings.notifications, ...(localSettings.notifications || {}) },
        order_flow: { // Deep merge for order_flow
            [OrderType.MESA]: { ...defaultAppSettings.order_flow[OrderType.MESA], ...(localSettings.order_flow?.[OrderType.MESA] || {}) },
            [OrderType.DELIVERY]: { ...defaultAppSettings.order_flow[OrderType.DELIVERY], ...(localSettings.order_flow?.[OrderType.DELIVERY] || {}) },
            [OrderType.BALCAO]: { ...defaultAppSettings.order_flow[OrderType.BALCAO], ...(localSettings.order_flow?.[OrderType.BALCAO] || {}) },
        },
        n8n_api_key: localSettings.n8n_api_key !== undefined ? localSettings.n8n_api_key : defaultAppSettings.n8n_api_key,
    };

    await updateSettingsInContext(settingsToSave); // updateSettingsInContext handles alerts
    setIsSaving(false);
  };

  if (isLoadingSettings && !settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="w-12 h-12" />
        <p className="ml-4 text-lg text-gray-600">Carregando configurações...</p>
      </div>
    );
  }
  if (!localSettings) { 
    return <p className="text-red-500">Erro ao carregar dados das configurações. Tente recarregar a página.</p>;
  }


  const TabButton: React.FC<{tabId: SettingsTab, currentTab: SettingsTab, onClick: () => void, children: React.ReactNode, icon: React.ReactNode}> = 
    ({ tabId, currentTab, onClick, children, icon }) => (
    <button
        type="button" onClick={onClick}
        className={`flex items-center px-3 py-2 sm:px-4 sm:py-3 font-medium text-xs sm:text-sm rounded-lg transition-colors duration-150 ease-in-out whitespace-nowrap
            ${currentTab === tabId ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
        role="tab" aria-selected={currentTab === tabId}
    > {icon} {children} </button>
  );

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-y-3">
        <div className="flex items-center space-x-2"> <CogIcon className="w-8 h-8 text-gray-700" /> <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Configurações</h1> </div>
        <button type="submit" disabled={isSaving || isLoadingSettings} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center disabled:opacity-70">
            {isSaving ? <LoadingSpinner size="w-5 h-5 mr-2" /> : <SaveIcon className="w-5 h-5 mr-2" />} Salvar Alterações
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-2 sm:p-4">
        <div className="flex space-x-1 sm:space-x-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto">
            <TabButton tabId="store" currentTab={activeTab} onClick={() => setActiveTab('store')} icon={<StorefrontIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>}>Loja</TabButton>
            <TabButton tabId="payments" currentTab={activeTab} onClick={() => setActiveTab('payments')} icon={<CreditCardIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>}>Pagamentos</TabButton>
            <TabButton tabId="order_flow" currentTab={activeTab} onClick={() => setActiveTab('order_flow')} icon={<FlowIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>}>Fluxo Pedidos</TabButton>
            <TabButton tabId="whatsapp" currentTab={activeTab} onClick={() => setActiveTab('whatsapp')} icon={<ChatAltIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>}>WhatsApp</TabButton>
            <TabButton tabId="notifications" currentTab={activeTab} onClick={() => setActiveTab('notifications')} icon={<NotificationBellIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>}>Notificações</TabButton>
            <TabButton tabId="integrations" currentTab={activeTab} onClick={() => setActiveTab('integrations')} icon={<LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>}>Integrações</TabButton>
            <TabButton tabId="security" currentTab={activeTab} onClick={() => setActiveTab('security')} icon={<KeyIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>}>Segurança</TabButton>
        </div>

        <div className="min-h-[300px] p-2">
            {activeTab === 'store' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-700">Informações da Loja</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div> <label htmlFor="store_name" className="block text-sm font-medium text-gray-700">Nome da Loja*</label> <input type="text" id="store_name" value={localSettings.store.store_name} onChange={e => handleStoreInputChange('store_name', e.target.value)} className="mt-1 block w-full input-style" required /> </div>
                        <div> <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Telefone Principal*</label> <input type="tel" id="phone_number" value={localSettings.store.phone_number} onChange={e => handleStoreInputChange('phone_number', e.target.value)} className="mt-1 block w-full input-style" placeholder="(XX) XXXXX-XXXX" required /> </div>
                    </div>
                     <div>
                        <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">URL do Logotipo da Loja</label>
                        <input
                            type="url"
                            id="logo_url"
                            value={localSettings.store.logo_url || ''}
                            onChange={e => handleStoreInputChange('logo_url', e.target.value)}
                            className="mt-1 block w-full input-style"
                            placeholder="https://exemplo.com/logo.png"
                        />
                        {localSettings.store.logo_url && (
                            <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Pré-visualização do Logo:</p>
                                <img 
                                    src={localSettings.store.logo_url} 
                                    alt="Pré-visualização do Logo" 
                                    className="h-16 w-auto rounded border border-gray-200 bg-gray-50 object-contain"
                                    onError={(e) => { 
                                        (e.target as HTMLImageElement).style.display='none'; 
                                        const errorText = document.createElement('p');
                                        errorText.textContent = 'Falha ao carregar imagem.';
                                        errorText.className = 'text-xs text-red-500';
                                        (e.target as HTMLImageElement).parentElement?.appendChild(errorText);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div><label htmlFor="address_street" className="block text-sm font-medium text-gray-700">Rua/Avenida*</label><input type="text" id="address_street" value={localSettings.store.address_street} onChange={e => handleStoreInputChange('address_street', e.target.value)} className="mt-1 block w-full input-style" required/></div>
                         <div><label htmlFor="address_number" className="block text-sm font-medium text-gray-700">Número*</label><input type="text" id="address_number" value={localSettings.store.address_number} onChange={e => handleStoreInputChange('address_number', e.target.value)} className="mt-1 block w-full input-style" required/></div>
                         <div><label htmlFor="address_neighborhood" className="block text-sm font-medium text-gray-700">Bairro*</label><input type="text" id="address_neighborhood" value={localSettings.store.address_neighborhood} onChange={e => handleStoreInputChange('address_neighborhood', e.target.value)} className="mt-1 block w-full input-style" required/></div>
                         <div><label htmlFor="address_city" className="block text-sm font-medium text-gray-700">Cidade*</label><input type="text" id="address_city" value={localSettings.store.address_city} onChange={e => handleStoreInputChange('address_city', e.target.value)} className="mt-1 block w-full input-style" required/></div>
                         <div><label htmlFor="address_postal_code" className="block text-sm font-medium text-gray-700">CEP*</label><input type="text" id="address_postal_code" value={localSettings.store.address_postal_code} onChange={e => handleStoreInputChange('address_postal_code', e.target.value)} className="mt-1 block w-full input-style" placeholder="XXXXX-XXX" required/></div>
                         <div><label htmlFor="address_complement" className="block text-sm font-medium text-gray-700">Complemento</label><input type="text" id="address_complement" value={localSettings.store.address_complement || ''} onChange={e => handleStoreInputChange('address_complement', e.target.value)} className="mt-1 block w-full input-style"/></div>
                    </div>
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Horário de Funcionamento <ClockIcon className="w-5 h-5 inline ml-1"/></h3>
                        <div className="space-y-3">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 p-2 border rounded-md bg-gray-50">
                                <label htmlFor={`${day}_enabled`} className="col-span-1 sm:col-span-1 flex items-center text-sm font-medium text-gray-700"> <input type="checkbox" id={`${day}_enabled`} checked={localSettings.store.opening_hours[day].enabled} onChange={e => handleOpeningHoursChange(day, 'enabled', e.target.checked)} className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary mr-2"/> {DAY_LABELS[day]} </label>
                                <div className="col-span-1 sm:col-span-1"><label htmlFor={`${day}_open`} className="sr-only">Abre</label><input type="time" id={`${day}_open`} value={localSettings.store.opening_hours[day].open} onChange={e => handleOpeningHoursChange(day, 'open', e.target.value)} className="w-full input-style text-xs" disabled={!localSettings.store.opening_hours[day].enabled}/></div>
                                <span className="hidden sm:inline text-center text-gray-500">-</span>
                                <div className="col-span-1 sm:col-span-1"><label htmlFor={`${day}_close`} className="sr-only">Fecha</label><input type="time" id={`${day}_close`} value={localSettings.store.opening_hours[day].close} onChange={e => handleOpeningHoursChange(day, 'close', e.target.value)} className="w-full input-style text-xs" disabled={!localSettings.store.opening_hours[day].enabled}/></div>
                            </div>
                        ))}
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="text-lg font-medium text-gray-700 mb-3">Taxa de Entrega</h3>
                        <div className="space-y-2">
                            {(['fixed', 'per_km', 'free', 'free_above_value'] as DeliveryFeeType[]).map(type => (
                                <label key={type} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50"> <input type="radio" name="deliveryFeeType" value={type} checked={localSettings.store.delivery_fee.type === type} onChange={() => handleDeliveryFeeChange('type', type)} className="form-radio h-4 w-4 text-primary"/> <span className="text-sm text-gray-700"> {type === 'fixed' && 'Taxa Fixa'} {type === 'per_km' && 'Taxa por KM'} {type === 'free' && 'Entrega Grátis'} {type === 'free_above_value' && 'Grátis Acima de'} </span> </label>
                            ))}
                        </div>
                        {localSettings.store.delivery_fee.type === 'fixed' && ( <div className="mt-2"><label htmlFor="fixed_amount" className="text-sm">Valor Fixo (R$):</label><input type="number" id="fixed_amount" value={localSettings.store.delivery_fee.fixed_amount || ''} onChange={e => handleDeliveryFeeChange('fixed_amount', parseFloat(e.target.value))} className="ml-2 input-style w-24" step="0.01" /></div> )}
                        {localSettings.store.delivery_fee.type === 'per_km' && ( <div className="mt-2"><label htmlFor="amount_per_km" className="text-sm">Valor por KM (R$):</label><input type="number" id="amount_per_km" value={localSettings.store.delivery_fee.amount_per_km || ''} onChange={e => handleDeliveryFeeChange('amount_per_km', parseFloat(e.target.value))} className="ml-2 input-style w-24" step="0.01" /></div> )}
                         {localSettings.store.delivery_fee.type === 'free_above_value' && ( <div className="mt-2"><label htmlFor="min_order_for_free_delivery" className="text-sm">Valor Mínimo Pedido p/ Entrega Grátis (R$):</label><input type="number" id="min_order_for_free_delivery" value={localSettings.store.delivery_fee.min_order_for_free_delivery || ''} onChange={e => handleDeliveryFeeChange('min_order_for_free_delivery', parseFloat(e.target.value))} className="ml-2 input-style w-24" step="0.01" /></div> )}
                         <div className="mt-3"> <label htmlFor="min_order_value_delivery" className="block text-sm font-medium text-gray-700">Valor Mínimo do Pedido para Entrega (R$)</label> <input type="number" id="min_order_value_delivery" value={localSettings.store.min_order_value_delivery || ''} onChange={e => handleStoreInputChange('min_order_value_delivery', parseFloat(e.target.value))} className="mt-1 input-style w-32" step="0.01" placeholder="Ex: 15.00" /> </div>
                    </div>
                </div>
            )}
            {activeTab === 'payments' && (
                 <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-700">Formas de Pagamento Aceitas</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50"><input type="checkbox" checked={localSettings.payments.accept_cash} onChange={e => handlePaymentInputChange('accept_cash', e.target.checked)} className="h-5 w-5 text-primary rounded"/> <span className="text-sm">Dinheiro</span></label>
                        <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50"><input type="checkbox" checked={localSettings.payments.accept_debit_card} onChange={e => handlePaymentInputChange('accept_debit_card', e.target.checked)} className="h-5 w-5 text-primary rounded"/> <span className="text-sm">Cartão de Débito</span></label>
                        <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50"><input type="checkbox" checked={localSettings.payments.accept_credit_card} onChange={e => handlePaymentInputChange('accept_credit_card', e.target.checked)} className="h-5 w-5 text-primary rounded"/> <span className="text-sm">Cartão de Crédito</span></label>
                        <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50"><input type="checkbox" checked={localSettings.payments.accept_pix} onChange={e => handlePaymentInputChange('accept_pix', e.target.checked)} className="h-5 w-5 text-primary rounded"/> <span className="text-sm">PIX</span></label>
                    </div>
                    {localSettings.payments.accept_pix && (
                        <div className="pt-4 border-t mt-4">
                            <h3 className="text-md font-medium text-gray-700 mb-1">Configuração PIX</h3>
                             <div><label htmlFor="pix_key_type" className="text-sm">Tipo da Chave PIX:</label> <select id="pix_key_type" value={localSettings.payments.pix_key_type || 'random'} onChange={e => handlePaymentInputChange('pix_key_type', e.target.value)} className="ml-2 input-style"> <option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">Email</option><option value="phone">Telefone</option><option value="random">Aleatória</option> </select> </div>
                            <div className="mt-2"><label htmlFor="pix_key" className="text-sm">Chave PIX:</label><input type="text" id="pix_key" value={localSettings.payments.pix_key || ''} onChange={e => handlePaymentInputChange('pix_key', e.target.value)} className="ml-2 input-style w-full md:w-1/2" placeholder="Sua chave PIX"/></div>
                        </div>
                    )}
                    <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-md text-center text-gray-500"> Integração com Gateways de Pagamento (Stripe, Mercado Pago, etc.) - Em breve. </div>
                </div>
            )}
            {activeTab === 'order_flow' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-700">Configuração do Fluxo de Pedidos</h2>
                    <p className="text-sm text-gray-600">Defina os tempos (em minutos) para a transição automática entre os status dos pedidos. Use 0 para desativar a transição automática para um status específico.</p>
                    {ORDER_TYPES_FOR_FLOW.map(orderTypeInfo => (
                        <div key={orderTypeInfo.key} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                            <h3 className="text-lg font-medium text-gray-700 mb-3">{orderTypeInfo.label}</h3>
                            <div className="space-y-3">
                                {ORDER_STATUSES_FOR_FLOW
                                    .filter(statusInfo => !statusInfo.relevantForTypes || statusInfo.relevantForTypes.includes(orderTypeInfo.key))
                                    .map(statusInfo => {
                                        const currentDurationMs = localSettings.order_flow?.[orderTypeInfo.key]?.[statusInfo.key] ?? defaultAppSettings.order_flow[orderTypeInfo.key]?.[statusInfo.key] ?? 0;
                                        const currentDurationMin = (currentDurationMs / (60 * 1000)).toString();
                                    return (
                                    <div key={statusInfo.key} className="grid grid-cols-1 sm:grid-cols-2 items-center gap-2">
                                        <label htmlFor={`flow_${orderTypeInfo.key}_${statusInfo.key}`} className="text-sm font-medium text-gray-600">{statusInfo.label}:</label>
                                        <div className="flex items-center">
                                            <input
                                                type="number"
                                                id={`flow_${orderTypeInfo.key}_${statusInfo.key}`}
                                                value={currentDurationMin}
                                                onChange={e => handleOrderFlowChange(orderTypeInfo.key, statusInfo.key, e.target.value)}
                                                className="input-style w-24 text-sm"
                                                min="0"
                                                step="0.1"
                                            />
                                            <span className="ml-2 text-xs text-gray-500">minutos</span>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>
                    ))}
                </div>
            )}
             {activeTab === 'whatsapp' && ( <div className="p-4 text-gray-600"><h2 className="text-xl font-semibold text-gray-700 mb-2">Integração WhatsApp</h2> <p>Configurações para API do WhatsApp Business e mensagens automáticas (Em desenvolvimento).</p></div>)}
             {activeTab === 'notifications' && ( 
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-700">Configurações de Notificação</h2>
                    <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                         <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localSettings.notifications?.sound_alert_new_order_admin || false}
                                onChange={e => handleNotificationInputChange('sound_alert_new_order_admin', e.target.checked)}
                                className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-gray-700">Alerta Sonoro para Novo Pedido (Admin)</span>
                        </label>
                         {localSettings.notifications?.sound_alert_new_order_admin && (
                            <div className="mt-4 space-y-3 pl-6">
                                <div>
                                    <label htmlFor="predefined_sound" className="block text-sm font-medium text-gray-600">Som de Alerta:</label>
                                    <select
                                        id="predefined_sound"
                                        value={localSettings.notifications?.predefined_sound_key || 'none'}
                                        onChange={(e) => handlePredefinedSoundChange(e.target.value)}
                                        className="mt-1 block w-full sm:w-auto input-style"
                                    >
                                        {PREDEFINED_SOUND_OPTIONS.map(sound => (
                                            <option key={sound.key} value={sound.key}>{sound.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {localSettings.notifications?.predefined_sound_key === 'custom' && (
                                    <div>
                                        <label htmlFor="sound_new_order_url" className="block text-sm font-medium text-gray-600">URL do Som Personalizado (.mp3, .wav):</label>
                                        <input
                                            type="url"
                                            id="sound_new_order_url"
                                            value={localSettings.notifications?.sound_new_order_url || ''}
                                            onChange={e => handleNotificationInputChange('sound_new_order_url', e.target.value)}
                                            className="mt-1 block w-full input-style"
                                            placeholder="https://exemplo.com/meu_som.mp3"
                                        />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={handleTestSound}
                                    disabled={!localSettings.notifications?.sound_new_order_url}
                                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FlowIcon className="w-4 h-4 mr-1.5" /> Testar Som
                                </button>
                            </div>
                        )}
                    </div>
                     <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                        <label htmlFor="email_admin_new_order" className="block text-sm font-medium text-gray-700">Email para Notificação de Novos Pedidos (Admin)</label>
                        <input
                            type="email"
                            id="email_admin_new_order"
                            value={localSettings.notifications?.email_admin_new_order || ''}
                            onChange={e => handleNotificationInputChange('email_admin_new_order', e.target.value)}
                            className="mt-1 block w-full input-style"
                            placeholder="admin@sualoja.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">Deixe em branco para desabilitar.</p>
                    </div>
                    <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-md text-center text-gray-500"> Outras configurações de notificação (Push, SMS, etc) - Em desenvolvimento. </div>
                </div>
             )}
             {activeTab === 'integrations' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-700">Chave API para Integrações (n8n, etc.)</h2>
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md"> <p className="text-sm text-blue-700"> Use a chave API abaixo para permitir que serviços externos como n8n interajam com seu sistema JáPede. <strong>Guarde esta chave em local seguro. Ela concede acesso para criar pedidos, consultar status, etc.</strong> </p> </div>
                    {localSettings.n8n_api_key ? (
                        <div className="space-y-3">
                            <label htmlFor="api_key_display" className="block text-sm font-medium text-gray-700">Sua Chave API Atual:</label>
                            <div className="flex items-center space-x-2">
                                <input type={showApiKey ? "text" : "password"} id="api_key_display" readOnly value={localSettings.n8n_api_key} className="input-style flex-grow" aria-label="Chave API" />
                                <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="p-2 text-gray-500 hover:text-gray-700" title={showApiKey ? "Esconder Chave" : "Mostrar Chave"}> {showApiKey ? <HideKeyIcon className="w-5 h-5" /> : <ShowKeyIcon className="w-5 h-5" />} </button>
                                <button type="button" onClick={copyApiKeyToClipboard} className="p-2 text-gray-500 hover:text-blue-600" title="Copiar Chave"> <ClipboardCopyIcon className="w-5 h-5" /> </button>
                            </div>
                            <button type="button" onClick={revokeApiKey} className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center py-1 px-2 border border-red-500 rounded hover:bg-red-50 transition-colors"> <TrashIcon className="w-4 h-4 mr-1" /> Revogar Chave API (Requer Salvar) </button>
                             <p className="text-xs text-gray-500">Se revogar, a chave atual deixará de funcionar após salvar as configurações.</p>
                        </div>
                    ) : ( <p className="text-gray-600">Nenhuma chave API configurada no momento.</p> )}
                     <button type="button" onClick={generateApiKey} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"> {localSettings.n8n_api_key ? <PlusIcon className="w-5 h-5 mr-2" /> : <KeyIcon className="w-5 h-5 mr-2" />} {localSettings.n8n_api_key ? 'Gerar Nova Chave (Substituir)' : 'Gerar Chave API'} </button>
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="text-md font-semibold text-gray-600 mb-1">Como Usar:</h3>
                        <p className="text-sm text-gray-600"> Para integrar com n8n ou outros serviços, inclua esta chave no cabeçalho HTTP <code className="bg-gray-100 p-1 rounded text-xs">Authorization</code> das suas requisições: </p>
                        <pre className="bg-gray-800 text-white p-2 rounded-md text-xs my-2 overflow-x-auto"><code>Authorization: Bearer SUA_CHAVE_API_AQUI</code></pre>
                        <h4 className="text-sm font-medium text-gray-600 mt-2 mb-1">Endpoints de API (Exemplos - Implemente no seu Backend Supabase):</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5 pl-4">
                            <li><code className="bg-gray-100 p-0.5 rounded text-xs">POST /rest/v1/orders</code> - Criar novo pedido</li>
                            <li><code className="bg-gray-100 p-0.5 rounded text-xs">GET /rest/v1/orders?id=eq.SEU_ORDER_ID</code> - Consultar status de um pedido</li>
                            <li><code className="bg-gray-100 p-0.5 rounded text-xs">GET /rest/v1/menu_items</code> - Obter cardápio</li>
                            <li><code className="bg-gray-100 p-0.5 rounded text-xs">PATCH /rest/v1/orders?id=eq.SEU_ORDER_ID</code> - Atualizar/Cancelar um pedido</li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-2">Estes são exemplos. Você precisará configurar os endpoints e a lógica de autenticação no seu backend Supabase (ex: usando Edge Functions e RLS).</p>
                    </div>
                </div>
            )}
             {activeTab === 'security' && ( <div className="p-4 text-gray-600"><h2 className="text-xl font-semibold text-gray-700 mb-2">Segurança</h2> <p>Opções para alterar senha e gerenciar usuários (Em desenvolvimento).</p></div>)}
        </div>
      </div>
      <style>{`
        .input-style { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); font-size: 0.875rem; }
        .input-style:focus { outline: none; border-color: #F97316; box-shadow: 0 0 0 0.2rem rgba(249, 115, 22, 0.25); }
        .input-style[readonly] { background-color: #F3F4F6; cursor: default; }
      `}</style>
    </form>
  );
};

export default SettingsPage;
