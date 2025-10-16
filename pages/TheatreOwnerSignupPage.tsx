import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import BookNViewLoader from '../components/BookNViewLoader';
import { apiService } from '../services/api';

// Cloudinary config (read from Vite env; fallback to known safe defaults if provided)
const CLOUD_NAME = (import.meta as any)?.env?.VITE_CLOUDINARY_CLOUD_NAME || 'dslj1txvj';
const UNSIGNED_PRESET = (import.meta as any)?.env?.VITE_CLOUDINARY_UNSIGNED_PRESET || 'booknview';

// Minimal client-side uploader for unsigned Cloudinary uploads
async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', UNSIGNED_PRESET);
  if (folder) data.append('folder', folder);

  const res = await fetch(endpoint, { method: 'POST', body: data });
  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.message || json?.message || 'Cloudinary upload failed';
    throw new Error(message);
  }
  return json.secure_url as string;
}

interface SeatClassConfig {
  label: string;
  price: string;
}

interface ScreenDetails {
  screenNumber: number;
  seatingCapacity: string;
  seatLayout: string;
  baseTicketPrice: string;
  premiumPrice: string;
  vipPrice: string;
  rows?: string;
  columns?: string;
  aisleColumns?: string; // comma-separated list of aisle/gap column indexes
  seatClasses?: SeatClassConfig[]; // e.g., Gold/Silver/Balcony with price
  seatingLayoutFiles?: File[];
  ticketPricingFiles?: File[];
}

