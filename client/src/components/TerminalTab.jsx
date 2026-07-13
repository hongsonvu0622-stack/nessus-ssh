import React, { useEffect, useRef, useState } from 'react';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { 
  X, 
  Terminal as TermIcon, 
  Code2, 
  Palette, 
  RefreshCw, 
  Play, 
  Trash2, 
  FolderGit2,
  KeyRound
} from 'lucide-react';
import { socket, fetchLocalKeys } from '../services/socket';
import { useI18n } from '../i18n/I18nContext.jsx';

const TERMINAL_THEMES = {
  'nexus-cyber-dark': {
    name: 'Nexus Cyber Dark',
    background: '#0a0d14',
    foreground: '#f1f5f9',
    cursor: '#6366f1',
    selectionBackground: 'rgba(99, 102, 241, 0.4)',
    black: '#1e293b',
    red: '#f43f5e',
    green: '#10b981',
    yellow: '#f59e0b',
    blue: '#3b82f6',
    magenta: '#a855f7',
    cyan: '#06b6d4',
    white: '#f8fafc'
  },
  'cyberpunk': {
    name: 'Cyberpunk Neon',
    background: '#0d0814',
    foreground: '#00ffcc',
    cursor: '#ff0055',
    selectionBackground: 'rgba(255, 0, 85, 0.4)',
    black: '#111',
    red: '#ff0055',
    green: '#00ffcc',
    yellow: '#ffee00',
    blue: '#0099ff',
    magenta: '#ff00cc',
    cyan: '#00ffee',
    white: '#ffffff'
  },
  'dracula': {
    name: 'Dracula',
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#ff79c6',
    selectionBackground: 'rgba(255, 121, 198, 0.3)',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2'
  },
  'nord': {
    name: 'Nord',
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#88c0d0',
    selectionBackground: 'rgba(136, 192, 208, 0.3)',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0'
  }
};

