import { useState, useCallback, useEffect, useRef, type ChangeEvent } from "react";

interface UseEditableFormProps<T> {
  initialData: T;
  onSave?: (data: T) => Promise<void> | void;
  externalEditing?: boolean;
}

export function useEditableForm<T>({
  initialData,
  onSave,
  externalEditing,
}: UseEditableFormProps<T>) {

  const [internalEditing, setInternalEditing] = useState(false);
  const [formData, setFormData] = useState<T>(initialData);
  const initialDataRef = useRef(initialData);

  // ← FIX: always hold the latest formData in a ref
  const formDataRef = useRef<T>(formData);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  // ← FIX: keep ref in sync after every state update
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

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
      // ← FIX: read from ref, never from the stale closure
      if (onSave) await onSave(formDataRef.current);
      setInternalEditing(false);
    } catch (error) {
      console.error("Error saving form:", error);
      throw error;
    }
  // ← FIX: remove formData from deps — ref handles freshness
  }, [onSave]);

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