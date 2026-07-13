import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, RefreshCw, Plus, Upload, Copy, Check, Eye, X } from 'lucide-react';
import { fetchLocalKeys, generateSshKey, importSshKey } from '../services/socket';

export default function IdentityManager() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  // Generate modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [genForm, setGenForm] = useState({ name: 'id_ed25519_nexus', type: 'ed25519', comment: 'nexusssh@macos' });
  const [genLoading, setGenLoading] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importForm, setImportForm] = useState({ name: '', privateContent: '', publicContent: '' });
  const [importLoading, setImportLoading] = useState(false);

  // View public key modal
  const [viewPubModal, setViewPubModal] = useState(null);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const list = await fetchLocalKeys();
      setKeys(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCopyPub = (key) => {
    if (key.pubContent) {
      navigator.clipboard.writeText(key.pubContent);
      setCopiedKey(key.name);
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      alert('Không tìm thấy tệp public key (.pub) cho khóa này.');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenLoading(true);
    try {
      await generateSshKey(genForm.name, genForm.type, genForm.comment);
      setShowGenModal(false);
      await loadKeys();
      alert(`✔ Tạo thành công khóa ${genForm.name} trong ~/.ssh/`);
    } catch (err) {
      alert('Lỗi khi tạo khóa SSH: ' + err.message);
    } finally {
      setGenLoading(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importForm.privateContent.trim()) {
      alert('Vui lòng nhập nội dung Private Key.');
      return;
    }
    setImportLoading(true);
    try {
      await importSshKey(importForm.name || `id_imported_${Date.now()}`, importForm.privateContent, importForm.publicContent);
      setShowImportModal(false);
      await loadKeys();
      alert('✔ Đã lưu khóa SSH thành công vào ~/.ssh/');
    } catch (err) {
      alert('Lỗi khi import khóa SSH: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
            Keychain & SSH Identities
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Quản lý, tạo mới và import khóa SSH (`~/.ssh`) để chọn trực tiếp khi đăng nhập máy chủ
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowImportModal(true)} className="btn-secondary" style={{ fontSize: '13px' }}>
            <Upload size={15} /> Import Khóa
          </button>
          <button onClick={() => setShowGenModal(true)} className="btn-primary" style={{ fontSize: '13px' }}>
            <Plus size={16} /> Tạo Khóa SSH Mới
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={loadKeys} className="btn-secondary" style={{ fontSize: '13px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới danh sách
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Đang quét khóa SSH trong ~/.ssh...
          </div>
        ) : keys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Không tìm thấy Private Key nào trong thư mục ~/.ssh của bạn. Hãy bấm "Tạo Khóa SSH Mới"!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
            {keys.map((key, idx) => (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <KeyRound size={22} color="#818cf8" />
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {key.name}
                      <ShieldCheck size={16} color="#10b981" />
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      marginTop: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {key.path}
                    </div>
                  </div>
                </div>

                {key.pubContent && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      onClick={() => handleCopyPub(key)}
                      className="btn-secondary"
                      style={{ flex: 1, fontSize: '12px', padding: '6px 12px' }}
                    >
                      {copiedKey === key.name ? (
                        <><Check size={14} color="#10b981" /> Đã sao chép Public Key</>
                      ) : (
                        <><Copy size={14} /> Sao chép Public Key</>
                      )}
                    </button>
                    <button
                      onClick={() => setViewPubModal(key)}
                      className="btn-secondary"
                      title="Xem chi tiết Public Key"
                      style={{ padding: '6px 10px' }}
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate SSH Key Modal */}
      {showGenModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-panel" style={{
            width: '460px',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
              Tạo Khóa SSH Mới (`ssh-keygen`)
            </h3>
            <form onSubmit={handleGenerate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Tên tệp khóa (lưu tại ~/.ssh/)
                </label>
                <input
                  type="text"
                  required
                  value={genForm.name}
                  onChange={e => setGenForm({ ...genForm, name: e.target.value })}
                  className="input-field"
                  placeholder="id_ed25519_nexus"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Thuật toán mã hóa
                </label>
                <select
                  value={genForm.type}
                  onChange={e => setGenForm({ ...genForm, type: e.target.value })}
                  className="input-field"
                >
                  <option value="ed25519">ED25519 (Mới, nhanh & an toàn nhất)</option>
                  <option value="rsa">RSA 4096-bit (Khả năng tương thích cũ tốt nhất)</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Ghi chú (Comment)
                </label>
                <input
                  type="text"
                  value={genForm.comment}
                  onChange={e => setGenForm({ ...genForm, comment: e.target.value })}
                  className="input-field"
                  placeholder="user@macbook"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowGenModal(false)} className="btn-secondary">
                  Hủy
                </button>
                <button type="submit" disabled={genLoading} className="btn-primary">
                  {genLoading ? 'Đang tạo khóa...' : 'Tạo Khóa Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import SSH Key Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-panel" style={{
            width: '520px',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
              Import Khóa Private Key vào Keychain (~/.ssh/)
            </h3>
            <form onSubmit={handleImport}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Tên tệp lưu trong ~/.ssh/
                </label>
                <input
                  type="text"
                  required
                  value={importForm.name}
                  onChange={e => setImportForm({ ...importForm, name: e.target.value })}
                  className="input-field"
                  placeholder="id_rsa_server_abc"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Nội dung Private Key (PEM/OpenSSH)
                </label>
                <textarea
                  rows={6}
                  required
                  value={importForm.privateContent}
                  onChange={e => setImportForm({ ...importForm, privateContent: e.target.value })}
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Nội dung Public Key (.pub) - Không bắt buộc
                </label>
                <input
                  type="text"
                  value={importForm.publicContent}
                  onChange={e => setImportForm({ ...importForm, publicContent: e.target.value })}
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowImportModal(false)} className="btn-secondary">
                  Hủy
                </button>
                <button type="submit" disabled={importLoading} className="btn-primary">
                  {importLoading ? 'Đang lưu...' : 'Lưu Khóa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Public Key Modal */}
      {viewPubModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-panel" style={{
            width: '500px',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                Public Key: {viewPubModal.name}.pub
              </h3>
              <button onClick={() => setViewPubModal(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <textarea
              readOnly
              value={viewPubModal.pubContent}
              rows={4}
              className="input-field"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '16px', width: '100%' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => handleCopyPub(viewPubModal)}
                className="btn-primary"
              >
                <Copy size={15} /> Sao chép Public Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
