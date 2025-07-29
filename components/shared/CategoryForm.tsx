
import React, { useState, useEffect } from 'react';
import { Category } from '../../types';
import { useAppContext } from '@/contexts/AppContext';

interface CategoryFormProps {
  category?: Category | null;
  onSave: (category: Omit<Category, 'id'>) => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSave, onCancel }) => {
  const [name, setName] = useState(category?.name || '');
  const { setAlert } = useAppContext();

  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      setName(''); // Reset for new category
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlert({message: 'Nome da categoria é obrigatório.', type: 'error'});
      return;
    }
    onSave({ name });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
          Nome da Categoria
        </label>
        <input
          type="text"
          id="categoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
          autoFocus
        />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
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
          {category ? 'Salvar Alterações' : 'Adicionar Categoria'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;