import { useState, useCallback, type ChangeEvent } from 'react';

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

  const handleEdit = useCallback(() => setEditing(true), []);

  const handleCancel = useCallback(() => {
    setFormData(initialData);
    setEditing(false);
  }, [initialData]);

  const handleSave = useCallback(async () => {
    try {
      if (onSave) {
        await onSave(formData);
      }
      setEditing(false);
    } catch (error) {
      console.error('Error saving form:', error);
      
      throw error;
    }
  }, [onSave, formData]);

  
  const updateField = useCallback((field: keyof T) => (
    value: T[keyof T] | ChangeEvent<HTMLInputElement>
  ) => {
    
    const maybeEvent = value as any;
    const newValue =
      maybeEvent && typeof maybeEvent === "object" && "target" in maybeEvent && maybeEvent.target?.value !== undefined
        ? (maybeEvent.target.value as unknown as T[keyof T])
        : (value as T[keyof T]);

    setFormData(prev => ({
      ...prev,
      
      [field]: newValue as any
    }));
  }, []);

  return {
    editing,
    formData,
    updateField,
    handleEdit,
    handleSave,
    handleCancel
  };
}