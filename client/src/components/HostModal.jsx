import React, { useState, useEffect } from 'react';
import { X, Server, Usb, Terminal, Save, KeyRound, RefreshCw } from 'lucide-react';
import { fetchLocalKeys, fetchSerialPorts } from '../services/socket';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function HostModal({ initialData, groups, onClose, onSave }) {
  const { lang, t } = useI18n();
  const [protocol, setProtocol] = useState(initialData?.protocol || 'ssh');
  const [name, setName] = useState(initialData?.name || '');
  const [group, setGroup] = useState(initialData?.group || (groups[0]?.name || 'Production'));
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [localKeys, setLocalKeys] = useState([]);
  const [scannedSerialPorts, setScannedSerialPorts] = useState([]);
  const [scanningSerial, setScanningSerial] = useState(false);

  useEffect(() => {
    fetchLocalKeys().then(keys => setLocalKeys(keys || [])).catch(() => {});
  }, []);

  const handleScanPorts = async () => {
    setScanningSerial(true);
    try {
      const list = await fetchSerialPorts();
      setScannedSerialPorts(list || []);
      if (list && list.length > 0 && (!serialPath || serialPath === '/dev/cu.usbserial-0001')) {
        setSerialPath(list[0].path);
      }
    } catch (err) {
      console.error('Scan serial ports failed:', err);
    } finally {
      setScanningSerial(false);
    }
  };

  useEffect(() => {
    if (protocol === 'serial') {
      handleScanPorts();
    }
  }, [protocol]);

  // SSH specific
  const [host, setHost] = useState(initialData?.host || '');
  const [port, setPort] = useState(initialData?.port || 22);
  const [username, setUsername] = useState(initialData?.username || 'root');
  const [authType, setAuthType] = useState(initialData?.authType || 'password');
  const [password, setPassword] = useState(initialData?.password || '');
  const [keyPath, setKeyPath] = useState(initialData?.keyPath || '');
  const [passphrase, setPassphrase] = useState(initialData?.passphrase || '');

  // Serial specific
  const [serialPath, setSerialPath] = useState(initialData?.serialPath || '/dev/cu.usbserial-0001');
  const [baudRate, setBaudRate] = useState(initialData?.baudRate || 9600);
  const [dataBits, setDataBits] = useState(initialData?.dataBits || 8);
  const [stopBits, setStopBits] = useState(initialData?.stopBits || 1);
  const [parity, setParity] = useState(initialData?.parity || 'none');

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const result = {
      id: initialData?.id || 'conn-' + Date.now(),
      protocol,
      name: name || (protocol === 'serial' ? serialPath : host) || 'New Connection',
      group,
      tags: tagArray,
      notes,
      status: 'offline'
    };

    if (protocol === 'ssh') {
      result.host = host;
      result.port = parseInt(port, 10) || 22;
      result.username = username;
      result.authType = authType;
      result.password = authType === 'password' ? password : '';
      result.keyPath = authType === 'key' ? keyPath : '';
      result.passphrase = authType === 'key' ? passphrase : '';
    } else if (protocol === 'serial') {
      result.serialPath = serialPath;
      result.baudRate = parseInt(baudRate, 10) || 9600;
      result.dataBits = parseInt(dataBits, 10) || 8;
      result.stopBits = parseInt(stopBits, 10) || 1;
      result.parity = parity;
    }

    onSave(result);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-glass animate-fade-in" style={{
        width: '640px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: protocol === 'serial' ? 'rgba(139, 92, 246, 0.18)' : protocol === 'local' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(99, 102, 241, 0.18)',
              border: `1px solid ${protocol === 'serial' ? 'rgba(139, 92, 246, 0.3)' : protocol === 'local' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {protocol === 'serial' ? <Usb size={20} color="#a78bfa" /> : protocol === 'local' ? <Terminal size={20} color="#10b981" /> : <Server size={20} color="#818cf8" />}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                {initialData?.id ? 'Chỉnh sửa kết nối' : 'Thêm kết nối mới'}
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Cấu hình thông số và xác thực cho phiên làm việc
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '34px', height: '34px', border: 'none', outline: 'none' }}
          >
            <X size={19} />
          </button>
        </div>

        {/* Protocol Selector Tabs */}
        <div style={{ padding: '20px 24px 0 24px' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '10px' }}>
            {[
              { id: 'ssh', label: 'SSH Server', icon: Server },
              { id: 'serial', label: 'Serial Console (UART)', icon: Usb },
              { id: 'local', label: 'macOS Local Shell', icon: Terminal }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProtocol(tab.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: protocol === tab.id ? 'var(--accent)' : 'transparent',
                    color: protocol === tab.id ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Common fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Tên hiển thị (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder={protocol === 'serial' ? 'Cisco Switch Core' : 'Production Web Server'}
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nhóm (Group)
              </label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value)}
                style={inputStyle}
              >
                {groups.map((g, idx) => (
                  <option key={idx} value={g.name} style={{ background: '#111622', color: '#fff' }}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SSH specific fields */}
          {protocol === 'ssh' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Hostname hoặc IP *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: 192.168.1.100 hoặc demo.nexusssh.dev"
                    value={host}
                    onChange={e => setHost(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Port
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Phương thức xác thực
                  </label>
                  <select
                    value={authType}
                    onChange={e => setAuthType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="password" style={{ background: '#111622' }}>Mật khẩu (Password)</option>
                    <option value="key" style={{ background: '#111622' }}>Khóa SSH (Private Key)</option>
                  </select>
                </div>
              </div>

              {authType === 'password' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Mật khẩu (Password)
                  </label>
                  <input
                    type="password"
                    placeholder="Mật khẩu SSH (để trống nếu hỏi khi kết nối)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={inputStyle}
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    fontSize: '11.5px',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}>
                    <span>🔒 Mật khẩu được tự động mã hóa bảo mật AES-256-GCM khi lưu trên máy</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Chọn từ Keychain (~/.ssh/)
                    </label>
                    <select
                      value={keyPath}
                      onChange={e => setKeyPath(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="" style={{ background: '#111622' }}>-- Chọn khóa có sẵn hoặc nhập tay phía dưới --</option>
                      {localKeys.map((k, idx) => (
                        <option key={idx} value={k.path} style={{ background: '#111622', color: '#fff' }}>
                          🔑 {k.name} ({k.path})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Đường dẫn Private Key
                    </label>
                    <input
                      type="text"
                      placeholder="/Users/yourname/.ssh/id_rsa hoặc ~/.ssh/id_ed25519"
                      value={keyPath}
                      onChange={e => setKeyPath(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {t('hostModal.passphraseLabel')}
                    </label>
                    <input
                      type="password"
                      placeholder={t('hostModal.passphrasePlaceholder')}
                      value={passphrase}
                      onChange={e => setPassphrase(e.target.value)}
                      style={inputStyle}
                    />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '6px',
                      fontSize: '11.5px',
                      color: '#f59e0b',
                      background: 'rgba(245, 158, 11, 0.1)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.25)'
                    }}>
                      <span>
                        {t('hostModal.passphraseHint')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Serial specific fields */}
          {protocol === 'serial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Chọn Cổng Serial / COM đang kết nối *
                  </label>
                  <button
                    type="button"
                    onClick={handleScanPorts}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#a78bfa',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}
                  >
                    <RefreshCw size={13} className={scanningSerial ? 'animate-spin' : ''} />
                    {scanningSerial ? t('hostModal.scanningPorts') : t('hostModal.rescanPorts')}
                  </button>
                </div>

                {scannedSerialPorts && scannedSerialPorts.length > 0 ? (
                  <select
                    value={serialPath}
                    onChange={e => setSerialPath(e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                      borderColor: 'rgba(167, 139, 250, 0.4)',
                      background: 'rgba(167, 139, 250, 0.06)',
                      fontWeight: 600
                    }}
                  >
                    {scannedSerialPorts.map((p, idx) => (
                      <option key={idx} value={p.path} style={{ background: '#111622' }}>
                        {p.path} ({p.manufacturer || 'Serial Device'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Nhập đường dẫn cổng (ví dụ: /dev/cu.usbserial-0001 hoặc COM3)"
                    value={serialPath}
                    onChange={e => setSerialPath(e.target.value)}
                    style={inputStyle}
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Baud Rate
                  </label>
                  <select
                    value={baudRate}
                    onChange={e => setBaudRate(e.target.value)}
                    style={inputStyle}
                  >
                    {[9600, 19200, 38400, 57600, 115200, 230400].map(br => (
                      <option key={br} value={br} style={{ background: '#111622' }}>{br}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Data Bits
                  </label>
                  <select
                    value={dataBits}
                    onChange={e => setDataBits(e.target.value)}
                    style={inputStyle}
                  >
                    <option value={8} style={{ background: '#111622' }}>8</option>
                    <option value={7} style={{ background: '#111622' }}>7</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Stop Bits
                  </label>
                  <select
                    value={stopBits}
                    onChange={e => setStopBits(e.target.value)}
                    style={inputStyle}
                  >
                    <option value={1} style={{ background: '#111622' }}>1</option>
                    <option value={2} style={{ background: '#111622' }}>2</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Parity
                  </label>
                  <select
                    value={parity}
                    onChange={e => setParity(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="none" style={{ background: '#111622' }}>None</option>
                    <option value="even" style={{ background: '#111622' }}>Even</option>
                    <option value="odd" style={{ background: '#111622' }}>Odd</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Local specific fields */}
          {protocol === 'local' && (
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#34d399' }}>
                Kết nối này sẽ khởi chạy Shell trực tiếp (/bin/zsh hoặc /bin/bash) trên máy Mac của bạn.
              </p>
            </div>
          )}

          {/* Tags & Notes */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Tags (các từ khóa cách nhau bởi dấu phẩy)
              </label>
              <input
                type="text"
                placeholder="Linux, Router, Switch, Staging"
                value={tags}
                onChange={e => setTags(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Ghi chú (Notes)
              </label>
              <textarea
                placeholder="Ghi chú thêm về server hay thiết bị này..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              <Save size={16} />
              Lưu kết nối
            </button>
          </div>
        </form>
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
  outline: 'none',
  transition: 'border 0.15s'
};
