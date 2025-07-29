
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { UserGroupIcon, PlusIcon, PencilAltIcon, TrashIcon, EyeIcon, SearchIcon, ShoppingCartIcon, ClipboardCopyIcon, UsersIcon as TotalUsersIcon } from '@/components/icons';
import { Profile, CustomerFormValues, AlertInfo as AppAlertInfo } from '../types'; 
import CustomerViewModal from '@/components/customer/CustomerViewModal'; 
import CustomerEditModal from '@/components/customer/CustomerEditModal'; 
import Alert from '@/components/shared/Alert'; 
import LoadingSpinner from '@/components/shared/LoadingSpinner';


const CustomerManagementPage: React.FC = () => {
  const { 
    profiles, 
    isLoadingProfiles,
    addProfile, 
    updateProfile, 
    deleteProfile, 
    setAlert, 
    initiateOrderForCustomer
  } = useAppContext(); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProfileForView, setSelectedProfileForView] = useState<Profile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProfileForEdit, setSelectedProfileForEdit] = useState<Profile | null>(null);

  const filteredProfiles = useMemo(() => 
    profiles.filter(profile =>
      (profile.full_name && profile.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (profile.phone && profile.phone.includes(searchTerm)) ||
      (profile.email && profile.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [profiles, searchTerm]);

  const handleViewProfile = (profile: Profile) => {
    setSelectedProfileForView(profile);
    setIsViewModalOpen(true);
  };

  const handleOpenNewProfileModal = () => {
    setSelectedProfileForEdit(null); 
    setIsEditModalOpen(true);
  };
  
  const handleEditProfile = (profile: Profile) => {
    setSelectedProfileForEdit(profile);
    setIsEditModalOpen(true);
  };

  const handleDeleteProfile = async (profileId: string) => {
    const profileToDelete = profiles.find(p => p.id === profileId);
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${profileToDelete?.full_name || profileId}"? Esta ação não pode ser desfeita.`)) {
      await deleteProfile(profileId);
    }
  };

  const handleSaveProfile = async (formData: CustomerFormValues, id?: string) => {
    if (id) { 
      await updateProfile(id, formData);
    } else { 
      await addProfile(formData);
    }
    setIsEditModalOpen(false);
  };

  const handleStartOrderForCustomer = (profile: Profile) => {
    initiateOrderForCustomer(profile);
  };

  const handleCopyDirectOrderLink = (profileId: string) => {
    const link = `${window.location.origin}${window.location.pathname}?view=customer&profileId=${profileId}`;
    navigator.clipboard.writeText(link)
      .then(() => setAlert({ message: 'Link de pedido direto copiado!', type: 'success' }))
      .catch(() => setAlert({ message: 'Falha ao copiar link.', type: 'error' }));
  };

  if (isLoadingProfiles) {
    return (
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <LoadingSpinner size="w-12 h-12" />
            <p className="text-lg text-gray-600">Carregando clientes...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-semibold text-gray-800">Gerenciamento de Clientes</h1>
        </div>
        <button 
          onClick={handleOpenNewProfileModal}
          className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Novo Cliente (Perfil)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar cliente por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
        </div>
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md flex items-center justify-between">
            <div>
                <p className="text-sm opacity-90">Total de Clientes</p>
                <p className="text-3xl font-bold">{profiles.length}</p>
            </div>
            <TotalUsersIcon className="w-10 h-10 opacity-70"/>
        </div>
      </div>
      
      {filteredProfiles.length === 0 && !searchTerm && profiles.length === 0 && (
         <div className="text-center py-10 bg-white rounded-lg shadow">
            <img src="https://picsum.photos/seed/empty-customers/150/150" alt="Nenhum cliente" className="mx-auto mb-4 rounded-lg opacity-70" />
            <p className="text-gray-500 text-xl">Nenhum cliente (perfil) cadastrado.</p>
            <p className="text-gray-400 mt-2">Clientes (perfis) aparecerão aqui após cadastro ou importação.</p>
        </div>
      )}
      {filteredProfiles.length === 0 && searchTerm && (
         <div className="text-center py-6 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">Nenhum cliente encontrado para "{searchTerm}".</p>
        </div>
      )}

      {filteredProfiles.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endereço Principal</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastrado em</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{profile.full_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{profile.phone || 'N/A'}</div>
                    {profile.email && <div className="text-xs text-gray-500">{profile.email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.default_address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                    <button onClick={() => handleViewProfile(profile)} className="text-primary hover:text-primary-dark p-1 rounded hover:bg-primary-light/20" title="Ver Detalhes do Cliente"><EyeIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleEditProfile(profile)} className="text-yellow-500 hover:text-yellow-600 p-1 rounded hover:bg-yellow-100" title="Editar Cliente"><PencilAltIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleStartOrderForCustomer(profile)} className="text-green-500 hover:text-green-600 p-1 rounded hover:bg-green-100" title="Iniciar Pedido para este Cliente"><ShoppingCartIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleCopyDirectOrderLink(profile.id)} className="text-blue-500 hover:text-blue-600 p-1 rounded hover:bg-blue-100" title="Copiar Link de Pedido Direto do Cliente"><ClipboardCopyIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleDeleteProfile(profile.id)} className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-100" title="Excluir Cliente"><TrashIcon className="w-5 h-5"/></button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}

      {isViewModalOpen && selectedProfileForView && (
        <CustomerViewModal 
          customer={selectedProfileForView}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}

      {isEditModalOpen && (
        <CustomerEditModal
          initialCustomer={selectedProfileForEdit}
          onSave={handleSaveProfile}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerManagementPage;
