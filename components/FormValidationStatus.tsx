import React from 'react';

interface FormValidationStatusProps {
  isValid: boolean;
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  formType: 'login' | 'signup';
}

const FormValidationStatus: React.FC<FormValidationStatusProps> = ({
  isValid,
  errors,
  touched,
  formType
}) => {
  const touchedFields = Object.keys(touched).filter(key => touched[key]);
  const errorCount = Object.keys(errors).filter(key => errors[key]).length;
  const totalFields = formType === 'signup' ? 4 : 2;

  if (touchedFields.length === 0) return null;

  return (
    <div className="mt-4 p-3 rounded-lg border">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          Form Status
        </span>
        <span className={`font-semibold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
          {isValid ? '✓ Valid' : '✗ Invalid'}
        </span>
      </div>
      
      <div className="mt-2 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>Fields completed:</span>
          <span>{touchedFields.length}/{totalFields}</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center justify-between text-red-600">
            <span>Errors:</span>
            <span>{errorCount}</span>
          </div>
        )}
      </div>

      {errorCount > 0 && (
        <div className="mt-2 text-xs text-red-600">
          <div className="font-medium mb-1">Issues to fix:</div>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field} className="capitalize">
                {field.replace(/([A-Z])/g, ' $1').toLowerCase()}: {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FormValidationStatus; 