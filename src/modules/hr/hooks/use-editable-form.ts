import { useState } from 'react';

interface UseEditableFormProps<T> {
  initialData: T;
  onSave?: (data: T) => Promise<void> | void;
}

/**
 * A custom hook for handling editable forms
 * @param initialData Initial form data
 * @param onSave Optional callback when form is saved
 */
export function useEditableForm<T>({ initialData, onSave }: UseEditableFormProps<T>) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<T>(initialData);

  const handleEdit = () => setEditing(true);
  
  const handleCancel = () => {
    setFormData(initialData);
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave(formData);
      }
      setEditing(false);
    } catch (error) {
      console.error('Error saving form:', error);
      // Here you could add error handling UI
    }
  };

  const updateField = <K extends keyof T>(field: K) => (
    value: T[K] | React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = value instanceof Event 
      ? (value as React.ChangeEvent<HTMLInputElement>).target.value 
      : value;
      
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  return {
    editing,
    formData,
    updateField,
    handleEdit,
    handleSave,
    handleCancel
  };
}