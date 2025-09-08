# Dynamic Form Validation System

This document describes the comprehensive validation system implemented for the signup and login forms in the BookNView application.

## Overview

The validation system provides real-time, dynamic validation with the following features:

- **Real-time validation** with debounced input
- **Password strength indicator** with visual feedback
- **Comprehensive validation rules** for all form fields
- **Form status tracking** with error summaries
- **Touch-based validation** (errors only show after field interaction)
- **Dynamic form type switching** (login/signup)

## Components

### 1. Validation Utility (`utils/validation.ts`)

Contains all validation logic and rules:

```typescript
// Validation rules for different field types
const emailRules: ValidationRule[] = [
  { test: (value) => value.trim().length > 0, message: 'Email is required' },
  { test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), message: 'Please enter a valid email address' },
  { test: (value) => value.length <= 254, message: 'Email address is too long' }
];

const passwordRules: ValidationRule[] = [
  { test: (value) => value.length > 0, message: 'Password is required' },
  { test: (value) => value.length >= 8, message: 'Password must be at least 8 characters long' },
  { test: (value) => /[A-Z]/.test(value), message: 'Password must contain at least one uppercase letter' },
  { test: (value) => /[a-z]/.test(value), message: 'Password must contain at least one lowercase letter' },
  { test: (value) => /[0-9]/.test(value), message: 'Password must contain at least one number' },
  { test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value), message: 'Password must contain at least one special character' }
];
```

### 2. Custom Hook (`hooks/useFormValidation.ts`)

Manages form state and validation:

```typescript
const {
  formData,
  errors,
  touched,
  isValid,
  handleInputChange,
  handleBlur,
  validateAllFields,
  resetForm,
  updateFormType
} = useFormValidation({
  initialData: { name: '', email: '', password: '', confirmPassword: '' },
  formType: 'signup',
  debounceDelay: 300
});
```

### 3. Password Strength Indicator (`components/PasswordStrengthIndicator.tsx`)

Visual feedback for password strength:

- Progress bar showing strength level
- Color-coded strength labels (Very Weak to Very Strong)
- Checklist of password requirements
- Real-time updates as user types

### 4. Form Validation Status (`components/FormValidationStatus.tsx`)

Overall form status display:

- Shows form validity status
- Counts completed fields and errors
- Lists specific issues to fix
- Only appears after user interaction

## Validation Rules

### Email Validation
- Required field
- Valid email format
- Maximum length (254 characters)

### Password Validation (Signup)
- Required field
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Name Validation (Signup)
- Required field
- Minimum 2 characters
- Maximum 50 characters
- Letters and spaces only

### Confirm Password Validation (Signup)
- Required field
- Must match password field

### Login Form Validation
- Email: Same rules as signup
- Password: Required field only

## Features

### Real-time Validation
- Validation occurs as user types (debounced by 300ms)
- Errors clear immediately when user starts typing
- Validation on blur for immediate feedback

### Password Strength Indicator
- Visual progress bar
- Color-coded strength levels
- Requirement checklist
- Real-time updates

### Form Status Tracking
- Overall form validity
- Field completion tracking
- Error count and details
- Touch-based error display

### Dynamic Form Switching
- Seamless switching between login and signup
- Validation rules update automatically
- Form state resets appropriately

## Usage Example

```typescript
// In a component
const {
  formData,
  errors,
  touched,
  isValid,
  handleInputChange,
  handleBlur,
  validateAllFields
} = useFormValidation({
  initialData: { email: '', password: '' },
  formType: 'login'
});

// In JSX
<input
  type="email"
  value={formData.email}
  onChange={(e) => handleInputChange('email', e.target.value)}
  onBlur={() => handleBlur('email')}
  className={`border ${errors.email && touched.email ? 'border-red-500' : 'border-gray-300'}`}
/>
{errors.email && touched.email && (
  <p className="text-red-500 text-sm">{errors.email}</p>
)}
```

## Benefits

1. **Better User Experience**: Real-time feedback prevents form submission errors
2. **Security**: Strong password requirements improve account security
3. **Accessibility**: Clear error messages and visual indicators
4. **Maintainability**: Centralized validation logic
5. **Consistency**: Uniform validation across all forms
6. **Performance**: Debounced validation prevents excessive re-renders

## Future Enhancements

- Server-side validation integration
- Custom validation rules for different user types
- Internationalization support for error messages
- Advanced password strength algorithms
- Field-specific validation timing
- Validation rule customization per form 