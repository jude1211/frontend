import React from 'react';

const FirebaseConfigChecker: React.FC = () => {
  const checkConfig = () => {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    console.log('Firebase Configuration Check:', config);
    
    const issues = [];
    
    if (!config.apiKey || config.apiKey.includes('your_firebase_api_key_here')) {
      issues.push('API Key is missing or using placeholder value');
    }
    
    if (!config.authDomain || config.authDomain.includes('your_project_id')) {
      issues.push('Auth Domain is missing or using placeholder value');
    }
    
    if (!config.projectId || config.projectId.includes('your_project_id_here')) {
      issues.push('Project ID is missing or using placeholder value');
    }
    
    if (!config.appId || config.appId.includes('your_app_id_here')) {
      issues.push('App ID is missing or using placeholder value');
    }

    if (issues.length > 0) {
      console.error('Firebase Configuration Issues:', issues);
    } else {
      console.log('Firebase configuration looks good!');
    }
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      zIndex: 9999,
      backgroundColor: '#f0f0f0',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px'
    }}>
      <button 
        onClick={checkConfig}
        style={{
          padding: '5px 10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Check Firebase Config
      </button>
    </div>
  );
};

export default FirebaseConfigChecker;
