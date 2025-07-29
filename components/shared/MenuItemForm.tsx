
import React, { useState, useEffect } from 'react';
import { MenuItem, Category, PizzaSize, PizzaCrust } from '../../types';
import { useAppContext } from '@/contexts/AppContext';
import { generateDescription as fetchGeneratedDescription } from '@/services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { SparklesIcon, PlusIcon, TrashIcon } from '../icons';
import { generateId } from '../../constants';

interface MenuItemFormProps {
  menuItem?: MenuItem | null;
  categoryId: string;
  onSave: (item: Omit<MenuItem, 'id' | 'created_at'>) => void;
  onCancel: () => void;
  onDeleteItem?: (itemId: string) => Promise<void>; 
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ menuItem, categoryId, onSave, onCancel, onDeleteItem }) => {
  const { categories, setAlert } = useAppContext();
  
  // Common fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId);
  const [imageUrl, setImageUrl] = useState('');
  const [available, setAvailable] = useState(true);
  const [itemType, setItemType] = useState<'standard' | 'pizza'>('standard');
  const [sendToKitchen, setSendToKitchen] = useState(true);
  
  // Standard item price
  const [standardPrice, setStandardPrice] = useState(0);

  // Pizza specific fields
  const [sizes, setSizes] = useState<PizzaSize[]>([]);
  const [allowHalfAndHalf, setAllowHalfAndHalf] = useState(false);

  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  useEffect(() => {
    if (menuItem) {
      setName(menuItem.name);
      setDescription(menuItem.description);
      setSelectedCategoryId(menuItem.category_id);
      setImageUrl(menuItem.image_url || '');
      setAvailable(menuItem.available);
      setItemType(menuItem.item_type || 'standard');
      setSendToKitchen(menuItem.send_to_kitchen === undefined ? true : menuItem.send_to_kitchen);
      
      if (menuItem.item_type === 'pizza') {
        setSizes(menuItem.sizes || [{ id: generateId(), name: 'Padrão', price: menuItem.price, crusts: [] }]);
        setAllowHalfAndHalf(menuItem.allow_half_and_half || false);
        setStandardPrice(0); 
      } else {
        setStandardPrice(menuItem.price);
        setSizes([]);
        setAllowHalfAndHalf(false);
      }
    } else {
        setName('');
        setDescription('');
        setSelectedCategoryId(categoryId);
        setImageUrl('');
        setAvailable(true);
        setItemType('standard');
        setSendToKitchen(true);
        setStandardPrice(0);
        setSizes([{ id: generateId(), name: 'Padrão', price: 0, crusts: [] }]);
        setAllowHalfAndHalf(false);
    }
  }, [menuItem, categoryId]);

  const addSize = () => setSizes([...sizes, { id: generateId(), name: '', price: 0, crusts: [] }]);
  const updateSizeField = (sizeIndex: number, field: keyof Omit<PizzaSize, 'id'|'crusts'>, value: string | number) => {
    const newSizes = [...sizes];
    const sizeToUpdate = { ...newSizes[sizeIndex] };
    if (field === 'price') sizeToUpdate[field] = parseFloat(value as string) || 0;
    else sizeToUpdate[field] = value as string;
    newSizes[sizeIndex] = sizeToUpdate;
    setSizes(newSizes);
  };
  const removeSize = (index: number) => setSizes(sizes.filter((_, i) => i !== index));

  const addCrustToSize = (sizeIndex: number) => {
    const newSizes = [...sizes];
    const sizeToUpdate = { ...newSizes[sizeIndex] };
    if (!sizeToUpdate.crusts) {
      sizeToUpdate.crusts = [];
    }
    sizeToUpdate.crusts.push({ id: generateId(), name: '', additionalPrice: 0 });
    newSizes[sizeIndex] = sizeToUpdate;
    setSizes(newSizes);
  };

  const updateCrustInSize = (sizeIndex: number, crustIndex: number, field: keyof PizzaCrust, value: string | number) => {
    const newSizes = [...sizes];
    const sizeToUpdate = { ...newSizes[sizeIndex] };
    if (sizeToUpdate.crusts && sizeToUpdate.crusts[crustIndex]) {
      const crustToUpdate = { ...sizeToUpdate.crusts[crustIndex] };
      if (field === 'additionalPrice') crustToUpdate[field] = parseFloat(value as string) || 0;
      else crustToUpdate[field] = value as string;
      sizeToUpdate.crusts[crustIndex] = crustToUpdate;
      newSizes[sizeIndex] = sizeToUpdate;
      setSizes(newSizes);
    }
  };
  
  const removeCrustFromSize = (sizeIndex: number, crustIndex: number) => {
    const newSizes = [...sizes];
    const sizeToUpdate = { ...newSizes[sizeIndex] };
    if (sizeToUpdate.crusts) {
      sizeToUpdate.crusts = sizeToUpdate.crusts.filter((_, i) => i !== crustIndex);
      newSizes[sizeIndex] = sizeToUpdate;
      setSizes(newSizes);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCategoryId) {
        setAlert({message: 'Nome e categoria são obrigatórios.', type: 'error'});
        return;
    }

    let priceToSave: number;

    if (itemType === 'pizza') {
      if (sizes.length === 0) {
        setAlert({message: 'Pizzas devem ter pelo menos um tamanho cadastrado.', type: 'error'});
        return;
      }
      for (const size of sizes) {
        if (!size.name.trim() || size.price <= 0) {
            setAlert({message: 'Todos os tamanhos de pizza devem ter nome e preço maior que zero.', type: 'error'});
            return;
        }
        if (size.crusts) {
            for (const crust of size.crusts) {
                if (!crust.name.trim() || crust.additionalPrice < 0) {
                    setAlert({message: `Todas as bordas do tamanho "${size.name}" devem ter nome e preço adicional não negativo.`, type: 'error'});
                    return;
                }
            }
        }
      }
      priceToSave = sizes.length > 0 ? Math.min(...sizes.map(s => s.price)) : 0;
    } else {
      if (standardPrice <= 0) {
        setAlert({message: 'Preço do item padrão deve ser maior que zero.', type: 'error'});
        return;
      }
      priceToSave = standardPrice;
    }
    
    const itemData: Omit<MenuItem, 'id' | 'created_at'> = { 
      name, 
      description, 
      category_id: selectedCategoryId, 
      image_url: imageUrl || undefined, 
      available,
      item_type: itemType,
      send_to_kitchen: sendToKitchen,
      price: priceToSave, 
      sizes: itemType === 'pizza' ? sizes.map(s => ({ ...s, crusts: s.crusts?.length ? s.crusts : undefined })) : undefined,
      allow_half_and_half: itemType === 'pizza' ? allowHalfAndHalf : undefined,
    };

    onSave(itemData);
  };

  const handleGenerateDescription = async () => {
    if (!name.trim()) {
      setAlert({ message: 'Por favor, insira um nome para o item antes de gerar a descrição.', type: 'info' });
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const prompt = `Crie uma descrição curta e apetitosa para um item de cardápio chamado "${name}". Máximo de 150 caracteres.`;
      const generatedDesc = await fetchGeneratedDescription(prompt);
      setDescription(generatedDesc);
      setAlert({ message: 'Descrição gerada com sucesso!', type: 'success'});
    } catch (error) {
      console.error("Error generating description:", error);
      const errorMessage = error instanceof Error ? error.message : "Falha ao gerar descrição. Verifique sua chave de API e conexão.";
      setAlert({ message: errorMessage, type: 'error'});
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleDelete = async () => {
    if (menuItem && menuItem.id && onDeleteItem) {
      if (window.confirm(`Tem certeza que deseja excluir o item "${menuItem.name}"? Esta ação não pode ser desfeita.`)) {
        await onDeleteItem(menuItem.id);
        onCancel(); 
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="itemType" className="block text-sm font-medium text-gray-700">Tipo do Item</label>
        <select
          id="itemType"
          value={itemType}
          onChange={(e) => setItemType(e.target.value as 'standard' | 'pizza')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          <option value="standard">Padrão (Ex: Lanche, Bebida)</option>
          <option value="pizza">Pizza (com tamanhos e bordas)</option>
        </select>
      </div>

      <div>
        <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Nome do Item</label>
        <input
          type="text"
          id="itemName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          id="itemDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="Descreva seu item aqui..."
        />
        <button
          type="button"
          onClick={handleGenerateDescription}
          disabled={isGeneratingDesc}
          className="mt-2 flex items-center text-sm text-primary hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed font-medium py-1 px-2 rounded-md border border-primary hover:bg-primary-light/20 transition-colors"
        >
          {isGeneratingDesc ? (
            <><LoadingSpinner size="w-4 h-4" className="mr-2" /> Gerando...</>
          ) : (
            <><SparklesIcon className="w-4 h-4 mr-1" /> Gerar com IA</>
          )}
        </button>
      </div>

      {itemType === 'standard' && (
        <div>
          <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700">Preço (R$)</label>
          <input
            type="number"
            id="itemPrice"
            value={standardPrice}
            onChange={(e) => setStandardPrice(parseFloat(e.target.value))}
            step="0.01"
            min="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required={itemType === 'standard'}
          />
        </div>
      )}

      {itemType === 'pizza' && (
        <>
          <div className="space-y-3 p-3 border border-gray-200 rounded-md">
            <h4 className="text-md font-medium text-gray-700">Tamanhos da Pizza e Bordas</h4>
            {sizes.map((size, sizeIndex) => (
              <div key={size.id || sizeIndex} className="p-3 border rounded-lg bg-gray-50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div className="col-span-1 sm:col-span-1">
                    <label htmlFor={`sizeName-${sizeIndex}`} className="block text-xs font-medium text-gray-600">Nome Tamanho (Ex: Média)</label>
                    <input type="text" id={`sizeName-${sizeIndex}`} value={size.name} onChange={e => updateSizeField(sizeIndex, 'name', e.target.value)} placeholder="Ex: Média" className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary" required />
                  </div>
                  <div className="col-span-1 sm:col-span-1">
                    <label htmlFor={`sizePrice-${sizeIndex}`} className="block text-xs font-medium text-gray-600">Preço Base (R$)</label>
                    <input type="number" id={`sizePrice-${sizeIndex}`} value={size.price} onChange={e => updateSizeField(sizeIndex, 'price', e.target.value)} step="0.01" min="0.01" className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary" required/>
                  </div>
                  <button type="button" onClick={() => removeSize(sizeIndex)} className="text-red-500 hover:text-red-700 text-xs sm:self-end sm:mt-0 mt-2 p-1 rounded flex items-center justify-center bg-red-50 hover:bg-red-100 border border-red-200">
                    <TrashIcon className="w-4 h-4 mr-1" /> Remover Tamanho
                  </button>
                </div>

                <div className="ml-0 sm:ml-4 mt-2 pt-2 border-t border-gray-200 space-y-2">
                    <h5 className="text-xs font-medium text-gray-600">Opções de Borda para este Tamanho ({size.name}):</h5>
                    {size.crusts?.map((crust, crustIndex) => (
                        <div key={crust.id || crustIndex} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center p-1.5 border rounded bg-white">
                            <div className="col-span-1 sm:col-span-1">
                                <label htmlFor={`crustName-${sizeIndex}-${crustIndex}`} className="block text-xs font-medium text-gray-500">Nome Borda</label>
                                <input type="text" id={`crustName-${sizeIndex}-${crustIndex}`} value={crust.name} onChange={e => updateCrustInSize(sizeIndex, crustIndex, 'name', e.target.value)} placeholder="Ex: Catupiry" className="mt-0.5 block w-full px-1.5 py-0.5 border border-gray-200 rounded-md shadow-sm text-xs focus:ring-primary focus:border-primary" required/>
                            </div>
                            <div className="col-span-1 sm:col-span-1">
                                <label htmlFor={`crustPrice-${sizeIndex}-${crustIndex}`} className="block text-xs font-medium text-gray-500">Preço Adic. Borda (R$)</label>
                                <input type="number" id={`crustPrice-${sizeIndex}-${crustIndex}`} value={crust.additionalPrice} onChange={e => updateCrustInSize(sizeIndex, crustIndex, 'additionalPrice', e.target.value)} step="0.01" min="0" className="mt-0.5 block w-full px-1.5 py-0.5 border border-gray-200 rounded-md shadow-sm text-xs focus:ring-primary focus:border-primary" required/>
                            </div>
                            <button type="button" onClick={() => removeCrustFromSize(sizeIndex, crustIndex)} className="text-red-500 hover:text-red-600 text-xs p-0.5 rounded flex items-center justify-center hover:bg-red-50 border border-transparent hover:border-red-100">
                                <TrashIcon className="w-3 h-3 mr-0.5" /> Remover Borda
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addCrustToSize(sizeIndex)} className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center py-0.5 px-1.5 border border-blue-500 rounded hover:bg-blue-50 transition-colors">
                        <PlusIcon className="w-3 h-3 mr-1" /> Adicionar Borda para {size.name || 'este tamanho'}
                    </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addSize} className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium flex items-center py-1 px-2 border border-green-500 rounded hover:bg-green-50 transition-colors">
              <PlusIcon className="w-4 h-4 mr-1" /> Adicionar Novo Tamanho de Pizza
            </button>
          </div>
          
          <div className="flex items-center">
            <input
              id="itemAllowHalfAndHalf"
              type="checkbox"
              checked={allowHalfAndHalf}
              onChange={(e) => setAllowHalfAndHalf(e.target.checked)}
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="itemAllowHalfAndHalf" className="ml-2 block text-sm text-gray-900">Permitir Meia a Meia</label>
          </div>
        </>
      )}
      
      <div>
        <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700">Categoria</label>
        <select
          id="itemCategory"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
        >
          <option value="" disabled>Selecione uma categoria</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="itemImageUrl" className="block text-sm font-medium text-gray-700">URL da Imagem (Opcional)</label>
        <input
          type="url"
          id="itemImageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center">
            <input
            id="itemAvailable"
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="itemAvailable" className="ml-2 block text-sm text-gray-900">Disponível para Venda</label>
        </div>
        <div className="flex items-center">
            <input
                id="itemSendToKitchen"
                type="checkbox"
                checked={sendToKitchen}
                onChange={(e) => setSendToKitchen(e.target.checked)}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="itemSendToKitchen" className="ml-2 block text-sm text-gray-900">Enviar para Cozinha?</label>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2">
        <div>
            {menuItem && menuItem.id && onDeleteItem && (
            <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 transition-colors flex items-center"
            >
                <TrashIcon className="w-4 h-4 mr-1" /> Excluir Item
            </button>
            )}
        </div>
        <div className="flex space-x-3">
            <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
            >
            Cancelar
            </button>
            <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors"
            >
            {menuItem && menuItem.id ? 'Salvar Alterações' : 'Adicionar Item'}
            </button>
        </div>
      </div>
    </form>
  );
};

export default MenuItemForm;
