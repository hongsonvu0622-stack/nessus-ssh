import React, { useState } from 'react';
import { Cloud, Lock, Server, UploadCloud, DownloadCloud, AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function CloudSync({ settings, setSettings, persistData }) {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [syncUrl, setSyncUrl] = useState(settings?.syncUrl || 'http://localhost:4001/api');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Mock login logic, actual API integration will be added here
    setTimeout(() => {
      setError(lang === 'vi' ? 'Chức năng đang được phát triển.' : 'Feature under development.');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="glass-panel" style={{
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid var(--border-color)',
      marginTop: '24px',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Cloud size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>NexusCloud E2EE Sync</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            {lang === 'vi' 
              ? 'Đồng bộ cấu hình an toàn tuyệt đối với mã hóa đầu cuối.' 
              : 'End-to-End Encrypted configuration synchronization.'}
          </p>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <AlertTriangle size={18} color="#eab308" style={{ marginTop: '2px' }} />
          <p style={{ fontSize: '13px', color: '#eab308', margin: 0, lineHeight: 1.5 }}>
            {lang === 'vi'
              ? 'Dữ liệu của bạn được mã hóa hoàn toàn trước khi rời khỏi máy. Chỉ có mật khẩu đồng bộ (Sync Password) của bạn mới có thể giải mã được. Không chia sẻ mật khẩu này với bất kỳ ai.'
              : 'Your data is fully encrypted before leaving this device. Only your Sync Password can decrypt it. Do not share this password.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {lang === 'vi' ? 'Máy chủ đồng bộ (Sync Server URL)' : 'Sync Server URL'}
          </label>
          <div style={{ position: 'relative' }}>
            <Server size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '10px', left: '12px' }} />
            <input 
              type="text" 
              className="bg-transparent"
              style={{
                width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px',
                border: '1px solid var(--border-color)', color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={syncUrl}
              onChange={e => setSyncUrl(e.target.value)}
              placeholder="http://localhost:4001/api"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Email</label>
            <input 
              type="email" 
              className="bg-transparent"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '1px solid var(--border-color)', color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              {lang === 'vi' ? 'Mật khẩu đồng bộ' : 'Sync Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '10px', left: '12px' }} />
              <input 
                type="password" 
                className="bg-transparent"
                style={{
                  width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', color: '#fff', fontSize: '14px', outline: 'none'
                }}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || !email || !password || !syncUrl}
          className="btn-primary"
          style={{ width: '100%', padding: '10px', fontSize: '14px', marginTop: '8px' }}
        >
          {loading ? (lang === 'vi' ? 'Đang kết nối...' : 'Connecting...') : (lang === 'vi' ? 'Đăng Nhập & Đồng Bộ' : 'Login & Sync')}
        </button>
      </form>
    </div>
  );
}
