import React, { useState, useRef } from 'react';
import PreviewModal from './PreviewModal';

const SPECIAL_MOMENT_PRICE: Record<string, { base: number; tax: number; total: number }> = {
  birthday:  { base: 50, tax: 9, total: 59 },
  moment:    { base: 50, tax: 9, total: 59 },
  valentine: { base: 50, tax: 9, total: 59 },
};

const API_BASE: string = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

interface BookingState {
  theatre: { _id: string; name: string; address: string } | null;
  showDate: string;
  screen: string;
  showtimeId: string;
  showTime: string;
  occasion: string;
  templateId: string;
  templateName: string;
  templatePreviewImage: string;
  templateFields?: string[];
  recipientName: string;
  senderName: string;
  message: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'none';
  totalAmount: number;
}

interface Props {
  booking: BookingState;
  onBack: () => void;
  onProceed: (data: {
    recipientName: string;
    senderName: string;
    message: string;
    mediaUrl: string;
    mediaType: 'image' | 'video' | 'none';
    totalAmount: number;
  }) => void;
}

const DetailsFormStep: React.FC<Props> = ({ booking, onBack, onProceed }) => {
  const [recipientName, setRecipientName] = useState(booking.recipientName || '');
  const [senderName, setSenderName] = useState(booking.senderName || '');
  const [message, setMessage] = useState(booking.message || '');
  const [mediaUrl, setMediaUrl] = useState(booking.mediaUrl || '');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'none'>(booking.mediaType || 'none');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const priceObj = SPECIAL_MOMENT_PRICE[booking.occasion] || { base: 50, tax: 9, total: 59 };
  const price = priceObj.total;
  const templateFields = booking.templateFields || [];
  const wantsImage = templateFields.includes('image');
  const wantsVideo = templateFields.includes('video');
  const acceptMedia = wantsVideo ? 'video/*' : 'image/*';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    setError('');

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = ev => {
        if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 90));
      };
      xhr.onload = () => {
        setUploadProgress(100);
        try {
          const resp = JSON.parse(xhr.responseText);
          if (resp.success && (resp.url || resp.data?.url)) {
            const url = resp.url || resp.data?.url;
            setMediaUrl(url);
            setMediaType(file.type.startsWith('video') ? 'video' : 'image');
          } else {
            // fallback: use local data URL for preview
            const reader = new FileReader();
            reader.onload = () => {
              setMediaUrl(reader.result as string);
              setMediaType(file.type.startsWith('video') ? 'video' : 'image');
            };
            reader.readAsDataURL(file);
          }
        } catch {
          const reader = new FileReader();
          reader.onload = () => {
            setMediaUrl(reader.result as string);
            setMediaType(file.type.startsWith('video') ? 'video' : 'image');
          };
          reader.readAsDataURL(file);
        }
        setUploading(false);
      };
      xhr.onerror = () => { setError('Upload failed, using local preview'); setUploading(false); };
      xhr.open('POST', `${API_BASE}/api/v1/upload`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    } catch {
      setUploading(false);
      setError('Upload failed');
    }
  };

  const handleSubmit = () => {
    if (!recipientName.trim()) {
      setError('Recipient name is required');
      return;
    }
    if (!senderName.trim()) {
      setError('Sender name is required');
      return;
    }
    setError('');
    onProceed({ recipientName: recipientName.trim(), senderName: senderName.trim(), message, mediaUrl, mediaType, totalAmount: price });
  };

  return (
    <div className="smb-step">
      <button className="smb-back-btn" onClick={onBack}>← Back</button>
      <div className="smb-step-header">
        <h2 className="smb-step-title">Personalise Your Moment</h2>
        <p className="smb-step-subtitle">Fill in the details — see a live preview on the right</p>
      </div>

      <div className="smb-details-layout">
        {/* Left: Form */}
        <div className="smb-details-form">
          <div className="smb-field">
            <label className="smb-label">Recipient Name *</label>
            <input
              type="text"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="e.g. Jude"
              className="smb-input"
            />
          </div>

          <div className="smb-field">
            <label className="smb-label">From (Your Name) *</label>
            <input
              type="text"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              placeholder="e.g. John"
              className="smb-input"
            />
          </div>

          <div className="smb-field">
            <label className="smb-label">
              Message
              <span className="smb-char-count">{message.length}/300</span>
            </label>
            <textarea
              value={message}
              onChange={e => { if (e.target.value.length <= 300) setMessage(e.target.value); }}
              rows={4}
              placeholder="Write a heartfelt message…"
              className="smb-textarea"
            />
          </div>

          {(wantsImage || wantsVideo) && (
            <div className="smb-field">
              <label className="smb-label">{wantsVideo ? 'Upload Video' : 'Upload Photo'}</label>
              <input
                type="file"
                ref={fileRef}
                accept={acceptMedia}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                className="smb-upload-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? `Uploading… ${uploadProgress}%` : mediaUrl ? '✓ Change File' : '+ Choose File'}
              </button>
              {uploading && (
                <div className="smb-progress-bar">
                  <div className="smb-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              {mediaUrl && !uploading && (
                <p className="smb-upload-done">✓ File ready</p>
              )}
            </div>
          )}

          {error && <p className="smb-error">{error}</p>}

          {/* Price Breakdown */}
          <div style={{ background: '#1a1a1a', border: '1px solid #e91e8c44', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Base Price</span>
              <span style={{ color: '#e5e5e5', fontWeight: 600 }}>₹{priceObj.base}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>GST (18%)</span>
              <span style={{ color: '#e5e5e5', fontWeight: 600 }}>₹{priceObj.tax}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 4px', borderTop: '1px solid #2a2a2a', marginTop: '6px' }}>
              <span style={{ color: '#aaa', fontSize: '1rem', fontWeight: 700 }}>Total</span>
              <span style={{ color: '#e91e8c', fontSize: '1.4rem', fontWeight: 700 }}>₹{priceObj.total}</span>
            </div>
          </div>

          {/* Buttons row */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowPreview(true)}
              style={{
                flex: 1, padding: '13px 20px', background: 'transparent',
                border: '1.5px solid #FF2D78', borderRadius: '10px',
                color: '#FF2D78', fontSize: '1rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all .18s', minWidth: '120px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FF2D78'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#FF2D78'; }}
            >
              👁 Preview
            </button>
            <button className="smb-primary-btn" style={{ flex: 2 }} onClick={handleSubmit}>
              Proceed to Payment →
            </button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="preview-panel">
          <img
            src={booking.templatePreviewImage}
            alt={booking.templateName}
            className="preview-bg"
          />
          <div className="preview-overlay">
            {mediaUrl && mediaType === 'image' && (
              <img src={mediaUrl} alt="uploaded" className="preview-media-img" />
            )}
            <p className="preview-name">{recipientName || 'Recipient Name'}</p>
            {message && <p className="preview-message">{message}</p>}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        open={showPreview}
        templateId={booking.templateId}
        templateName={booking.templateName}
        templatePreviewImage={booking.templatePreviewImage}
        recipientName={recipientName}
        senderName={senderName}
        message={message}
        mediaUrl={mediaUrl}
        mediaType={mediaType}
        onClose={() => setShowPreview(false)}
        onProceed={handleSubmit}
      />
    </div>
  );
};

export default DetailsFormStep;
