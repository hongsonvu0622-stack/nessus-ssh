import React, { useEffect, useState } from 'react';
import { 
  Folder, 
  FileText, 
  ArrowLeft, 
  RefreshCw, 
  Download, 
  Upload, 
  Edit3, 
  Server, 
  X, 
  Save 
} from 'lucide-react';
import { sftpList, sftpRead, sftpWrite, fetchLocalKeys } from '../services/socket';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function SftpBrowser({ activeConfig, connections = [], onSelectServer, onClose }) {
  const { t } = useI18n();
  const [currentPath, setCurrentPath] = useState('.');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auth State
  const [isConnected, setIsConnected] = useState(false);
  const [effectiveConfigState, setEffectiveConfigState] = useState(null);
  const [localKeys, setLocalKeys] = useState([]);
  const [authModal, setAuthModal] = useState({
    authType: activeConfig?.authType || 'password',
    password: activeConfig?.password || '',
    keyPath: activeConfig?.keyPath || '',
    passphrase: activeConfig?.passphrase || ''
  });

  // Editor Modal state
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocalKeys().then(data => {
      if (Array.isArray(data)) setLocalKeys(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setIsConnected(false);
    setError(null);
    if (activeConfig) {
      setAuthModal({
        authType: activeConfig.authType || 'password',
        password: activeConfig.password || '',
        keyPath: activeConfig.keyPath || '',
        passphrase: activeConfig.passphrase || ''
      });
      setEffectiveConfigState(activeConfig);
    }
  }, [activeConfig]);

  const loadDirectory = async (targetPath, configOverride = null) => {
    const targetConfig = configOverride || effectiveConfigState || activeConfig;
    if (!targetConfig) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sftpList(targetConfig, targetPath);
      if (res.error) {
        setError(res.error);
      } else {
        setFiles(res.files || []);
        setCurrentPath(targetPath);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    setError(null);
    const effectiveConfig = {
      ...activeConfig,
      authType: authModal.authType,
      password: authModal.password,
      keyPath: authModal.keyPath,
      passphrase: authModal.passphrase
    };
    try {
      const res = await sftpList(effectiveConfig, '.');
      if (res.error) {
        setError(res.error);
      } else {
        setEffectiveConfigState(effectiveConfig);
        setFiles(res.files || []);
        setCurrentPath('.');
        setIsConnected(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItem = async (item) => {
    const targetConfig = effectiveConfigState || activeConfig;
    if (item.isDirectory) {
      const nextPath = currentPath === '.' ? item.filename : `${currentPath}/${item.filename}`;
      loadDirectory(nextPath);
    } else {
      // Read & open text file editor
      const filePath = currentPath === '.' ? item.filename : `${currentPath}/${item.filename}`;
      setLoading(true);
      try {
        const res = await sftpRead(targetConfig, filePath);
        if (res.error) {
          alert('Lỗi đọc file: ' + res.error);
        } else {
          setEditingFile(filePath);
          setFileContent(res.content || '');
        }
      } catch (e) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoUp = () => {
    if (currentPath === '.' || currentPath === '/') return;
    const parts = currentPath.split('/');
    parts.pop();
    const upPath = parts.join('/') || '.';
    loadDirectory(upPath);
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    const targetConfig = effectiveConfigState || activeConfig;
    setSaving(true);
    try {
      const res = await sftpWrite(targetConfig, editingFile, fileContent);
      if (res.error) {
        alert('Lỗi ghi file: ' + res.error);
      } else {
        alert('✔ Đã lưu file remote thành công!');
        setEditingFile(null);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderServerSelector = () => {
    if (!connections || connections.length === 0) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <select
          value={activeConfig?.id || ''}
          onChange={(e) => {
            const selected = connections.find(c => c.id === e.target.value);
            if (selected && onSelectServer) {
              onSelectServer(selected);
            }
          }}
          className="input-field"
          style={{
            height: '34px',
            fontSize: '13px',
            padding: '4px 12px',
            background: 'rgba(99, 102, 241, 0.15)',
            borderColor: 'rgba(99, 102, 241, 0.35)',
            color: '#c7d2fe',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          <option value="" disabled>-- {t('sftp.selectServer')} --</option>
          {connections.map(c => (
            <option key={c.id || c.host} value={c.id} style={{ background: '#1e1b4b', color: '#fff' }}>
              🌐 {c.name || c.host} ({c.username || 'root'}@{c.host})
            </option>
          ))}
        </select>
      </div>
    );
  };

  if (!activeConfig) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Server size={22} color="#818cf8" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>SFTP File Explorer</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {renderServerSelector()}
            {onClose && (
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-active)', textAlign: 'center' }}>
            <Folder size={44} color="#818cf8" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              {t('sftp.selectServer')}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Vui lòng chọn một máy chủ SSH từ danh sách để bắt đầu xác thực & duyệt tệp tin
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', maxHeight: '300px', overflowY: 'auto' }}>
              {(connections || []).map(conn => (
                <button
                  key={conn.id || conn.host}
                  onClick={() => onSelectServer && onSelectServer(conn)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14.5px' }}>{conn.name || conn.host}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {conn.username || 'root'}@{conn.host}:{conn.port || 22}
                    </div>
                  </div>
                  <span style={{ fontSize: '12.5px', color: '#818cf8', fontWeight: 600 }}>Chọn &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }}>
        {/* Top Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Server size={22} color="#818cf8" />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                {t('sftp.authTitle')} ({activeConfig.name || activeConfig.host})
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {activeConfig.username || 'root'}@{activeConfig.host}:{activeConfig.port || 22}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {renderServerSelector()}
            {onClose && (
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Auth Form Container */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid var(--border-active)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              {t('terminal.authRequiredTitle')}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              {t('sftp.authDesc')}
            </p>

            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#fda4af',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '20px'
              }}>
                ❌ Lỗi SFTP: {error}
              </div>
            )}

            {/* Password vs Key Tabs */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '20px',
              gap: '6px'
            }}>
              <button
                type="button"
                onClick={() => setAuthModal({ ...authModal, authType: 'password' })}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '8px',
                  border: 'none',
                  background: (authModal.authType || 'password') === 'password' ? 'var(--accent-primary)' : 'transparent',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('terminal.passwordTab')}
              </button>
              <button
                type="button"
                onClick={() => setAuthModal({ ...authModal, authType: 'key' })}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '8px',
                  border: 'none',
                  background: authModal.authType === 'key' ? 'var(--accent-primary)' : 'transparent',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('terminal.sshKeyTab')}
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(authModal.authType || 'password') === 'password' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    SSH Password
                  </label>
                  <input
                    type="password"
                    placeholder={t('terminal.passwordPlaceholder')}
                    value={authModal.password}
                    onChange={e => setAuthModal({ ...authModal, password: e.target.value })}
                    className="input-field"
                    style={{ height: '42px', fontSize: '14px' }}
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {t('terminal.selectKeyLabel')}
                    </label>
                    <select
                      className="input-field"
                      value={authModal.keyPath}
                      onChange={e => setAuthModal({ ...authModal, keyPath: e.target.value })}
                      style={{ height: '42px', fontSize: '13.5px' }}
                    >
                      <option value="">-- Chọn file Key trong ~/.ssh --</option>
                      {localKeys.map(k => (
                        <option key={k.path} value={k.path}>
                          {k.name} ({k.path})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder={t('terminal.customKeyPlaceholder')}
                      value={authModal.keyPath}
                      onChange={e => setAuthModal({ ...authModal, keyPath: e.target.value })}
                      className="input-field"
                      style={{ height: '42px', fontSize: '13.5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Key Passphrase
                    </label>
                    <input
                      type="password"
                      placeholder={t('terminal.passphrasePlaceholder')}
                      value={authModal.passphrase}
                      onChange={e => setAuthModal({ ...authModal, passphrase: e.target.value })}
                      className="input-field"
                      style={{ height: '42px', fontSize: '14px' }}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ height: '44px', fontSize: '14px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {t('sftp.connectBtn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top SFTP Bar */}
      <div style={{
        padding: '20px 28px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Server size={22} color="#818cf8" />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              SFTP File Explorer ({activeConfig.name || activeConfig.host})
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Remote Path: {currentPath}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {renderServerSelector()}
          <button
            onClick={() => setIsConnected(false)}
            className="btn-secondary"
            style={{ fontSize: '13px', borderColor: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}
            title="Đổi phương thức đăng nhập hoặc ngắt kết nối"
          >
            🔒 {t('sftp.disconnectBtn')}
          </button>

          <button
            onClick={handleGoUp}
            className="btn-secondary"
            disabled={currentPath === '.'}
            style={{ fontSize: '13px' }}
          >
            <ArrowLeft size={16} /> {t('sftp.upDir')}
          </button>

          <button
            onClick={() => loadDirectory(currentPath)}
            className="btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {t('sftp.refresh')}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Directory Content Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {error ? (
          <div style={{ padding: '24px', background: 'rgba(244, 63, 94, 0.15)', borderRadius: '12px', color: '#f43f5e' }}>
            Lỗi SFTP: {error}
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Đang tải danh sách tập tin...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px' }}>
                <th style={{ padding: '12px' }}>Tên tập tin</th>
                <th style={{ padding: '12px' }}>Kích thước</th>
                <th style={{ padding: '12px' }}>Chỉnh sửa lần cuối</th>
                <th style={{ padding: '12px' }}>Quyền</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {files.map((item, idx) => (
                <tr
                  key={idx}
                  onDoubleClick={() => handleOpenItem(item)}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.isDirectory ? (
                      <Folder size={18} color="#f59e0b" />
                    ) : (
                      <FileText size={18} color="#38bdf8" />
                    )}
                    <span style={{ fontWeight: 500, color: '#fff' }}>{item.filename}</span>
                  </td>

                  <td style={{ padding: '14px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {item.isDirectory ? '--' : `${(item.size / 1024).toFixed(1)} KB`}
                  </td>

                  <td style={{ padding: '14px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {new Date(item.mtime).toLocaleString()}
                  </td>

                  <td style={{ padding: '14px 12px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {item.permissions?.toString(8).slice(-4)}
                  </td>

                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItem(item);
                      }}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      {item.isDirectory ? 'Mở' : 'Xem/Sửa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Remote File Editor Modal */}
      {editingFile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '850px',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                  Chỉnh sửa file: {editingFile}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSaveFile}
                  disabled={saving}
                  className="btn-primary"
                  style={{ fontSize: '13px' }}
                >
                  <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <textarea
              value={fileContent}
              onChange={e => setFileContent(e.target.value)}
              style={{
                flex: 1,
                background: '#0a0d14',
                color: '#f8fafc',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                padding: '20px',
                border: 'none',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.5
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
