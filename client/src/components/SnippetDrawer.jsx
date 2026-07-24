import React, { useState } from 'react';
import { Code2, Plus, Play, Trash2, Edit3, Terminal } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function SnippetDrawer({ snippets, onSaveSnippet, onDeleteSnippet, canEditWorkspace = true }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [command, setCommand] = useState('');
  const [category, setCategory] = useState('DevOps');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title || !command) return;
    onSaveSnippet({
      id: 'snip-' + Date.now(),
      title,
      command,
      category
    });
    setTitle('');
    setCommand('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
          {t('snippets.pageTitle')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {t('snippets.pageSubTitle')}
        </p>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: canEditWorkspace ? '1fr 2fr' : '1fr', gap: '24px', padding: '24px 28px', overflow: 'hidden' }}>
        {/* Form add snippet */}
        {canEditWorkspace && (
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', alignSelf: 'start' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
              {t('snippets.addNew')}
            </h3>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('snippets.titleLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('snippets.titlePlaceholder')}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('snippets.categoryLabel')}
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('snippets.commandLabel')}
                </label>
                <textarea
                  placeholder="tail -f /var/log/nginx/access.log"
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  required
                  rows={4}
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                <Plus size={16} /> {t('snippets.saveBtn')}
              </button>
            </form>
          </div>
        )}

        {/* Snippets List */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {snippets?.map((snip) => (
            <div
              key={snip.id}
              className="glass-panel"
              style={{
                padding: '18px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{snip.title}</span>
                  <span style={{
                    fontSize: '11px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {snip.category || 'General'}
                  </span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: '#34d399',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginTop: '10px'
                }}>
                  {snip.command}
                </div>
              </div>

              {canEditWorkspace && (
                <button
                  onClick={() => onDeleteSnippet(snip.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: '#fff',
  padding: '10px 12px',
  fontSize: '13.5px',
  outline: 'none'
};
