import React from 'react';
import { 
  Server, 
  FolderGit2, 
  Code2, 
  KeyRound, 
  Settings, 
  Terminal, 
  Cpu
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function Sidebar({ activeView, setActiveView, activeTabsCount, onOpenNewTerminal }) {
  const { lang, setLang, t } = useI18n();

  const navItems = [
    { id: 'hosts', label: t('sidebar.connections'), icon: Server, badge: null },
    { id: 'sftp', label: t('sidebar.sftp'), icon: FolderGit2, badge: null },
    { id: 'snippets', label: t('sidebar.snippets'), icon: Code2, badge: null },
    { id: 'identities', label: t('sidebar.identities'), icon: KeyRound, badge: null },
    { id: 'settings', label: t('sidebar.settings'), icon: Settings, badge: null },
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      paddingTop: '36px'
    }}>
      {/* Brand Header */}
      <div style={{ padding: '0 20px 24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src="./icon.svg" 
          alt="NexusSSH Logo"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0, 242, 254, 0.3)',
            flexShrink: 0
          }}
        />
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>
            NexusSSH
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Termius macOS Pro
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('sidebar.workspace')}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={18} color={isActive ? '#818cf8' : 'currentColor'} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}

        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', padding: '20px 12px 8px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('sidebar.activeSessions')}
        </div>

        {(() => {
          const isWin = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Win') !== -1;
          if (isWin) {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => onOpenNewTerminal('powershell')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px dashed rgba(99, 102, 241, 0.35)',
                    background: 'rgba(99, 102, 241, 0.05)',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  title="Mở Windows PowerShell"
                >
                  <Terminal size={15} color="#818cf8" />
                  <span style={{ flex: 1, textAlign: 'left' }}>+ PowerShell</span>
                  <span style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    fontSize: '10.5px',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}>
                    PWSH
                  </span>
                </button>

                <button
                  onClick={() => onOpenNewTerminal('cmd')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px dashed rgba(251, 191, 36, 0.35)',
                    background: 'rgba(251, 191, 36, 0.05)',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  title="Mở Command Prompt (cmd.exe)"
                >
                  <Terminal size={15} color="#fbbf24" />
                  <span style={{ flex: 1, textAlign: 'left' }}>+ CMD Prompt</span>
                  <span style={{
                    background: 'rgba(251, 191, 36, 0.2)',
                    color: '#fbbf24',
                    fontSize: '10.5px',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}>
                    CMD
                  </span>
                </button>
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => onOpenNewTerminal('zsh')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px dashed rgba(52, 211, 153, 0.35)',
                  background: 'rgba(52, 211, 153, 0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                title="Mở shell Zsh (/bin/zsh)"
              >
                <Terminal size={15} color="#34d399" />
                <span style={{ flex: 1, textAlign: 'left' }}>+ Zsh Shell</span>
                <span style={{
                  background: 'rgba(52, 211, 153, 0.2)',
                  color: '#34d399',
                  fontSize: '10.5px',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontWeight: 600
                }}>
                  ZSH
                </span>
              </button>

              <button
                onClick={() => onOpenNewTerminal('bash')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px dashed rgba(96, 165, 250, 0.35)',
                  background: 'rgba(96, 165, 250, 0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                title="Mở shell Bash (/bin/bash)"
              >
                <Terminal size={15} color="#60a5fa" />
                <span style={{ flex: 1, textAlign: 'left' }}>+ Bash Shell</span>
                <span style={{
                  background: 'rgba(96, 165, 250, 0.2)',
                  color: '#60a5fa',
                  fontSize: '10.5px',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontWeight: 600
                }}>
                  BASH
                </span>
              </button>
            </div>
          );
        })()}
      </nav>

      {/* Language Switcher */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12.5px'
      }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
          {lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}
        </span>
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setLang('vi')}
            style={{
              border: 'none',
              background: lang === 'vi' ? '#6366f1' : 'transparent',
              color: lang === 'vi' ? '#fff' : 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >VI</button>
          <button
            onClick={() => setLang('en')}
            style={{
              border: 'none',
              background: lang === 'en' ? '#6366f1' : 'transparent',
              color: lang === 'en' ? '#fff' : 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >EN</button>
        </div>
      </div>

      {/* Footer / System Status */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981'
          }} className="pulse-green" />
          <span>macOS Core Active</span>
        </div>
        <span style={{ fontWeight: 600 }}>v1.0 Pro</span>
      </div>
    </aside>
  );
}
