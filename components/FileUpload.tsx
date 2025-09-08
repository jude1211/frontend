import React, { useState, useRef } from 'react';
import { apiService } from '../services/api';

interface FileUploadProps {
  onUploadSuccess: (fileData: FileUploadResult) => void;
  onUploadError: (error: string) => void;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  multiple?: boolean;
  folder?: string;
  category?: string;
  className?: string;
  disabled?: boolean;
}

interface FileUploadResult {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  format?: string;
  width?: number;
  height?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  folder = 'booknview',
  category = 'other',
  className = '',
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }

    // Check file size
    if (file.size > maxSize) {
      return `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`;
    }

    return null;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files);
      
      // Validate all files first
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          onUploadError(error);
          return;
        }
      }

      // Upload files
      const formData = new FormData();
      fileArray.forEach((file, index) => {
        formData.append(multiple ? 'files' : 'file', file);
      });
      formData.append('folder', folder);
      formData.append('type', 'auto');

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const response = await apiService.makeRequest('/upload/single', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        const fileData = response.data;
        onUploadSuccess(fileData);
      } else {
        onUploadError(response.error || 'Upload failed');
      }

    } catch (error: any) {
      console.error('File upload error:', error);
      onUploadError(error.response?.data?.error || error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    if (!multiple && files.length > 1) {
      onUploadError('Only one file can be uploaded at a time');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate all files first
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          onUploadError(error);
          return;
        }
      }

      // Upload files
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(multiple ? 'files' : 'file', file);
      });
      formData.append('folder', folder);
      formData.append('type', 'auto');

      const response = await apiService.makeRequest('/upload/single', {
        method: 'POST',
        body: formData
      });

      if (response.success) {
        const fileData = response.data;
        onUploadSuccess(fileData);
      } else {
        onUploadError(response.error || 'Upload failed');
      }

    } catch (error: any) {
      console.error('File upload error:', error);
      onUploadError(error.response?.data?.error || error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const openFileDialog = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={`upload-area ${isUploading ? 'uploading' : ''} ${disabled ? 'disabled' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          style={{ display: 'none' }}
        />
        
        {isUploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <h3>Drop files here or click to upload</h3>
            <p>Supported formats: {allowedTypes.map(type => type.split('/')[1]).join(', ')}</p>
            <p>Maximum size: {(maxSize / 1024 / 1024).toFixed(2)}MB</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .file-upload {
          width: 100%;
        }

        .upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #f9fafb;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-area:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .upload-area.uploading {
          border-color: #10b981;
          background-color: #ecfdf5;
        }

        .upload-area.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .upload-icon {
          color: #6b7280;
        }

        .upload-area:hover .upload-icon {
          color: #3b82f6;
        }

        .upload-area h3 {
          margin: 0;
          color: #374151;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .upload-area p {
          margin: 0.5rem 0 0 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .upload-progress {
          width: 100%;
          max-width: 300px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .progress-fill {
          height: 100%;
          background-color: #10b981;
          transition: width 0.3s ease;
        }

        .upload-progress p {
          margin: 0;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default FileUpload; 