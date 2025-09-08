import { useState, useCallback, useEffect } from 'react';
import { 
  validateField, 
  validateFieldEnhanced,
  validateConfirmPassword,
  validateForm, 
  createDebouncedValidator,
  ValidationResult 
} from '../utils/validation';

interface UseFormValidationProps {
  initialData: any;
  formType: 'login' | 'signup';
  debounceDelay?: number;
}

interface UseFormValidationReturn {
  formData: any;
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  isValid: boolean;
  handleInputChange: (field: string, value: string) => void;
  handleBlur: (field: string) => void;
  validateFieldOnChange: (field: string, value: string) => void;
  validateAllFields: () => ValidationResult;
  resetForm: () => void;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
}

export const useFormValidation = ({
  initialData,
  formType,
  debounceDelay = 300
}: UseFormValidationProps): UseFormValidationReturn => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isValid, setIsValid] = useState(false);
  const [currentFormType, setCurrentFormType] = useState(formType);

  // Create debounced validator
  const debouncedValidator = createDebouncedValidator(debounceDelay);

  // Validate a single field
  const validateFieldOnChange = useCallback((field: string, value: string) => {
    const error = validateFieldEnhanced(field, value, currentFormType, formData);
    
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));

    // Special handling for confirm password when password changes
    if (field === 'password' && formData.confirmPassword) {
      const confirmError = validateConfirmPassword(value, formData.confirmPassword);
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmError || ''
      }));
    }
  }, [currentFormType, formData]);

  // Handle input change with debounced validation
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error immediately when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Debounced validation
    debouncedValidator(() => {
      validateFieldOnChange(field, value);
    });
  }, [errors, validateFieldOnChange, debouncedValidator]);

  // Handle blur event
  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    const error = validateFieldEnhanced(field, formData[field] || '', currentFormType, formData);
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
  }, [formData, currentFormType]);

  // Validate all fields
  const validateAllFields = useCallback((): ValidationResult => {
    const result = validateForm(formData, currentFormType);
    setErrors(result.errors);
    setIsValid(result.isValid);
    return result;
  }, [formData, currentFormType]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, [initialData]);

  // Update form type
  const updateFormType = useCallback((newFormType: 'login' | 'signup') => {
    setCurrentFormType(newFormType);
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, []);

  // Set field error manually
  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
    setIsValid(false);
  }, []);

  // Clear field error
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  // Update form validity when errors change
  useEffect(() => {
    const hasErrors = Object.keys(errors).some(key => errors[key]);
    setIsValid(!hasErrors && Object.keys(formData).some(key => formData[key]));
  }, [errors, formData]);

  // Update form type when it changes
  useEffect(() => {
    setCurrentFormType(formType);
  }, [formType]);

  return {
    formData,
    errors,
    touched,
    isValid,
    handleInputChange,
    handleBlur,
    validateFieldOnChange,
    validateAllFields,
    resetForm,
    setFieldError,
    clearFieldError,
    updateFormType
  };
}; 