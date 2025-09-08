import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import FileUpload from './FileUpload';

interface Document {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  publicId: string;
  uploadDate: string;
  category: string;
}

interface DocumentManagerProps {
  entityType: 'user' | 'theatre';
  entityId?: string;
  onDocumentsChange?: (documents: Document[]) => void;
  className?: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  entityType,
  entityId,
  onDocumentsChange,
  className = ''
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (entityId) {
      fetchDocuments();
    }
  }, [entityId]);

  const fetchDocuments = async () => {
    if (!entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = entityType === 'user' 
        ? '/users/documents' 
        : `/theatres/${entityId}/documents`;

      const response = await apiService.makeRequest(endpoint);

      if (response.success) {
        setDocuments(response.data);
        onDocumentsChange?.(response.data);
      } else {
        setError(response.error || 'Failed to fetch documents');
      }
    } catch (error: any) {
      console.error('Fetch documents error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = async (fileData: any) => {
    try {
      const endpoint = entityType === 'user' 
        ? '/users/documents' 
        : `/theatres/${entityId}/documents`;

      const documentData = {
        fileUrl: fileData.url,
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize,
        publicId: fileData.publicId,
        category: 'other'
      };

      const response = await apiService.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(documentData)
      });

      if (response.success) {
        const newDocument = response.data.document;
        setDocuments(prev => [...prev, newDocument]);
        onDocumentsChange?.([...documents, newDocument]);
        setShowUpload(false);
        setError(null);
      } else {
        setError(response.error || 'Failed to save document');
      }
    } catch (error: any) {
      console.error('Save document error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to save document');
    }
  };

  const handleUploadError = (error: string) => {
    setError(error);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const endpoint = entityType === 'user' 
        ? `/users/documents/${documentId}` 
        : `/theatres/${entityId}/documents/${documentId}`;

      const response = await apiService.makeRequest(endpoint, {
        method: 'DELETE'
      });

      if (response.success) {
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        onDocumentsChange?.(documents.filter(doc => doc._id !== documentId));
        setError(null);
      } else {
        setError(response.error || 'Failed to delete document');
      }
    } catch (error: any) {
      console.error('Delete document error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType === 'application/pdf') {
      return '📄';
    }
    return '📎';
  };

  const openDocument = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className={`document-manager ${className}`}>
      <div className="header">
        <h3>Documents</h3>
        <button 
          className="upload-btn"
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? 'Cancel' : 'Upload Document'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showUpload && (
        <div className="upload-section">
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']}
            maxSize={10 * 1024 * 1024} // 10MB
            multiple={false}
            folder="booknview"
          />
        </div>
      )}

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <p>No documents uploaded yet.</p>
          <button onClick={() => setShowUpload(true)}>
            Upload your first document
          </button>
        </div>
      ) : (
        <div className="documents-list">
          {documents.map((document) => (
            <div key={document._id} className="document-item">
              <div className="document-info" onClick={() => openDocument(document.fileUrl)}>
                <div className="document-icon">
                  {getFileIcon(document.fileType)}
                </div>
                <div className="document-details">
                  <h4>{document.fileName}</h4>
                  <p className="document-meta">
                    {formatFileSize(document.fileSize)} • {formatDate(document.uploadDate)}
                  </p>
                  <p className="document-category">
                    Category: {document.category}
                  </p>
                </div>
              </div>
              <div className="document-actions">
                <button 
                  className="view-btn"
                  onClick={() => openDocument(document.fileUrl)}
                  title="View document"
                >
                  👁️
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteDocument(document._id)}
                  title="Delete document"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .document-manager {
          width: 100%;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .header h3 {
          margin: 0;
          color: #374151;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .upload-btn {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .upload-btn:hover {
          background-color: #2563eb;
        }

        .error-message {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-message button {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          font-size: 1.25rem;
        }

        .upload-section {
          margin-bottom: 1rem;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          color: #6b7280;
        }

        .spinner {
          width: 2rem;
          height: 2rem;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .empty-state button {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 1rem;
        }

        .documents-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .document-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: white;
          transition: all 0.2s;
        }

        .document-item:hover {
          border-color: #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .document-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          cursor: pointer;
        }

        .document-icon {
          font-size: 2rem;
        }

        .document-details h4 {
          margin: 0 0 0.25rem 0;
          color: #374151;
          font-size: 1rem;
          font-weight: 600;
        }

        .document-meta {
          margin: 0 0 0.25rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .document-category {
          margin: 0;
          color: #9ca3af;
          font-size: 0.75rem;
          text-transform: capitalize;
        }

        .document-actions {
          display: flex;
          gap: 0.5rem;
        }

        .view-btn, .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .view-btn:hover {
          background-color: #eff6ff;
        }

        .delete-btn:hover {
          background-color: #fef2f2;
        }
      `}</style>
    </div>
  );
};

export default DocumentManager; 