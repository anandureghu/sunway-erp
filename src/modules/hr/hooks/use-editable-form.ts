import { useState, useCallback, useEffect, useRef, type ChangeEvent } from "react";

interface UseEditableFormProps<T> {
  initialData: T;
  onSave?: (data: T) => Promise<void> | void;
  externalEditing?: boolean; // ← pass this from parent layout to control editing externally
}

export function useEditableForm<T>({
  initialData,
  onSave,
  externalEditing,
}: UseEditableFormProps<T>) {

  const [internalEditing, setInternalEditing] = useState(false);
  const [formData, setFormData] = useState<T>(initialData);
  const initialDataRef = useRef(initialData);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  // If externalEditing is provided, use it — otherwise use internal state
  const editing = externalEditing !== undefined ? externalEditing : internalEditing;

  const handleEdit = useCallback(() => {
    setInternalEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setFormData(initialDataRef.current);
    setInternalEditing(false);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (onSave) await onSave(formData);
      setInternalEditing(false);
    } catch (error) {
      console.error("Error saving form:", error);
      throw error;
    }
  }, [onSave, formData]);

  const updateField = useCallback(
    (field: keyof T) =>
      (value: T[keyof T] | ChangeEvent<HTMLInputElement>) => {
        const maybeEvent = value as any;
        const newValue =
          maybeEvent &&
          typeof maybeEvent === "object" &&
          "target" in maybeEvent &&
          maybeEvent.target?.value !== undefined
            ? (maybeEvent.target.value as unknown as T[keyof T])
            : (value as T[keyof T]);

        setFormData((prev) => ({ ...prev, [field]: newValue as any }));
      },
    []
  );

  const setFields = useCallback((fields: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  }, []);

  return {
    editing,
    formData,
    updateField,
    setFields,
    handleEdit,
    handleSave,
    handleCancel,
  };
}