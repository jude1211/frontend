import React from 'react';

interface EmailVerificationProgressProps {
  currentStep: 'email-sent' | 'code-entered' | 'verified';
  email: string;
}

const EmailVerificationProgress: React.FC<EmailVerificationProgressProps> = ({
  currentStep,
  email
}) => {
  const steps = [
    {
      id: 'email-sent',
      title: 'Email Sent',
      description: 'Verification code sent to your email',
      icon: 'fas fa-envelope',
      color: 'blue'
    },
    {
      id: 'code-entered',
      title: 'Code Verification',
      description: 'Enter the 6-digit code',
      icon: 'fas fa-key',
      color: 'purple'
    },
    {
      id: 'verified',
      title: 'Verified',
      description: 'Email successfully verified',
      icon: 'fas fa-check-circle',
      color: 'green'
    }
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStepClasses = (stepId: string, color: string) => {
    const status = getStepStatus(stepId);
    
    switch (status) {
      case 'completed':
        return `bg-green-500 text-white border-green-500`;
      case 'current':
        return `bg-${color}-500 text-white border-${color}-500 ring-4 ring-${color}-200`;
      default:
        return `bg-gray-200 text-gray-500 border-gray-300`;
    }
  };

  const getConnectorClasses = (stepId: string) => {
    const status = getStepStatus(stepId);
    return status === 'completed' ? 'bg-green-500' : 'bg-gray-300';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Email Verification Progress
        </h3>
        <p className="text-sm text-gray-600">
          Verifying: <span className="font-medium">{email}</span>
        </p>
      </div>

      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex items-center mb-8 last:mb-0">
            {/* Step Circle */}
            <div className={`
              flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
              ${getStepClasses(step.id, step.color)}
            `}>
              <i className={`${step.icon} text-lg`}></i>
            </div>

            {/* Step Content */}
            <div className="ml-4 flex-1">
              <h4 className={`
                text-sm font-semibold transition-colors duration-300
                ${getStepStatus(step.id) === 'current' ? 'text-gray-900' : 
                  getStepStatus(step.id) === 'completed' ? 'text-green-700' : 'text-gray-500'}
              `}>
                {step.title}
              </h4>
              <p className={`
                text-xs transition-colors duration-300
                ${getStepStatus(step.id) === 'current' ? 'text-gray-600' : 
                  getStepStatus(step.id) === 'completed' ? 'text-green-600' : 'text-gray-400'}
              `}>
                {step.description}
              </p>
            </div>

            {/* Status Indicator */}
            <div className="ml-4">
              {getStepStatus(step.id) === 'completed' && (
                <div className="flex items-center text-green-600">
                  <i className="fas fa-check text-sm"></i>
                  <span className="ml-1 text-xs font-medium">Done</span>
                </div>
              )}
              {getStepStatus(step.id) === 'current' && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="ml-2 text-xs font-medium">In Progress</span>
                </div>
              )}
              {getStepStatus(step.id) === 'upcoming' && (
                <div className="flex items-center text-gray-400">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="ml-2 text-xs">Pending</span>
                </div>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`
                absolute left-6 top-12 w-0.5 h-8 transition-colors duration-300
                ${getConnectorClasses(step.id)}
              `}></div>
            )}
          </div>
        ))}
      </div>

      {/* Current Step Details */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <i className="fas fa-info-circle text-blue-500 mr-2"></i>
          <span className="text-sm font-medium text-gray-700">
            {currentStep === 'email-sent' && 'Check your email inbox for the verification code'}
            {currentStep === 'code-entered' && 'Verifying your code...'}
            {currentStep === 'verified' && 'Your email has been successfully verified!'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationProgress;
