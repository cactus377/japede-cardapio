
import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Category, MenuItem } from '../types';
import Modal from '@/components/shared/Modal';
import MenuItemForm from '@/components/shared/MenuItemForm';
import CategoryForm from '@/components/shared/CategoryForm';
import { PlusIcon, PencilAltIcon, TrashIcon, EyeIcon, EyeOffIcon, LinkIcon, ClipboardCopyIcon, DuplicateIcon } from '@/components/icons';
import Alert from '@/components/shared/Alert';

const MenuManagementPage: React.FC = () => {
  const { 
    categories, 
    menuItems, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem,
    alert, 
    setAlert
  } = useAppContext();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [categoryForNewItem, setCategoryForNewItem] = useState<string | null>(null);
  const [showShareLink, setShowShareLink] = useState(false);

  const currentUrlForCustomerLink = new URL(window.location.href);
  currentUrlForCustomerLink.search = '?view=customer'; 
  const customerMenuLink = currentUrlForCustomerLink.toString();

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const openNewMenuItemModal = (categoryId: string) => {
    setEditingMenuItem(null);
    setCategoryForNewItem(categoryId);
    setIsMenuItemModalOpen(true);
  };

  const openEditMenuItemModal = (menuItem: MenuItem) => {
    setEditingMenuItem(menuItem);
    setCategoryForNewItem(menuItem.category_id);
    setIsMenuItemModalOpen(true);
  };

  const openDuplicateMenuItemModal = (itemToDuplicate: MenuItem) => {
    const { id, created_at, ...itemDataWithoutId } = itemToDuplicate; 
    const duplicatedItem: Omit<MenuItem, 'id' | 'created_at'> & { id?: string; created_at?: string } = {
      ...itemDataWithoutId,
      name: `${itemToDuplicate.name} (Cópia)`,
    };
    delete duplicatedItem.id; 
    delete duplicatedItem.created_at;

    setEditingMenuItem(duplicatedItem as MenuItem); 
    setCategoryForNewItem(itemToDuplicate.category_id);
    setIsMenuItemModalOpen(true);
  };
  
  const handleToggleAvailability = (item: MenuItem) => {
    updateMenuItem({ ...item, available: !item.available });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerMenuLink)
      .then(() => setAlert({ message: 'Link copiado para a área de transferência!', type: 'success' }))
      .catch(() => setAlert({ message: 'Falha ao copiar o link.', type: 'error' }));
  };

  return (
    <div className="space-y-8">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-semibold text-gray-800">Gerenciamento de Cardápio</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowShareLink(!showShareLink)}
            className="bg-secondary hover:bg-secondary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
            title="Compartilhar link do cardápio para clientes"
          >
            <LinkIcon className="w-5 h-5 mr-2" /> {showShareLink ? 'Ocultar Link' : 'Compartilhar Cardápio'}
          </button>
          <button
            onClick={openNewCategoryModal}
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Nova Categoria
          </button>
        </div>
      </div>

      {showShareLink && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow">
          <p className="text-blue-700 font-semibold mb-2">Link do Cardápio para Clientes:</p>
          <div className="flex items-center space-x-2 bg-white p-2 border border-gray-300 rounded mb-2">
            <input 
              type="text" 
              readOnly 
              value={customerMenuLink} 
              className="text-sm text-gray-700 flex-grow p-1 bg-transparent focus:outline-none"
              aria-label="Link do cardápio para clientes"
            />
            <button 
              onClick={handleCopyLink} 
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Copiar link"
            >
              <ClipboardCopyIcon className="w-5 h-5" />
            </button>
          </div>
           <a 
              href={customerMenuLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out text-sm"
            >
              Abrir Cardápio em Nova Aba
            </a>
           <p className="text-xs text-blue-600 mt-2">Você pode copiar o link acima ou clicar no botão para abrir o cardápio do cliente.</p>
        </div>
      )}

      {categories.length === 0 && (
        <div className="text-center py-10 bg-white rounded-lg shadow">
            <img src="https://picsum.photos/seed/empty-menu/150/150" alt="Nenhum item no cardápio" className="mx-auto mb-4 rounded-lg opacity-70" />
            <p className="text-gray-500 text-xl">Nenhuma categoria cadastrada ainda.</p>
            <p className="text-gray-400 mt-2">Comece adicionando sua primeira categoria de produtos!</p>
        </div>
      )}

      {categories.map(category => (
        <section key={category.id} className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-700">{category.name}</h3>
            <div className="space-x-2">
              <button
                onClick={() => openNewMenuItemModal(category.id)}
                className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md transition duration-150 ease-in-out flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-1" /> Adicionar Item
              </button>
              <button
                onClick={() => openEditCategoryModal(category)}
                className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md transition duration-150 ease-in-out flex items-center"
              >
                <PencilAltIcon className="w-4 h-4 mr-1" /> Editar
              </button>
              <button
                onClick={() => {
                    if(window.confirm(`Tem certeza que deseja excluir a categoria "${category.name}" e todos os seus itens?`)){
                        deleteCategory(category.id);
                    }
                }}
                className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md transition duration-150 ease-in-out flex items-center"
              >
                <TrashIcon className="w-4 h-4 mr-1" /> Excluir
              </button>
            </div>
          </div>
          
          {menuItems.filter(item => item.category_id === category.id).length === 0 ? (
             <p className="text-gray-500 italic">Nenhum item nesta categoria.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.filter(item => item.category_id === category.id).map(item => (
              <div key={item.id} className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out ${item.available ? 'bg-white' : 'bg-gray-200 opacity-70'}`}>
                <img 
                    src={item.image_url || `https://picsum.photos/seed/${item.id}/400/200`} 
                    alt={item.name} 
                    className="w-full h-48 object-cover"
                    onError={(e) => (e.currentTarget.src = 'https://picsum.photos/seed/placeholder/400/200')}
                />
                <div className="p-4">
                  <h4 className="text-xl font-semibold text-gray-800 mb-1">{item.name}</h4>
                  <p className="text-gray-600 text-sm mb-2 h-16 overflow-y-auto">{item.description}</p>
                  <p className="text-lg font-bold text-primary mb-3">R$ {item.price.toFixed(2)}</p>
                  <div className="flex flex-wrap justify-start items-center gap-2 text-xs">
                    <button
                      onClick={() => openEditMenuItemModal(item)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded-md flex items-center transition duration-150"
                    >
                      <PencilAltIcon className="w-3 h-3 mr-1" /> Editar
                    </button>
                    <button
                      onClick={() => openDuplicateMenuItemModal(item)}
                      className="bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded-md flex items-center transition duration-150"
                    >
                      <DuplicateIcon className="w-3 h-3 mr-1" /> Duplicar
                    </button>
                     <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`${item.available ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-600'} text-white py-1 px-2 rounded-md flex items-center transition duration-150`}
                    >
                        {item.available ? <EyeOffIcon className="w-3 h-3 mr-1" /> : <EyeIcon className="w-3 h-3 mr-1" />} 
                        {item.available ? 'Indisponível' : 'Disponível'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </section>
      ))}

      {isCategoryModalOpen && (
        <Modal title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'} onClose={() => setIsCategoryModalOpen(false)}>
          <CategoryForm
            category={editingCategory}
            onSave={(catData) => {
              if (editingCategory && editingCategory.id) {
                updateCategory({ ...editingCategory, ...catData });
              } else {
                addCategory(catData.name);
              }
              setIsCategoryModalOpen(false);
            }}
            onCancel={() => setIsCategoryModalOpen(false)}
          />
        </Modal>
      )}

      {isMenuItemModalOpen && categoryForNewItem && (
        <Modal title={editingMenuItem && editingMenuItem.id ? 'Editar Item do Cardápio' : 'Novo Item no Cardápio'} onClose={() => setIsMenuItemModalOpen(false)}>
          <MenuItemForm
            menuItem={editingMenuItem}
            categoryId={editingMenuItem ? editingMenuItem.category_id : categoryForNewItem}
            onSave={(itemData) => {
              if (editingMenuItem && editingMenuItem.id) {
                updateMenuItem({ ...editingMenuItem, ...itemData });
              } else { 
                addMenuItem(itemData);
              }
              setIsMenuItemModalOpen(false);
            }}
            onCancel={() => setIsMenuItemModalOpen(false)}
            onDeleteItem={deleteMenuItem} 
          />
        </Modal>
      )}
    </div>
  );
};

export default MenuManagementPage;
