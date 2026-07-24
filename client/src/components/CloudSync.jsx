import React, { useState } from 'react';
import { Cloud, Lock, Server, UploadCloud, DownloadCloud, AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { socket } from '../services/socket';

export default function CloudSync({ settings, setSettings, persistData }) {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [syncUrl, setSyncUrl] = useState(settings?.syncUrl || 'http://localhost:3000');
  const [loggedInEmail, setLoggedInEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');

  React.useEffect(() => {
    const handleStatus = (payload) => {
      setStatusMessage(payload.message);
      setStatusType(payload.type);
      if (payload.type === 'success' || payload.type === 'error') {
        setLoading(false);
      }
    };
    const handleAuthSuccess = ({ email }) => {
      setLoggedInEmail(email);
    };

    const handleLoggedOut = () => {
      setLoggedInEmail('');
      setStatusMessage('');
    };

    socket.on('sync:status', handleStatus);
    socket.on('sync:auth_success', handleAuthSuccess);
    socket.on('sync:logged_out', handleLoggedOut);
    
    // Check if backend is already logged in
    socket.emit('sync:check_auth');

    return () => {
      socket.off('sync:status', handleStatus);
      socket.off('sync:auth_success', handleAuthSuccess);
      socket.off('sync:logged_out', handleLoggedOut);
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password || !passphrase || !syncUrl) {
      setError(lang === 'vi' ? 'Vui lòng nhập Email, Mật khẩu, Mật khẩu giải mã và Địa chỉ Server.' : 'Email, Password, Passphrase, and Sync URL are required.');
      return;
    }
    setLoading(true);
    setError('');
    setStatusType('info');
    
    const formattedUrl = syncUrl.endsWith('/api') ? syncUrl : `${syncUrl.replace(/\/+$/, '')}/api`;
    socket.emit('sync:login', { email, password, passphrase, syncUrl: formattedUrl });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!email || !password || !passphrase || !syncUrl) {
      setError(lang === 'vi' ? 'Vui lòng nhập Email, Mật khẩu, Mật khẩu giải mã và Địa chỉ Server.' : 'Email, Password, Passphrase, and Sync URL are required.');
      return;
    }
    setLoading(true);
    setError('');
    setStatusType('info');
    
    const formattedUrl = syncUrl.endsWith('/api') ? syncUrl : `${syncUrl.replace(/\/+$/, '')}/api`;
    socket.emit('sync:register', { email, password, passphrase, syncUrl: formattedUrl });
  };

  const handleLogout = () => {
    socket.emit('sync:logout');
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

      {loggedInEmail ? (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '16px', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#10b981' }}>Connected</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Automatically syncing with <strong style={{color: '#fff'}}>{loggedInEmail}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button 
              onClick={() => {
                setLoading(true);
                socket.emit('sync:force');
              }}
              disabled={loading}
              style={{
                flex: 1, padding: '8px 16px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', 
                color: '#10b981', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}
            >
              {loading ? (lang === 'vi' ? 'Đang đồng bộ...' : 'Syncing...') : (lang === 'vi' ? 'Đồng bộ ngay' : 'Sync Now')}
            </button>
            <button 
              onClick={handleLogout}
              disabled={loading}
              style={{
                flex: 1, padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', 
                color: '#ef4444', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              {lang === 'vi' ? 'Máy chủ đồng bộ (Sync Server URL)' : 'Sync Server URL'}
            </label>
            <div style={{ position: 'relative' }}>
              <Server size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '10px', left: '12px' }} />
              <input 
                type="text" 
                style={{
                  width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--border-color)', color: '#fff', fontSize: '14px', outline: 'none'
                }}
                value={syncUrl}
                onChange={e => setSyncUrl(e.target.value)}
                placeholder="http://localhost:3000"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Email</label>
              <input 
                type="email" 
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--border-color)', color: '#fff', fontSize: '14px', outline: 'none'
                }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'vi' ? 'Mật khẩu đăng nhập' : 'Login Password'}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '10px', left: '12px' }} />
                  <input 
                    type="password" 
                    style={{
                      width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid var(--border-color)', color: '#fff', fontSize: '14px', outline: 'none'
                    }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'vi' ? 'Mật khẩu giải mã (E2EE Key)' : 'Master Passphrase (E2EE)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#fbbf24" style={{ position: 'absolute', top: '10px', left: '12px' }} />
                  <input 
                    type="password" 
                    style={{
                      width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px',
                      background: 'rgba(251, 191, 36, 0.05)',
                      border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fff', fontSize: '14px', outline: 'none'
                    }}
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    placeholder={lang === 'vi' ? 'Không được quên!' : 'Do not forget!'}
                  />
                </div>
              </div>
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-8px' }}>
              {lang === 'vi' ? '⚠️ Mật khẩu giải mã chỉ dùng ở máy bạn để mã hóa dữ liệu. Server không lưu mật khẩu này.' : '⚠️ The Master Passphrase never leaves your device. It encrypts your vault.'}
            </p>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
              {error}
            </div>
          )}
          
          {statusMessage && !error && (
            <div style={{ 
              color: statusType === 'success' ? '#10b981' : (statusType === 'error' ? '#ef4444' : '#3b82f6'), 
              fontSize: '13px', 
              background: statusType === 'success' ? 'rgba(16, 185, 129, 0.1)' : (statusType === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
              padding: '8px 12px', borderRadius: '6px' 
            }}>
              {statusMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              type="button" 
              onClick={handleRegister}
              disabled={loading || !email || !password || !passphrase || !syncUrl}
              className="btn-secondary"
              style={{ flex: 1, padding: '10px', fontSize: '14px' }}
            >
              {lang === 'vi' ? 'Đăng Ký Mới' : 'Register'}
            </button>
            
            <button 
              type="submit" 
              disabled={loading || !email || !password || !passphrase || !syncUrl}
              className="btn-primary"
              style={{ flex: 1, padding: '10px', fontSize: '14px' }}
            >
              {loading ? (lang === 'vi' ? 'Đang kết nối...' : 'Connecting...') : (lang === 'vi' ? 'Đăng Nhập & Đồng Bộ' : 'Login & Sync')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
