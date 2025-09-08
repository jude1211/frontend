export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

export interface FieldValidation {
  [key: string]: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

// Email validation rules
const emailRules: ValidationRule[] = [
  {
    test: (value: string) => value.trim().length > 0,
    message: 'Email is required'
  },
  {
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address'
  },
  {
    test: (value: string) => value.length <= 254,
    message: 'Email address is too long'
  }
];

// Password validation rules
const passwordRules: ValidationRule[] = [
  {
    test: (value: string) => value.length > 0,
    message: 'Password is required'
  },
  {
    test: (value: string) => value.length >= 8,
    message: 'Password must be at least 8 characters long'
  },
  {
    test: (value: string) => /[A-Z]/.test(value),
    message: 'Password must contain at least one uppercase letter'
  },
  {
    test: (value: string) => /[a-z]/.test(value),
    message: 'Password must contain at least one lowercase letter'
  },
  {
    test: (value: string) => /[0-9]/.test(value),
    message: 'Password must contain at least one number'
  },
  {
    test: (value: string) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
    message: 'Password must contain at least one special character'
  }
];

// Name validation rules
const nameRules: ValidationRule[] = [
  {
    test: (value: string) => value.trim().length > 0,
    message: 'Name is required'
  },
  {
    test: (value: string) => value.trim().length >= 2,
    message: 'Name must be at least 2 characters long'
  },
  {
    test: (value: string) => /^[A-Za-z\s]+$/.test(value),
    message: 'Name can only contain letters and spaces'
  },
  {
    test: (value: string) => value.trim().length <= 50,
    message: 'Name is too long (maximum 50 characters)'
  }
];

// Confirm password validation rules
const confirmPasswordRules: ValidationRule[] = [
  {
    test: (value: string) => value.length > 0,
    message: 'Please confirm your password'
  }
];

// Validation rules for different form types
export const validationRules: { [key: string]: FieldValidation } = {
  login: {
    email: emailRules,
    password: [
      {
        test: (value: string) => value.length > 0,
        message: 'Password is required'
      }
    ]
  },
  signup: {
    name: nameRules,
    email: emailRules,
    password: passwordRules,
    confirmPassword: confirmPasswordRules
  }
};

// Validate a single field
export const validateField = (fieldName: string, value: string, formType: 'login' | 'signup'): string | null => {
  const rules = validationRules[formType][fieldName];
  if (!rules) return null;

  for (const rule of rules) {
    if (!rule.test(value)) {
      return rule.message;
    }
  }
  return null;
};

// Validate confirm password with password comparison
export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

// Enhanced validate field function for confirm password
export const validateFieldEnhanced = (fieldName: string, value: string, formType: 'login' | 'signup', formData?: any): string | null => {
  if (fieldName === 'confirmPassword' && formData?.password) {
    return validateConfirmPassword(formData.password, value);
  }
  
  return validateField(fieldName, value, formType);
};

// Validate entire form
export const validateForm = (formData: any, formType: 'login' | 'signup'): ValidationResult => {
  const errors: { [key: string]: string } = {};
  let isValid = true;

  // Validate each field
  Object.keys(validationRules[formType]).forEach(fieldName => {
    const error = validateField(fieldName, formData[fieldName] || '', formType);
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  });

  // Special validation for confirm password
  if (formType === 'signup' && formData.password && formData.confirmPassword) {
    const confirmError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmError) {
      errors.confirmPassword = confirmError;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// Real-time validation with debouncing
export const createDebouncedValidator = (delay: number = 300) => {
  let timeoutId: NodeJS.Timeout;
  
  return (callback: () => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

// Password strength indicator
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  const strengthMap = {
    0: { label: 'Very Weak', color: 'text-red-500' },
    1: { label: 'Weak', color: 'text-red-400' },
    2: { label: 'Fair', color: 'text-yellow-500' },
    3: { label: 'Good', color: 'text-yellow-400' },
    4: { label: 'Strong', color: 'text-green-500' },
    5: { label: 'Very Strong', color: 'text-green-600' }
  };

  return {
    score,
    ...strengthMap[score as keyof typeof strengthMap]
  };
};

// Email format validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (Indian format)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Name format validation
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[A-Za-z\s]+$/;
  return nameRegex.test(name) && name.trim().length >= 2;
}; 