interface TheatreOwnerFormData {
  name: string;
  email: string;
  phone: string;
  theatreName: string;
  theatreType: string;
  location: string;
  description: string;
  screenCount: string;
  seatingCapacity: string;
  screens: ScreenDetails[];
  businessLicense: File[];
  nocPermission: File[];
  // Removed global Theatre Infrastructure uploads
  internetConnectivity: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

// Error map keyed by form fields with human-readable messages
type FormErrors = { [K in keyof TheatreOwnerFormData]?: string } & { screens?: string };

// Add a helper component for attractive file upload with clear selected-state
const FileUpload: React.FC<{
  label: string;
  name: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  files?: File[];
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}> = ({ label, name, error, onChange, accept, files = [], onBlur }) => (
  <div className="mb-4">
    <label className="block text-white font-semibold mb-2">{label}</label>
    <div
      className={
        `relative border-2 border-dashed rounded-xl bg-brand-dark flex flex-col items-center justify-center p-6 transition-all hover:border-4 ` +
        (files?.length > 0 ? 'border-green-500 hover:border-green-500/80' : 'border-brand-red hover:border-brand-red/80')
      }
    >
      {files?.length > 0 ? (
        <>
          <div className="absolute top-3 right-3 flex items-center text-green-400">
            <i className="fas fa-check-circle mr-2"></i>
            <span className="text-xs font-semibold">Selected</span>
          </div>
          <i className="fas fa-file-upload text-3xl text-green-400 mb-2"></i>
          <span className="text-green-300 mb-1 font-semibold">{files.length} file{files.length > 1 ? 's' : ''} selected</span>
          <span className="text-brand-light-gray text-xs">Click to change</span>
        </>
      ) : (
        <>
          <i className="fas fa-cloud-upload-alt text-3xl text-brand-red mb-2"></i>
          <span className="text-brand-light-gray mb-2">Drag & drop files here or click to select</span>
        </>
      )}
      <input
        type="file"
        name={name}
        accept={accept}
        multiple
        onChange={onChange}
        onBlur={onBlur}
        className="absolute inset-0 opacity-0 cursor-pointer"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
  </div>
);

const TheatreOwnerSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TheatreOwnerFormData>({
    name: '',
    email: '',
    phone: '',
    theatreName: '',
    theatreType: '',
    location: '',
    description: '',
    screenCount: '',
    seatingCapacity: '',
    screens: [],
    businessLicense: [],
    nocPermission: [],
    internetConnectivity: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<{ field?: string; msg?: string }[] | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
    };
  }, [emailCheckTimeout]);

  // Check email availability with debouncing
  const checkEmailAvailability = async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return;
    }

    setEmailChecking(true);
    try {
      const response = await apiService.checkTheatreOwnerEmail(email);
      if (response.success && response.data) {
        if (response.data.exists) {
          setErrors(prev => ({
            ...prev,
            email: 'This email is already registered. Please use a different email address.'
          }));
        } else {
          // Clear email error if it was previously set for existence
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.email && newErrors.email.includes('already registered')) {
              delete newErrors.email;
            }
            return newErrors;
          });
        }
      }
    } catch (error) {
      console.error('Email check error:', error);
      // Don't set error for network issues, just log
    } finally {
      setEmailChecking(false);
    }
  };

  // Update handleInputChange to validate field on change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name === 'screenCount') {
      const screenCount = parseInt(value);
      const newScreens: ScreenDetails[] = [];
      
      for (let i = 1; i <= screenCount; i++) {
        newScreens.push({
          screenNumber: i,
          seatingCapacity: '0', // Will be auto-calculated when rows/columns are entered
          seatLayout: 'Standard (Rows A-Z)',
          baseTicketPrice: '200',
          premiumPrice: '300',
          vipPrice: '500',
          rows: '',
          columns: '',
          aisleColumns: '',
          seatClasses: [
            { label: 'Gold', price: '250' },
            { label: 'Silver', price: '180' },
            { label: 'Balcony', price: '320' }
          ],
          seatingLayoutFiles: [],
          ticketPricingFiles: []
        });
      }
      
      setFormData(prev => ({
        ...prev,
        screenCount: value,
        screens: newScreens,
        seatingCapacity: '0' // Will be auto-calculated when screen details are filled
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    validateField(name, type === 'checkbox' ? checked : value);

    // Handle email validation with debouncing
    if (name === 'email') {
      // Clear previous timeout
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
      
      // Set new timeout for debounced email check
      const timeout = setTimeout(() => {
        checkEmailAvailability(value);
      }, 1000); // 1 second delay
      
      setEmailCheckTimeout(timeout);
    }
  };

  // Handle screen details changes
  const handleScreenChange = (screenIndex: number, field: keyof ScreenDetails, value: string) => {
    setFormData(prev => {
      const newScreens = [...prev.screens];
      newScreens[screenIndex] = {
        ...newScreens[screenIndex],
        [field]: value
      };
      
      // Auto-generate individual screen seating capacity when rows or columns change
      if (field === 'rows' || field === 'columns') {
        const rows = parseInt(newScreens[screenIndex].rows || '0');
        const cols = parseInt(newScreens[screenIndex].columns || '0');
        if (rows > 0 && cols > 0) {
          // Auto-calculate seating capacity: rows * columns
          newScreens[screenIndex].seatingCapacity = (rows * cols).toString();
        }
      }
      
      // Update total seating capacity
      const totalCapacity = newScreens.reduce((total, screen) => {
        // If rows/columns provided, use rows*columns as capacity; aisles are just visual gaps
        const rows = parseInt(screen.rows || '0');
        const cols = parseInt(screen.columns || '0');
        let base = 0;
        if (rows > 0 && cols > 0) {
          // Total capacity is simply rows * columns
          // Aisles are visual gaps and don't reduce actual seat capacity
          base = rows * cols;
        } else {
          base = parseInt(screen.seatingCapacity) || 0;
        }
        return total + base;
      }, 0);
      
      return {
        ...prev,
        screens: newScreens,
        seatingCapacity: totalCapacity.toString()
      };
    });
  };

  // Update handleFileChange to validate field on change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files) return;
    setFormData(prev => ({
      ...prev,
      [name]: Array.from(files)
    }));
    if (errors[name as keyof TheatreOwnerFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle per-screen file uploads
  const handleScreenFileChange = (
    screenIndex: number,
    field: 'seatingLayoutFiles' | 'ticketPricingFiles',
    filesList: FileList | null
  ) => {
    if (!filesList) return;
    const files = Array.from(filesList);
    const typeError = validateFileTypes(files, field);
    if (typeError) return;
    setFormData(prev => {
      const updatedScreens = [...prev.screens];
      const updated = { ...updatedScreens[screenIndex] } as ScreenDetails;
      updated[field] = files;
      updatedScreens[screenIndex] = updated;
      return { ...prev, screens: updatedScreens };
    });
  };

  // Validate selected files for each upload field
  const validateFileTypes = (files: File[], fieldName: string): string | undefined => {
    if (!files || files.length === 0) return 'File is required';

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    const maxBytes = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return 'Only PDF, PNG, or JPEG files are allowed';
      }
      if (file.size > maxBytes) {
        return 'File size must be 10MB or less';
      }
    }

    return undefined;
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const values = Array.from(options).filter(o => o.selected).map(o => o.value);
    setFormData(prev => ({
      ...prev,
      [name]: values
    }));
  };

  // Add validateField function for single field validation
  const validateField = (name: string, value: any) => {
    let error: string | undefined;
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Name is required';
        else if (!/^[A-Za-z\s]+$/.test(value)) error = 'Name can only contain letters and spaces';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email is invalid';
        break;
      case 'phone':
        if (!value.trim()) error = 'Phone number is required';
        else if (!/^[6-9]\d{9}$/.test(value)) error = 'Enter a valid 10-digit Indian phone number';
        break;
      case 'theatreName':
        if (!value.trim()) error = 'Theatre name is required';
        break;
      case 'theatreType':
        if (!value) error = 'Theatre type is required';
        break;
      case 'location':
        if (!value.trim()) error = 'Location is required';
        break;
      case 'description':
        if (!value.trim()) error = 'Description is required';
        break;
      case 'screenCount':
        if (!value) error = 'Number of screens is required';
        break;
      case 'seatingCapacity':
        if (!value) error = 'Seating capacity is required';
        break;
      case 'screens':
        // Validate each screen's details
        if (value && value.length > 0) {
          value.forEach((screen: ScreenDetails, index: number) => {
            if (!screen.screenNumber) error = 'Screen number is required for each screen';
            if (!screen.seatingCapacity) error = 'Seating capacity is required for each screen';
            if (!screen.seatLayout) error = 'Seat layout is required for each screen';
            if (!screen.baseTicketPrice) error = 'Base ticket price is required for each screen';
            if (!screen.premiumPrice) error = 'Premium price is required for each screen';
            if (!screen.vipPrice) error = 'VIP price is required for each screen';
          });
        }
        break;
      case 'businessLicense':
      case 'nocPermission':
      // removed global 'seatingLayout' and 'ticketPricing'
        // Optional now; validate only if provided
        if (value && value.length > 0) {
          error = validateFileTypes(value, name);
        }
        break;
      case 'internetConnectivity':
        if (!value.trim()) error = 'Internet connectivity info is required';
        break;
      case 'password':
        // Optional now; validate only if provided
        if (value && value.length < 6) error = 'Password must be at least 6 characters';
        break;
      case 'confirmPassword':
        // Optional now; validate only if provided
        if (value && value !== formData.password) error = 'Passwords do not match';
        break;
      case 'termsAccepted':
        if (!value) error = 'You must accept the terms and conditions';
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    else if (errors.email && errors.email.includes('already registered')) {
      newErrors.email = errors.email; // Keep the existing error if email is already taken
    }
    
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Enter a valid 10-digit Indian phone number';
    
    if (!formData.theatreName.trim()) newErrors.theatreName = 'Theatre name is required';
    if (!formData.theatreType) newErrors.theatreType = 'Theatre type is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.screenCount) newErrors.screenCount = 'Number of screens is required';
    if (!formData.seatingCapacity) newErrors.seatingCapacity = 'Seating capacity is required';
    if (!formData.screens || formData.screens.length === 0) newErrors.screens = 'At least one screen is required';
    if (formData.screens && formData.screens.length > 0) {
      formData.screens.forEach((screen, index) => {
        if (!screen.screenNumber) newErrors.screens = 'Screen number is required for each screen';
        if (!screen.seatingCapacity) newErrors.screens = 'Seating capacity is required for each screen';
        if (!screen.seatLayout) newErrors.screens = 'Seat layout is required for each screen';
        if (!screen.baseTicketPrice) newErrors.screens = 'Base ticket price is required for each screen';
        if (!screen.premiumPrice) newErrors.screens = 'Premium price is required for each screen';
        if (!screen.vipPrice) newErrors.screens = 'VIP price is required for each screen';
      });
    }
    
    // Uploads are optional now
    if (!formData.internetConnectivity.trim()) newErrors.internetConnectivity = 'Internet connectivity info is required';
    
    // Password fields are optional now
    if (formData.password && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildMultipartForm = (
    urlPayload?: {
      businessLicenseUrls?: string[];
      nocPermissionUrls?: string[];
      seatingLayoutUrls?: string[];
      ticketPricingUrls?: string[];
    }
  ): FormData => {
    const form = new FormData();
    form.append('name', formData.name);
    form.append('email', formData.email);
    form.append('phone', formData.phone);
    form.append('theatreName', formData.theatreName);
    form.append('theatreType', formData.theatreType);
    form.append('location', formData.location);
    form.append('description', formData.description);
    form.append('screenCount', formData.screenCount);
    form.append('seatingCapacity', formData.seatingCapacity);
    form.append('internetConnectivity', formData.internetConnectivity || 'broadband');
    form.append('termsAccepted', String(formData.termsAccepted));
    form.append('screens', JSON.stringify(formData.screens || []));

    if (urlPayload) {
      if (urlPayload.businessLicenseUrls) {
        form.append('businessLicenseUrls', JSON.stringify(urlPayload.businessLicenseUrls));
      }
      if (urlPayload.nocPermissionUrls) {
        form.append('nocPermissionUrls', JSON.stringify(urlPayload.nocPermissionUrls));
      }
      if (urlPayload.seatingLayoutUrls) {
        form.append('seatingLayoutUrls', JSON.stringify(urlPayload.seatingLayoutUrls));
      }
      if (urlPayload.ticketPricingUrls) {
        form.append('ticketPricingUrls', JSON.stringify(urlPayload.ticketPricingUrls));
      }
    }

    return form;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (emailChecking) {
      setSubmissionError('Please wait while we verify your email address.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionDetails(null);

    try {
      // Fail fast if Cloudinary env missing
      if (!CLOUD_NAME || !UNSIGNED_PRESET) {
        throw new Error('Cloudinary config missing. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UNSIGNED_PRESET.');
      }

      // Upload all selected files to Cloudinary first
      const folder = 'booknview/theatre-applications';
      const businessLicenseUrls: string[] = [];
      const nocPermissionUrls: string[] = [];
      const seatingLayoutUrls: string[] = [];
      const ticketPricingUrls: string[] = [];

      for (const f of formData.businessLicense || []) {
        businessLicenseUrls.push(await uploadToCloudinary(f, folder));
      }
      for (const f of formData.nocPermission || []) {
        nocPermissionUrls.push(await uploadToCloudinary(f, folder));
      }
      for (const screen of formData.screens || []) {
        for (const f of screen.seatingLayoutFiles || []) {
          seatingLayoutUrls.push(await uploadToCloudinary(f, folder));
        }
        for (const f of screen.ticketPricingFiles || []) {
          ticketPricingUrls.push(await uploadToCloudinary(f, folder));
        }
      }

      const multipart = buildMultipartForm({
        businessLicenseUrls,
        nocPermissionUrls,
        seatingLayoutUrls,
        ticketPricingUrls
      });

      // Debug: log outgoing multipart fields
      try {
        const debugOut: Record<string, any> = {};
        multipart.forEach((v, k) => {
          if (typeof v === 'string') {
            debugOut[k] = v.length > 200 ? v.substring(0, 200) + '…' : v;
          } else {
            debugOut[k] = '[Blob/File]';
          }
        });
        console.log('🧪 Submitting owner application fields:', debugOut);
      } catch {}

      const res = await apiService.createTheatreOwnerApplicationMultipart(multipart);
      if (res.success) {
        setIsSubmitting(false);
        setIsSubmitted(true);
      } else {
        throw new Error(res.error || res.message || 'Submission failed');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
      setSubmissionError(err?.message || 'Failed to submit application');
      if (err?.details || err?.data?.details) {
        const details = err.details || err.data.details;
        if (Array.isArray(details)) {
          console.table(details);
          setSubmissionDetails(details);
          alert('Validation errors on server. Please review highlighted issues in the banner.');
        }
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray flex items-center justify-center">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 max-w-md mx-auto text-center shadow-2xl border-2 border-green-200">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check text-white text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-4">Request Successful!</h2>
          <p className="text-green-700 mb-6 text-lg">
            Your request successful. Further details are sent to your mail.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray">
      {/* Header */}
      <div className="bg-brand-gray border-b border-brand-dark/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center">
                <i className="fas fa-film text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Theatre Owner Signup</h1>
                <p className="text-brand-light-gray">Partner with BookNView and showcase your movies</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="text-brand-light-gray hover:text-white transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Home
            </button>
          </div>
          {submissionError && (
            <div className="mt-4 bg-red-600/20 border border-red-600 text-red-300 px-4 py-3 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <i className="fas fa-exclamation-triangle mr-2 mt-0.5"></i>
                  <div>
                    <div className="font-semibold">Failed to submit</div>
                    <div className="mt-1 text-sm">{submissionError}</div>
                    {submissionDetails && submissionDetails.length > 0 && (
                      <div className="mt-3">
                        <div className="font-semibold text-red-200 mb-1">Details:</div>
                        <ul className="list-disc pl-5 space-y-1">
                          {submissionDetails.map((d, idx) => (
                            <li key={idx} className="text-sm">
                              <span className="font-semibold">{d.field}</span>: {d.msg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-3xl p-8 border border-brand-dark/40 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">List Your Theatre</h2>
              <p className="text-brand-light-gray text-lg">
                Partner with BookNView and reach millions of movie lovers. Showcase your theatre and movies to a wider audience.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="bg-brand-dark rounded-2xl p-6 border border-brand-dark/30">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <i className="fas fa-user mr-3 text-brand-red"></i>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={() => validateField('name', formData.name)}
                      onKeyPress={e => {
                        if (!/[A-Za-z\s]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all ${
                        errors.name ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => validateField('email', formData.email)}
                        className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all pr-12 ${
                          errors.email ? 'border-red-500' : emailChecking ? 'border-yellow-500' : 'border-brand-dark/30'
                        }`}
                        placeholder="your@email.com"
                      />
                      {emailChecking && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {!emailChecking && formData.email && !errors.email && /\S+@\S+\.\S+/.test(formData.email) && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <i className="fas fa-check-circle text-green-400 text-lg"></i>
                        </div>
                      )}
                    </div>
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                    {emailChecking && (
                      <p className="text-yellow-400 text-sm mt-1 flex items-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Checking email availability...
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={() => validateField('phone', formData.phone)}
                      maxLength={10}
                      onKeyPress={e => {
                        if (!/[0-9]/.test(e.key) || e.currentTarget.value.length >= 10) {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all ${
                        errors.phone ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Theatre Information */}
              <div className="bg-brand-dark rounded-2xl p-6 border border-brand-dark/30">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <i className="fas fa-film mr-3 text-brand-red"></i>
                  Theatre Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Theatre Name *
                    </label>
                    <input
                      type="text"
                      name="theatreName"
                      value={formData.theatreName}
                      onChange={handleInputChange}
                      onBlur={() => validateField('theatreName', formData.theatreName)}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all ${
                        errors.theatreName ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                      placeholder="Your theatre name"
                    />
                    {errors.theatreName && <p className="text-red-400 text-sm mt-1">{errors.theatreName}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Theatre Type *
                    </label>
                    <select
                      name="theatreType"
                      value={formData.theatreType}
                      onChange={handleInputChange}
                      onBlur={() => validateField('theatreType', formData.theatreType)}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-red transition-all ${
                        errors.theatreType ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                    >
                      <option value="">Select theatre type</option>
                      <option value="multiplex">Multiplex</option>
                      <option value="single-screen">Single Screen</option>
                      <option value="drive-in">Drive-in Theatre</option>
                      <option value="outdoor">Outdoor Theatre</option>
                      <option value="premium">Premium Theatre</option>
                      <option value="imax">IMAX Theatre</option>
                      <option value="4dx">4DX Theatre</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.theatreType && <p className="text-red-400 text-sm mt-1">{errors.theatreType}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      onBlur={() => validateField('location', formData.location)}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all ${
                        errors.location ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                      placeholder="City, State"
                    />
                    {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Number of Screens *
                    </label>
                    <select
                      name="screenCount"
                      value={formData.screenCount}
                      onChange={handleInputChange}
                      onBlur={() => validateField('screenCount', formData.screenCount)}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-red transition-all ${
                        errors.screenCount ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                    >
                      <option value="">Select number of screens</option>
                      <option value="1">1 Screen</option>
                      <option value="2">2 Screens</option>
                      <option value="3">3 Screens</option>
                      <option value="4">4 Screens</option>
                      <option value="5">5 Screens</option>
                      <option value="6-10">6-10 Screens</option>
                      <option value="10+">10+ Screens</option>
                    </select>
                    {errors.screenCount && <p className="text-red-400 text-sm mt-1">{errors.screenCount}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Total Seating Capacity *
                    </label>
                    <input
                      type="number"
                      name="seatingCapacity"
                      value={formData.seatingCapacity}
                      onChange={handleInputChange}
                      onBlur={() => validateField('seatingCapacity', formData.seatingCapacity)}
                      placeholder="Enter total seating capacity"
                      min="1"
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all ${
                        errors.seatingCapacity ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                    />
                    <p className="text-brand-light-gray text-xs mt-1">This will be automatically calculated based on individual screen capacities</p>
                    {errors.seatingCapacity && <p className="text-red-400 text-sm mt-1">{errors.seatingCapacity}</p>}
                  </div>
                </div>

                </div>

                {/* Screen Details Section */}
                {formData.screens.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <i className="fas fa-desktop mr-2 text-brand-red"></i>
                      Screen Details
                    </h3>
                    <div className="mb-4 p-3 bg-brand-dark/30 rounded-lg border border-brand-dark/50">
                      <p className="text-brand-light-gray text-sm">
                        <i className="fas fa-info-circle mr-2 text-brand-red"></i>
                        <strong>Layout Guide:</strong> 
                        {formData.screens.length === 1 && ' Choose the best layout for your single screen theatre.'}
                        {formData.screens.length === 2 && ' Screen 1 is typically your main screen, Screen 2 for premium experiences.'}
                        {formData.screens.length === 3 && ' Screen 1: Main, Screen 2: Premium, Screen 3: VIP/4DX.'}
                        {formData.screens.length >= 4 && ' Configure each screen based on your theatre\'s target audience and premium offerings.'}
                      </p>
                    </div>
                    <div className="space-y-6">
                      {formData.screens.map((screen, index) => (
                        <div key={index} className="bg-brand-dark/50 rounded-xl p-4 border border-brand-dark/30">
                          <h4 className="text-white font-semibold mb-4 flex items-center">
                            <i className="fas fa-desktop mr-2 text-brand-red"></i>
                            Screen {screen.screenNumber}
                            {formData.screens.length === 3 && (
                              <span className="ml-2 text-sm text-brand-light-gray">
                                {index === 0 ? '(Main Screen)' : index === 1 ? '(Premium Screen)' : '(VIP Screen)'}
                              </span>
                            )}
                            {formData.screens.length === 2 && (
                              <span className="ml-2 text-sm text-brand-light-gray">
                                {index === 0 ? '(Main Screen)' : '(Premium Screen)'}
                              </span>
                            )}
                            {formData.screens.length === 1 && (
                              <span className="ml-2 text-sm text-brand-light-gray">(Single Screen)</span>
                            )}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-white text-sm mb-2">Number of Rows *</label>
                              <input
                                type="number"
                                value={screen.rows || ''}
                                onChange={(e) => handleScreenChange(index, 'rows', e.target.value)}
                                placeholder="e.g., 12"
                                min="1"
                                className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red"
                              />
                            </div>
                            <div>
                              <label className="block text-white text-sm mb-2">Columns per Row *</label>
                              <input
                                type="number"
                                value={screen.columns || ''}
                                onChange={(e) => handleScreenChange(index, 'columns', e.target.value)}
                                placeholder="e.g., 18"
                                min="1"
                                className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red"
                              />
                            </div>
                            <div>
                              <label className="block text-white text-sm mb-2">Aisle/Gaps Columns (comma-separated)</label>
                              <input
                                type="text"
                                value={screen.aisleColumns || ''}
                                onChange={(e) => handleScreenChange(index, 'aisleColumns', e.target.value)}
                                placeholder="e.g., 5, 10"
                                className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red"
                              />
                              <p className="text-brand-light-gray text-xs mt-1">Specify column numbers to leave empty as aisles</p>
                            </div>
                            <div>
                              <label className="block text-white text-sm mb-2">
                                Seating Capacity * 
                                <span className="text-xs text-green-400 ml-1">(Auto-generated)</span>
                              </label>
                              <input
                                type="number"
                                value={screen.seatingCapacity}
                                readOnly
                                placeholder="e.g., 150"
                                min="1"
                                className="w-full px-3 py-2 bg-brand-dark/50 border border-brand-dark/30 rounded-lg text-white placeholder-brand-light-gray cursor-not-allowed opacity-75"
                                title="Seating capacity is automatically calculated from rows × columns"
                              />
                            </div>
                            <div>
                              <label className="block text-white text-sm mb-2">Seat Layout *</label>
                              <select
                                value={screen.seatLayout}
                                onChange={(e) => handleScreenChange(index, 'seatLayout', e.target.value)}
                                className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
                              >
                                <option value="">Select layout</option>
                                {formData.screens.length === 1 && (
                                  <>
                                    <option value="Standard">Standard (Rows A-Z)</option>
                                    <option value="Premium">Premium (Recliner)</option>
                                    <option value="VIP">VIP (Sofa)</option>
                                    <option value="IMAX">IMAX</option>
                                    <option value="4DX">4DX</option>
                                    <option value="Dolby Atmos">Dolby Atmos</option>
                                  </>
                                )}
                                {formData.screens.length === 2 && (
                                  <>
                                    {index === 0 && (
                                      <>
                                        <option value="Standard">Standard (Rows A-Z)</option>
                                        <option value="Premium">Premium (Recliner)</option>
                                        <option value="IMAX">IMAX</option>
                                      </>
                                    )}
                                    {index === 1 && (
                                      <>
                                        <option value="Premium">Premium (Recliner)</option>
                                        <option value="VIP">VIP (Sofa)</option>
                                        <option value="4DX">4DX</option>
                                        <option value="Dolby Atmos">Dolby Atmos</option>
                                      </>
                                    )}
                                  </>
                                )}
                                {formData.screens.length === 3 && (
                                  <>
                                    {index === 0 && (
                                      <>
                                        <option value="Standard">Standard (Rows A-Z)</option>
                                        <option value="Premium">Premium (Recliner)</option>
                                        <option value="IMAX">IMAX</option>
                                      </>
                                    )}
                                    {index === 1 && (
                                      <>
                                        <option value="Premium">Premium (Recliner)</option>
                                        <option value="VIP">VIP (Sofa)</option>
                                        <option value="4DX">4DX</option>
                                      </>
                                    )}
                                    {index === 2 && (
                                      <>
                                        <option value="VIP">VIP (Sofa)</option>
                                        <option value="4DX">4DX</option>
                                        <option value="Dolby Atmos">Dolby Atmos</option>
                                        <option value="Premium">Premium (Recliner)</option>
                                      </>
                                    )}
                                  </>
                                )}
                                {formData.screens.length >= 4 && (
                                  <>
                                    {index === 0 && (
                                      <>
                                        <option value="Standard">Standard (Rows A-Z)</option>
                                        <option value="Premium">Premium (Recliner)</option>
                                      </>
                                    )}
                                    {index === 1 && (
                                      <>
                                        <option value="Premium">Premium (Recliner)</option>
                                        <option value="Standard">Standard (Rows A-Z)</option>
                                      </>
                                    )}
                                    {index === 2 && (
                                      <>
                                        <option value="VIP">VIP (Sofa)</option>
                                        <option value="Premium">Premium (Recliner)</option>
                                      </>
                                    )}
                                    {index === 3 && (
                                      <>
                                        <option value="4DX">4DX</option>
                                        <option value="IMAX">IMAX</option>
                                        <option value="Dolby Atmos">Dolby Atmos</option>
                                      </>
                                    )}
                                    {index >= 4 && (
                                      <>
                                        <option value="Standard">Standard (Rows A-Z)</option>
                                        <option value="Premium">Premium (Recliner)</option>
                                        <option value="VIP">VIP (Sofa)</option>
                                      </>
                                    )}
                                  </>
                                )}
                              </select>
                            </div>
                            <div>
                              <label className="block text-white text-sm mb-2">
                                Base Ticket Price (₹) *
                                {screen.seatLayout && (
                                  <span className="ml-2 text-xs text-brand-light-gray">
                                    {screen.seatLayout === 'Standard' && '(Suggested: 150-250)'}
                                    {screen.seatLayout === 'Premium' && '(Suggested: 250-400)'}
                                    {screen.seatLayout === 'VIP' && '(Suggested: 400-600)'}
                                    {screen.seatLayout === 'IMAX' && '(Suggested: 300-500)'}
                                    {screen.seatLayout === '4DX' && '(Suggested: 400-700)'}
                                    {screen.seatLayout === 'Dolby Atmos' && '(Suggested: 250-450)'}
                                  </span>
                                )}
                              </label>
                              <input
                                type="number"
                                value={screen.baseTicketPrice}
                                onChange={(e) => handleScreenChange(index, 'baseTicketPrice', e.target.value)}
                                placeholder="e.g., 200"
                                min="0"
                                className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red"
                              />
                            </div>
                            <div>
                              <label className="block text-white text-sm mb-2">Premium Price (₹) *</label>
                              <input
                                type="number"
                                value={screen.premiumPrice}
                                onChange={(e) => handleScreenChange(index, 'premiumPrice', e.target.value)}
                                placeholder="e.g., 300"
                                min="0"
                                className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red"
                              />
                            </div>
                            <div>
                              <label className="block text-white text-sm mb-2">VIP Price (₹) *</label>
                              <input
                                type="number"
                                value={screen.vipPrice}
                                onChange={(e) => handleScreenChange(index, 'vipPrice', e.target.value)}
                                placeholder="e.g., 500"
                                min="0"
                                className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {/* Seat Classes Configuration */}
                            <div className="md:col-span-2">
                              <label className="block text-white text-sm mb-2">Seat Classes & Pricing</label>
                              <div className="space-y-3">
                                {(screen.seatClasses || []).map((cls, clsIdx) => (
                                  <div key={clsIdx} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      value={cls.label}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData(prev => {
                                          const newScreens = [...prev.screens];
                                          const sc = [...(newScreens[index].seatClasses || [])];
                                          sc[clsIdx] = { ...sc[clsIdx], label: value };
                                          newScreens[index] = { ...newScreens[index], seatClasses: sc };
                                          return { ...prev, screens: newScreens };
                                        });
                                      }}
                                      placeholder="Class label e.g., Gold"
                                      className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red"
                                    />
                                    <input
                                      type="number"
                                      value={cls.price}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData(prev => {
                                          const newScreens = [...prev.screens];
                                          const sc = [...(newScreens[index].seatClasses || [])];
                                          sc[clsIdx] = { ...sc[clsIdx], price: value };
                                          newScreens[index] = { ...newScreens[index], seatClasses: sc };
                                          return { ...prev, screens: newScreens };
                                        });
                                      }}
                                      placeholder="Price e.g., 200"
                                      min="0"
                                      className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red"
                                    />
                                  </div>
                                ))}
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => {
                                        const newScreens = [...prev.screens];
                                        const sc = [...(newScreens[index].seatClasses || [])];
                                        sc.push({ label: '', price: '' });
                                        newScreens[index] = { ...newScreens[index], seatClasses: sc };
                                        return { ...prev, screens: newScreens };
                                      });
                                    }}
                                    className="px-3 py-2 bg-brand-red text-white rounded-lg text-sm hover:bg-red-700"
                                  >
                                    Add Class
                                  </button>
                                  {(screen.seatClasses || []).length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => {
                                          const newScreens = [...prev.screens];
                                          const sc = [...(newScreens[index].seatClasses || [])];
                                          sc.pop();
                                          newScreens[index] = { ...newScreens[index], seatClasses: sc };
                                          return { ...prev, screens: newScreens };
                                        });
                                      }}
                                      className="px-3 py-2 bg-brand-dark text-white border border-brand-dark/40 rounded-lg text-sm hover:bg-brand-dark/70"
                                    >
                                      Remove Last
                                    </button>
                                  )}
                                </div>
                                <p className="text-brand-light-gray text-xs">Define custom classes like Gold, Silver, Balcony with pricing.</p>
                              </div>
                            </div>
                            <div>
                              <FileUpload
                                label={`Seating Layout/Diagram (Screen ${screen.screenNumber})`}
                                name={`screen-${index}-seatingLayout`}
                                accept="application/pdf,image/png,image/jpeg"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  handleScreenFileChange(index, 'seatingLayoutFiles', e.target.files)
                                }
                                files={screen.seatingLayoutFiles || []}
                              />
                              {screen.seatingLayoutFiles && screen.seatingLayoutFiles.length > 0 && (
                                <ul className="text-brand-light-gray text-xs mt-2">
                                  {screen.seatingLayoutFiles.map((file, idx) => (
                                    <li key={idx}>{file.name}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div>
                              <FileUpload
                                label={`Ticket Pricing Structure (Screen ${screen.screenNumber})`}
                                name={`screen-${index}-ticketPricing`}
                                accept="application/pdf,image/png,image/jpeg"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  handleScreenFileChange(index, 'ticketPricingFiles', e.target.files)
                                }
                                files={screen.ticketPricingFiles || []}
                              />
                              {screen.ticketPricingFiles && screen.ticketPricingFiles.length > 0 && (
                                <ul className="text-brand-light-gray text-xs mt-2">
                                  {screen.ticketPricingFiles.map((file, idx) => (
                                    <li key={idx}>{file.name}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.screens && <p className="text-red-400 text-sm mt-2">{errors.screens}</p>}
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-white font-semibold mb-2">
                    Theatre Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    onBlur={() => validateField('description', formData.description)}
                    rows={4}
                    className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all resize-none ${
                      errors.description ? 'border-red-500' : 'border-brand-dark/30'
                    }`}
                    placeholder="Tell us about your theatre, its unique features, amenities, and why movie lovers should visit..."
                  ></textarea>
                  {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              </div>

              {/* Proof of Operation */}
              <div className="bg-brand-dark rounded-2xl p-6 border border-brand-dark/30">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <i className="fas fa-file-alt mr-3 text-brand-red"></i>
                  Proof of Operation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FileUpload
                      label="Business Registration License (GST/Local Certificate) *"
                      name="businessLicense"
                      accept="application/pdf,image/png,image/jpeg"
                      error={errors.businessLicense}
                      onChange={handleFileChange}
                      files={formData.businessLicense}
                    />
                    {formData.businessLicense && formData.businessLicense.length > 0 && (
                      <ul className="text-brand-light-gray text-xs mt-2">
                        {formData.businessLicense.map((file, idx) => (
                          <li key={idx}>{file.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <FileUpload
                      label="NOC/Permission from Theatre Owner (if applicable) *"
                      name="nocPermission"
                      accept="application/pdf,image/png,image/jpeg"
                      error={errors.nocPermission}
                      onChange={handleFileChange}
                      files={formData.nocPermission}
                    />
                    {formData.nocPermission && formData.nocPermission.length > 0 && (
                      <ul className="text-brand-light-gray text-xs mt-2">
                        {formData.nocPermission.map((file, idx) => (
                          <li key={idx}>{file.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Technical Setup */}
              <div className="bg-brand-dark rounded-2xl p-6 border border-brand-dark/30">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <i className="fas fa-wifi mr-3 text-brand-red"></i>
                  Technical Setup
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Internet Connectivity (Preferred) *
                    </label>
                    <input
                      type="text"
                      name="internetConnectivity"
                      value={formData.internetConnectivity}
                      onChange={handleInputChange}
                      onBlur={() => validateField('internetConnectivity', formData.internetConnectivity)}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all ${errors.internetConnectivity ? 'border-red-500' : 'border-brand-dark/30'}`}
                      placeholder="Describe your internet setup (WiFi, broadband, etc.)"
                    />
                    {errors.internetConnectivity && <p className="text-red-400 text-sm mt-1">{errors.internetConnectivity}</p>}
                  </div>
                </div>
              </div>

              {/* Account Security */}
              <div className="bg-brand-dark rounded-2xl p-6 border border-brand-dark/30">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <i className="fas fa-shield-alt mr-3 text-brand-red"></i>
                  Account Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={() => validateField('password', formData.password)}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all ${
                        errors.password ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                      placeholder="Create a strong password"
                    />
                    {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all ${
                        errors.confirmPassword ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-brand-dark rounded-2xl p-6 border border-brand-dark/30">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    onBlur={() => validateField('termsAccepted', formData.termsAccepted)}
                    className="mt-1 w-5 h-5 text-brand-red bg-brand-dark border-brand-dark/30 rounded focus:ring-brand-red focus:ring-2"
                  />
                  <div>
                    <label className="text-white font-semibold">
                      I agree to the Terms and Conditions *
                    </label>
                    <p className="text-brand-light-gray text-sm mt-1">
                      By checking this box, you agree to our terms of service and privacy policy. You also consent to receive communications from BookNView regarding your theatre partnership and movie listings.
                    </p>
                    {errors.termsAccepted && <p className="text-red-400 text-sm mt-1">{errors.termsAccepted}</p>}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-3 text-brand-light-gray hover:text-white transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || emailChecking}
                  className="bg-gradient-to-r from-brand-red to-red-600 text-white px-8 py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : emailChecking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying Email...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-film"></i>
                      <span>Create Theatre Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheatreOwnerSignupPage; 