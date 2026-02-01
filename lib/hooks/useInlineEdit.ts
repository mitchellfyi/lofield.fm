"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseInlineEditOptions {
  initialValue: string;
  onSubmit: (value: string) => void | Promise<void>;
  onCancel?: () => void;
}

interface UseInlineEditReturn {
  isEditing: boolean;
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  startEdit: () => void;
  cancelEdit: () => void;
  setEditValue: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleBlur: () => void;
}

export function useInlineEdit({
  initialValue,
  onSubmit,
  onCancel,
}: UseInlineEditOptions): UseInlineEditReturn {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEdit = useCallback(() => {
    setEditValue(initialValue);
    setIsEditing(true);
  }, [initialValue]);

  const cancelEdit = useCallback(() => {
    setEditValue(initialValue);
    setIsEditing(false);
    onCancel?.();
  }, [initialValue, onCancel]);

  const submitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== initialValue) {
      onSubmit(trimmed);
    }
    setIsEditing(false);
  }, [editValue, initialValue, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        submitEdit();
      } else if (e.key === "Escape") {
        cancelEdit();
      }
    },
    [submitEdit, cancelEdit]
  );

  const handleBlur = useCallback(() => {
    submitEdit();
  }, [submitEdit]);

  return {
    isEditing,
    editValue,
    inputRef,
    startEdit,
    cancelEdit,
    setEditValue,
    handleKeyDown,
    handleBlur,
  };
}