export default function TerminalTab({
  tabs,
  activeTabId,
  setActiveTabId,
  onCloseTab,
  snippets,
  onOpenSftp
}) {
  const { t } = useI18n();
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  const activeTab = tabs.find(t => t.sessionId === activeTabId) || tabs[0];
  const [themeKey, setThemeKey] = useState('nexus-cyber-dark');
  const [showSnippets, setShowSnippets] = useState(false);
  const [statusText, setStatusText] = useState('Connecting...');
  const [authModal, setAuthModal] = useState(null);

  const connectedSessionsRef = useRef(new Set());
  const statusPrintedRef = useRef(new Set());

  // Update theme dynamically without reconnecting session
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = TERMINAL_THEMES[themeKey];
    }
  }, [themeKey]);

  useEffect(() => {
    if (!activeTab || !containerRef.current) return;

    // Clear previous xterm DOM
    containerRef.current.innerHTML = '';

    const term = new Xterm({
      theme: TERMINAL_THEMES[themeKey],
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(containerRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const syncDimensions = () => {
      try {
        fitAddon.fit();
        if (term.cols && term.rows) {
          socket.emit('terminal:resize', {
            sessionId: activeTab.sessionId,
            cols: term.cols,
            rows: term.rows,
            protocol: activeTab.config?.protocol || 'ssh'
          });
        }
      } catch (e) {}
    };

    // Send connect event only once per sessionId, passing actual terminal cols & rows
    if (!connectedSessionsRef.current.has(activeTab.sessionId)) {
      connectedSessionsRef.current.add(activeTab.sessionId);
      socket.emit('terminal:connect', {
        sessionId: activeTab.sessionId,
        config: {
          ...activeTab.config,
          cols: term.cols || 120,
          rows: term.rows || 40
        }
      });
    }

    // Auto-fit after flex container finishes rendering layout
    const timer1 = setTimeout(syncDimensions, 100);
    const timer2 = setTimeout(syncDimensions, 350);

    const resizeObserver = new ResizeObserver(() => {
      syncDimensions();
    });
    resizeObserver.observe(containerRef.current);

    // Listen to input from terminal
    const inputDisposable = term.onData((data) => {
      socket.emit('terminal:input', {
        sessionId: activeTab.sessionId,
        data,
        protocol: activeTab.config?.protocol || 'ssh'
      });
    });

    // Listen to output from backend
    const outputListener = ({ sessionId, data }) => {
      if (sessionId === activeTab.sessionId) {
        term.write(data);
      }
    };

    const statusListener = ({ sessionId, status, message }) => {
      if (status === 'closed') {
        const key = `${sessionId}-closed`;
        if (!statusPrintedRef.current.has(key)) {
          statusPrintedRef.current.add(key);
          term.write(`\r\n\x1b[31m✖ ${message}\x1b[0m\r\n`);
        }
        setTimeout(() => {
          onCloseTab(sessionId);
        }, 500);
        return;
      }

      if (sessionId === activeTab.sessionId) {
        setStatusText(message);
        const statusKey = `${sessionId}-${status}-${message}`;
        if (status === 'connected' && !statusPrintedRef.current.has(statusKey)) {
          statusPrintedRef.current.add(statusKey);
          term.write(`\r\n\x1b[32m✔ ${message}\x1b[0m\r\n`);
        } else if (status === 'error') {
          term.write(`\r\n\x1b[31m✖ ${message}\x1b[0m\r\n`);
        }
      }
    };

    const authRequiredListener = async ({ sessionId, host, username, message, failedAuthType }) => {
      if (sessionId === activeTab.sessionId) {
        let keys = [];
        try {
          keys = await fetchLocalKeys();
        } catch (e) {}
        setAuthModal({
          sessionId,
          host,
          username,
          message,
          authType: failedAuthType || 'password',
          password: '',
          keyPath: keys.length > 0 ? keys[0].path : '',
          passphrase: '',
          localKeys: keys
        });
      }
    };

    socket.on('terminal:output', outputListener);
    socket.on('terminal:status', statusListener);
    socket.on('terminal:auth-required', authRequiredListener);

    window.addEventListener('resize', syncDimensions);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      inputDisposable.dispose();
      socket.off('terminal:output', outputListener);
      socket.off('terminal:status', statusListener);
      socket.off('terminal:auth-required', authRequiredListener);
      window.removeEventListener('resize', syncDimensions);
      try {
        term.dispose();
      } catch (e) {}
    };
  }, [activeTabId]);

  // Run Snippet inside current terminal
  const handleRunSnippet = (command) => {
    if (!activeTab) return;
    socket.emit('terminal:input', {
      sessionId: activeTab.sessionId,
      data: command + '\r\n',
      protocol: activeTab.config?.protocol || 'ssh'
    });
    setShowSnippets(false);
  };

  if (!tabs || tabs.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Không có Tab Terminal nào đang mở
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Multi-Tab Bar */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: '46px'
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', flex: 1 }}>
          {tabs.map((t) => {
            const isActive = t.sessionId === activeTabId;
            return (
              <div
                key={t.sessionId}
                onClick={() => setActiveTabId(t.sessionId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px 8px 0 0',
                  background: isActive ? 'var(--bg-primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                <TermIcon size={14} color={isActive ? 'var(--accent)' : 'currentColor'} />
                <span>{t.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(t.sessionId);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status Indicator */}
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {statusText}
          </span>

          {/* Snippet Quick Launcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSnippets(!showSnippets)}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <Code2 size={14} color="#818cf8" />
              Run Snippet
            </button>

            {showSnippets && (
              <div
                className="glass-panel animate-fade-in"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '36px',
                  width: '320px',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  borderRadius: '12px',
                  padding: '12px',
                  zIndex: 200,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Click để chạy ngay
                </div>
                {snippets?.map((snip) => (
                  <button
                    key={snip.id}
                    onClick={() => handleRunSnippet(snip.command)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Play size={12} color="#10b981" /> {snip.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                      {snip.command}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <select
            value={themeKey}
            onChange={e => setThemeKey(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            {Object.entries(TERMINAL_THEMES).map(([k, t]) => (
              <option key={k} value={k} style={{ background: '#111622' }}>{t.name}</option>
            ))}
          </select>

          {/* Tạm ẩn SFTP phát triển sau
          {activeTab?.config?.protocol === 'ssh' && (
            <button
              onClick={() => onOpenSftp(activeTab.config)}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              title="SFTP Explorer"
            >
              <FolderGit2 size={14} color="#818cf8" />
              SFTP
            </button>
          )}
          */}
        </div>
      </div>

      {/* Terminal Canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          background: TERMINAL_THEMES[themeKey].background,
          padding: '12px',
          overflow: 'hidden'
        }}
      />

      {/* Interactive SSH Password / Auth Prompt Modal */}
      {authModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '440px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <KeyRound size={22} color="#818cf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                  Yêu Cầu Xác Thực SSH
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {authModal.username}@{authModal.host}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#f8fafc', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
              {authModal.message}
            </p>

            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '16px',
              gap: '6px'
            }}>
              <button
                type="button"
                onClick={() => setAuthModal({ ...authModal, authType: 'password' })}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: (authModal.authType || 'password') === 'password' ? 'var(--accent-primary)' : 'transparent',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13px',
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
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: authModal.authType === 'key' ? 'var(--accent-primary)' : 'transparent',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('terminal.sshKeyTab')}
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              socket.emit('terminal:auth-submit', {
                sessionId: authModal.sessionId,
                authType: authModal.authType || 'password',
                password: authModal.password || '',
                keyPath: authModal.keyPath || '',
                passphrase: authModal.passphrase || ''
              });
              setAuthModal(null);
            }}>
              {(authModal.authType || 'password') === 'password' ? (
                <input
                  type="password"
                  autoFocus
                  placeholder="Nhập mật khẩu SSH..."
                  value={authModal.password}
                  onChange={e => setAuthModal({ ...authModal, password: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-active)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '12px 14px',
                    fontSize: '14px',
                    outline: 'none',
                    marginBottom: '20px'
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Chọn Khóa SSH (từ ~/.ssh)
                    </label>
                    <select
                      value={authModal.keyPath || ''}
                      onChange={e => setAuthModal({ ...authModal, keyPath: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-active)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '10px 14px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="" style={{ background: '#111622' }}>-- Chọn khóa SSH --</option>
                      {(authModal.localKeys || []).map((k, idx) => (
                        <option key={idx} value={k.path} style={{ background: '#111622' }}>
                          🔑 {k.name} ({k.path})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Mật khẩu mở khóa Private Key (Passphrase - để trống nếu không có)
                    </label>
                    <input
                      type="password"
                      placeholder="Mật khẩu mở khóa file Private Key..."
                      value={authModal.passphrase || ''}
                      onChange={e => setAuthModal({ ...authModal, passphrase: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-active)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '10px 14px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAuthModal(null)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Xác nhận & Thử lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
