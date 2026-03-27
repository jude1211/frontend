import React, { useState, useEffect } from 'react';

interface Template {
  id: string;
  occasion: string;
  name: string;
  previewImage: string;
  fields: string[];
}

interface Props {
  occasion: string;
  onBack: () => void;
  onSelect: (data: { templateId: string; templateName: string; templatePreviewImage: string; templateFields: string[] }) => void;
}

const API_BASE: string = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

const TemplateSelectStep: React.FC<Props> = ({ occasion, onBack, onSelect }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Template | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/special-moments/templates?occasion=${occasion}`);
        const data = await res.json();
        if (data.success) setTemplates(data.data);
      } catch (e) {
        console.error('Templates fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [occasion]);

  return (
    <div className="smb-step">
      <button className="smb-back-btn" onClick={onBack}>← Back</button>
      <div className="smb-step-header">
        <h2 className="smb-step-title">Choose a Template</h2>
        <p className="smb-step-subtitle">Pick the perfect backdrop for your special moment</p>
      </div>

      {loading && <div className="smb-loading"><div className="smb-spinner-lg" /><span>Loading templates…</span></div>}

      <div className="smb-template-grid">
        {templates.map(t => (
          <button
            key={t.id}
            className={`template-card ${selected?.id === t.id ? 'selected' : ''}`}
            onClick={() => setSelected(t)}
          >
            <div className="template-card-img-wrap">
              <img src={t.previewImage} alt={t.name} className="template-card-img" />
              {selected?.id === t.id && (
                <div className="template-checkmark">✓</div>
              )}
            </div>
            <div className="template-card-footer">
              <span className="template-card-name">{t.name}</span>
              <div className="template-card-tags">
                {t.fields.includes('image') && <span className="template-tag">📷 Photo</span>}
                {t.fields.includes('video') && <span className="template-tag">🎥 Video</span>}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="smb-btn-row">
        <button
          className="smb-primary-btn"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            onSelect({
              templateId: selected.id,
              templateName: selected.name,
              templatePreviewImage: selected.previewImage,
              templateFields: selected.fields,
            });
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

export default TemplateSelectStep;
