import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import HostList from './components/HostList';
import HostModal from './components/HostModal';
import TerminalTab from './components/TerminalTab';
import SftpBrowser from './components/SftpBrowser';
import SnippetDrawer from './components/SnippetDrawer';
import IdentityManager from './components/IdentityManager';
import SerialScannerModal from './components/SerialScannerModal';
import UpdateModal from './components/UpdateModal';
import CloudSync from './components/CloudSync';
import { useI18n } from './i18n/I18nContext.jsx';
import { fetchData, saveData, fetchImportConfig, socket } from './services/socket';
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle, Download } from 'lucide-react';

export default function App() {
  const { lang, t } = useI18n();
  const [activeView, setActiveView] = useState('hosts');
  const [connections, setConnections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [settings, setSettings] = useState({});
  const [deletedResourceIds, setDeletedResourceIds] = useState([]);

  // Terminal Multi-Tabs
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  // Modals
  const [modalData, setModalData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSerialScanner, setShowSerialScanner] = useState(false);

  // SFTP Explorer target
  const [activeSftpConfig, setActiveSftpConfig] = useState(null);

  // Updater
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [autoCheckUpdate, setAutoCheckUpdate] = useState(true);

  // RDP status notice
  const [rdpNotice, setRdpNotice] = useState(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  const loadAllData = async () => {
    try {
      const res = await fetchData();
      if (res) {
        let loadedConns = res.connections || [];
        let loadedGroups = res.groups || [];
        let loadedSnippets = res.snippets || [];
        let loadedDeletedIds = res.deletedResourceIds || [];
        
        // 30-day Auto-Clear Trash
        const now = Date.now();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        
        const filterTrash = (item) => {
          if (!item.deletedAt) return true;
          if (now - item.deletedAt > THIRTY_DAYS) {
            loadedDeletedIds.push(item.id);
            return false; // Hard delete
          }
          return true; // Keep in trash
        };

        loadedConns = loadedConns.filter(filterTrash);
        loadedGroups = loadedGroups.filter(filterTrash);
        loadedSnippets = loadedSnippets.filter(filterTrash);

        setConnections(loadedConns);
        setGroups(loadedGroups);
        setSnippets(loadedSnippets);
        setDeletedResourceIds(loadedDeletedIds);
        setSettings(res.settings || {});
        
        // Auto-save if anything was hard-deleted by auto-clear
        if (loadedDeletedIds.length > (res.deletedResourceIds?.length || 0)) {
          persistData(loadedConns, loadedGroups, loadedSnippets, res.settings, loadedDeletedIds);
        }
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  useEffect(() => {
    loadAllData();

    const onUpdateStatus = (info) => {
      setUpdateInfo(info);
    };

    socket.on('updater:status', onUpdateStatus);

    const onRdpLaunching = ({ host }) => {
      setRdpNotice({ type: 'info', message: `${t('hostModal.rdpLaunching')} (${host})` });
    };
    const onRdpLaunched = (res) => {
      const msg = res && res.copiedPassword ? t('hostModal.rdpLaunchedCopied') : t('hostModal.rdpLaunched');
      setRdpNotice({ type: 'success', message: msg });
      setTimeout(() => setRdpNotice(null), res && res.copiedPassword ? 6500 : 3500);
    };
    const onRdpError = ({ message }) => {
      setRdpNotice({ type: 'error', message: `RDP Error: ${message}` });
      setTimeout(() => setRdpNotice(null), 6000);
    };

    socket.on('rdp:launching', onRdpLaunching);
    socket.on('rdp:launched', onRdpLaunched);
    socket.on('rdp:error', onRdpError);

    const onDataUpdate = (data) => {
      if (data) {
        let loadedConns = data.connections || [];
        let loadedGroups = data.groups || [];
        let loadedSnippets = data.snippets || [];
        let loadedDeletedIds = data.deletedResourceIds || [];
        
        const now = Date.now();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        let needsSave = false;
        
        const filterTrash = (item) => {
          if (!item.deletedAt) return true;
          if (now - item.deletedAt > THIRTY_DAYS) {
            loadedDeletedIds.push(item.id);
            needsSave = true;
            return false;
          }
          return true;
        };

        loadedConns = loadedConns.filter(filterTrash);
        loadedGroups = loadedGroups.filter(filterTrash);
        loadedSnippets = loadedSnippets.filter(filterTrash);

        setConnections(loadedConns);
        setGroups(loadedGroups);
        setSnippets(loadedSnippets);
        setDeletedResourceIds(loadedDeletedIds);
        setSettings(data.settings || {});
        
        if (needsSave) {
          persistData(loadedConns, loadedGroups, loadedSnippets, undefined, loadedDeletedIds);
        }
      }
    };

    socket.on('data:update', onDataUpdate);

    const onSyncSuccess = () => setIsSyncing(false);
    const onSyncError = () => setIsSyncing(false);
    
    socket.on('sync:success', onSyncSuccess);
    socket.on('sync:error', onSyncError);

    const timer = setTimeout(() => {
      if (autoCheckUpdate) {
        socket.emit('updater:check');
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      socket.off('updater:status', onUpdateStatus);
      socket.off('rdp:launching', onRdpLaunching);
      socket.off('rdp:launched', onRdpLaunched);
      socket.off('rdp:error', onRdpError);
      socket.off('data:update', onDataUpdate);
      socket.off('sync:success', onSyncSuccess);
      socket.off('sync:error', onSyncError);
    };
  }, []);

  const persistData = async (newConnections, newGroups, newSnippets, newSettings, newDeletedIds) => {
    const payload = {
      connections: newConnections !== undefined ? newConnections : connections,
      groups: newGroups !== undefined ? newGroups : groups,
      snippets: newSnippets !== undefined ? newSnippets : snippets,
      settings: newSettings !== undefined ? newSettings : settings,
      deletedResourceIds: newDeletedIds !== undefined ? newDeletedIds : deletedResourceIds
    };
    await saveData(payload);
    if (socket) {
      socket.emit('sync:force', { skipPull: true });
    }
  };

  // Connect & open terminal tab
  const handleConnectTerminal = (config) => {
    const sessionId = 'tab-' + Math.random().toString(36).substring(2, 9);
    const newTab = {
      sessionId,
      title: config.name || config.host || config.serialPath || 'Session',
      config
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(sessionId);
    setActiveView('terminal');
  };

  const handleRdpConnect = (config) => {
    setRdpNotice({ type: 'info', message: `${t('hostModal.rdpLaunching')} (${config.host})` });
    socket.emit('rdp:connect', config);
  };

  const handleCloseTab = (sessionId) => {
    const targetTab = tabs.find(t => t.sessionId === sessionId);
    if (targetTab) {
      socket.emit('terminal:disconnect', {
        sessionId,
        protocol: targetTab.config?.protocol || 'ssh'
      });
    }
    setTabs(prev => {
      const remaining = prev.filter(t => t.sessionId !== sessionId);
      if (activeTabId === sessionId) {
        setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1].sessionId : null);
        if (remaining.length === 0) {
          setActiveView('hosts');
        }
      }
      return remaining;
    });
  };

  // Open SFTP Explorer
  const handleOpenSftp = (config) => {
    setActiveSftpConfig(config);
    setActiveView('sftp');
  };

  // Save / Update connection
  const handleSaveConnection = async (conn) => {
    conn.updatedAt = Date.now();
    const exists = connections.find(c => c.id === conn.id);
    let updated;
    if (exists) {
      updated = connections.map(c => c.id === conn.id ? conn : c);
    } else {
      updated = [conn, ...connections];
    }
    setConnections(updated);
    setShowModal(false);
    await persistData(updated);
  };

  const handleDeleteConnection = async (id) => {
    if (!window.confirm('Đưa máy chủ này vào Thùng rác?')) return;
    const updated = connections.map(c => c.id === id ? { ...c, deletedAt: Date.now(), updatedAt: Date.now() } : c);
    setConnections(updated);
    await persistData(updated);
  };

  const handleRestoreConnection = async (id) => {
    const updated = connections.map(c => {
      if (c.id === id) {
        const { deletedAt, ...rest } = c;
        rest.updatedAt = Date.now();
        return rest;
      }
      return c;
    });
    setConnections(updated);
    await persistData(updated);
  };

  const handleHardDeleteConnection = async (id) => {
    if (!window.confirm('Máy chủ này sẽ bị xóa vĩnh viễn và không thể khôi phục. Tiếp tục?')) return;
    const updated = connections.filter(c => c.id !== id);
    const newDeletedIds = [...deletedResourceIds, id];
    setConnections(updated);
    setDeletedResourceIds(newDeletedIds);
    await persistData(updated, undefined, undefined, undefined, newDeletedIds);
  };

  // Import ~/.ssh/config
  const handleImportSshConfig = async () => {
    try {
      const imported = await fetchImportConfig();
      if (!imported || imported.length === 0) {
        alert('Không tìm thấy cấu hình Host trong ~/.ssh/config.');
        return;
      }
      const now = Date.now();
      const updatedImported = imported.map(c => ({ ...c, updatedAt: now }));
      const updated = [...updatedImported, ...connections];
      setConnections(updated);
      await persistData(updated);
      alert(`✔ Đã nhập tự động ${imported.length} kết nối từ ~/.ssh/config!`);
    } catch (e) {
      alert('Lỗi import cấu hình: ' + e.message);
    }
  };

  // Snippet management
  const handleSaveSnippet = async (snip) => {
    const updated = [snip, ...snippets];
    setSnippets(updated);
    await persistData(undefined, undefined, updated);
  };

  const handleDeleteSnippet = async (id) => {
    const updated = snippets.map(s => s.id === id ? { ...s, deletedAt: Date.now() } : s);
    setSnippets(updated);
    await persistData(undefined, undefined, updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Draggable Window Top Title Bar */}
      <div
        style={{
          height: '34px',
          minHeight: '34px',
          width: '100%',
          background: '#0c101a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          WebkitAppRegion: 'drag',
          userSelect: 'none',
          position: 'relative',
          zIndex: 9999
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.4px', opacity: 0.85 }}>
          NexusSSH Pro
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        activeTabsCount={tabs.length}
        hasNewUpdate={updateInfo?.status === 'update-available'}
        onCheckUpdate={() => {
          socket.emit('updater:check');
          setShowUpdateModal(true);
        }}
        onOpenNewTerminal={(shellType = 'zsh') => {
          let name = 'Local Shell';
          let shell = '/bin/zsh';
          if (shellType === 'powershell') {
            name = 'Windows PowerShell';
            shell = 'powershell.exe';
          } else if (shellType === 'cmd') {
            name = 'Command Prompt';
            shell = 'cmd.exe';
          } else if (shellType === 'bash') {
            name = 'Bash Shell';
            shell = '/bin/bash';
          } else {
            name = 'Zsh Shell';
            shell = '/bin/zsh';
          }
          handleConnectTerminal({
            name,
            protocol: 'local',
            shell,
            shellType
          });
        }}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)', position: 'relative' }}>
        {rdpNotice && (
          <div
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: '16px',
              right: '20px',
              zIndex: 999,
              padding: '12px 18px',
              borderRadius: '10px',
              background: rdpNotice.type === 'error' ? 'rgba(239, 68, 68, 0.92)' : rdpNotice.type === 'success' ? 'rgba(16, 185, 129, 0.92)' : 'rgba(14, 165, 233, 0.92)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>{rdpNotice.message}</span>
            <button
              onClick={() => setRdpNotice(null)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
            >
              ×
            </button>
          </div>
        )}

        {activeView === 'hosts' && (
          <HostList
            connections={connections}
            groups={groups}
            onConnectTerminal={handleConnectTerminal}
            onRdpConnect={handleRdpConnect}
            onOpenSftp={handleOpenSftp}
            onOpenModal={(data) => {
              setModalData(data);
              setShowModal(true);
            }}
            onDeleteConnection={handleDeleteConnection}
            onScanSerial={() => setShowSerialScanner(true)}
            onImportSshConfig={handleImportSshConfig}
            onSaveBatch={async (newConns, newGroups) => {
              setConnections(newConns);
              if (newGroups) setGroups(newGroups);
              await persistData(newConns, newGroups);
            }}
            onCreateGroup={async (groupName) => {
              if (groups.some(g => g.name === groupName)) return;
              const updatedGroups = [...groups, { name: groupName }];
              setGroups(updatedGroups);
              await persistData(undefined, updatedGroups);
            }}
            onRenameGroup={async (oldName, newName) => {
              const updatedGroups = groups.map(g => g.name === oldName ? { ...g, name: newName } : g);
              const updatedConns = connections.map(c => (c.group || 'Default') === oldName ? { ...c, group: newName } : c);
              setGroups(updatedGroups);
              setConnections(updatedConns);
              await persistData(updatedConns, updatedGroups);
            }}
            onDeleteGroup={async (groupName) => {
              const now = Date.now();
              const updatedGroups = groups.map(g => g.name === groupName ? { ...g, deletedAt: now, updatedAt: now } : g);
              const updatedConns = connections.map(c => (c.group || 'Default') === groupName ? { ...c, deletedAt: now, updatedAt: now } : c);
              setGroups(updatedGroups);
              setConnections(updatedConns);
              await persistData(updatedConns, updatedGroups);
            }}
            onRestoreGroup={async (groupName) => {
              const now = Date.now();
              const updatedGroups = groups.map(g => {
                if (g.name === groupName) {
                  const { deletedAt, ...rest } = g;
                  rest.updatedAt = now;
                  return rest;
                }
                return g;
              });
              const updatedConns = connections.map(c => {
                if ((c.group || 'Default') === groupName) {
                  const { deletedAt, ...rest } = c;
                  rest.updatedAt = now;
                  return rest;
                }
                return c;
              });
              setGroups(updatedGroups);
              setConnections(updatedConns);
              await persistData(updatedConns, updatedGroups);
            }}
            onHardDeleteGroup={async (groupName) => {
              if (!window.confirm(`Thư mục "${groupName}" và toàn bộ máy chủ bên trong sẽ bị xóa vĩnh viễn. Tiếp tục?`)) return;
              
              const groupObj = groups.find(g => g.name === groupName);
              const connsToDrop = connections.filter(c => (c.group || 'Default') === groupName);
              
              const updatedGroups = groups.filter(g => g.name !== groupName);
              const updatedConns = connections.filter(c => (c.group || 'Default') !== groupName);
              
              const idsToRemove = connsToDrop.map(c => c.id);
              if (groupObj && groupObj.id) idsToRemove.push(groupObj.id);
              
              const newDeletedIds = [...deletedResourceIds, ...idsToRemove];
              
              setGroups(updatedGroups);
              setConnections(updatedConns);
              setDeletedResourceIds(newDeletedIds);
              await persistData(updatedConns, updatedGroups, undefined, undefined, newDeletedIds);
            }}
            onRestoreConnection={handleRestoreConnection}
            onHardDeleteConnection={handleHardDeleteConnection}
            isSyncing={isSyncing}
            onQuickSync={() => {
              setIsSyncing(true);
              socket.emit('sync:force');
            }}
          />
        )}

        {activeView === 'terminal' && (
          <TerminalTab
            tabs={tabs}
            activeTabId={activeTabId}
            setActiveTabId={setActiveTabId}
            onCloseTab={handleCloseTab}
            snippets={snippets}
            onOpenSftp={handleOpenSftp}
            settings={settings}
          />
        )}

        {activeView === 'sftp' && (
          <SftpBrowser
            activeConfig={activeSftpConfig}
            connections={connections.filter(c => (c.protocol || 'ssh') === 'ssh')}
            onSelectServer={(conn) => setActiveSftpConfig(conn)}
            onClose={() => setActiveView('hosts')}
          />
        )}

        {activeView === 'snippets' && (
          <SnippetDrawer
            snippets={snippets}
            onSaveSnippet={handleSaveSnippet}
            onDeleteSnippet={handleDeleteSnippet}
          />
        )}

        {activeView === 'identities' && (
          <IdentityManager />
        )}

        {activeView === 'settings' && (
          <div style={{ padding: '32px 36px', color: '#fff', maxWidth: '850px', overflowY: 'auto' }}>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{t('app.settingsTitle')}</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '13px' }}>
                {t('app.settingsSubTitle')}
              </p>
            </div>

            {/* Software Update Card */}
            <div className="glass-panel" style={{
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border-color)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Sparkles size={26} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                      NexusSSH Pro — Cyber Glass Edition
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {t('updateModal.currentVersion')} <b style={{ color: '#fff' }}>v{updateInfo?.currentVersion || '1.0.0'}</b>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      socket.emit('updater:check');
                      setShowUpdateModal(true);
                    }}
                    className="btn-primary"
                    style={{ fontSize: '13px', padding: '10px 18px' }}
                  >
                    <RefreshCw size={15} /> {t('app.checkNewUpdateBtn')}
                  </button>
                </div>
              </div>

              {updateInfo && (
                <div style={{
                  marginTop: '18px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: updateInfo.status === 'update-available' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.04)',
                  border: updateInfo.status === 'update-available' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '13px', color: '#fff' }}>
                    {updateInfo.status === 'update-available'
                      ? `${lang === 'vi' ? '🎉 Phát hiện bản cập nhật mới' : '🎉 New release available'} v${updateInfo.latestVersion}!`
                      : updateInfo.status === 'checking'
                        ? t('app.checkingUpdate')
                        : t('app.latestVersionMsg')}
                  </span>
                  {updateInfo.status === 'update-available' && (
                    <button
                      onClick={() => setShowUpdateModal(true)}
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      {t('app.viewAndDownload')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Auto Update Preference Card */}
            <div className="glass-panel" style={{
              borderRadius: '16px',
              padding: '20px 24px',
              border: '1px solid var(--border-color)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoCheckUpdate}
                  onChange={e => setAutoCheckUpdate(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                    {t('app.autoCheckTitle')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {t('app.autoCheckDesc')}
                  </div>
                </div>
              </label>
            </div>

            {/* Terminal Behavior Settings Card */}
            <div className="glass-panel" style={{
              borderRadius: '16px',
              padding: '20px 24px',
              border: '1px solid var(--border-color)',
              marginTop: '16px'
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
                {lang === 'vi' ? '⚙️ Cài đặt Terminal & Trải nghiệm' : '⚙️ Terminal & UX Preferences'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings?.autoCopyOnSelect !== false}
                    onChange={async (e) => {
                      const updated = { ...settings, autoCopyOnSelect: e.target.checked };
                      setSettings(updated);
                      await persistData(undefined, undefined, undefined, updated);
                    }}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                      {lang === 'vi' ? 'Tự động sao chép khi bôi đen (Auto-copy on select)' : 'Auto-copy selected text'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? 'Tự động chép văn bản vào Clipboard ngay khi bôi đen trong Terminal.' : 'Automatically copy selected text in terminal to system clipboard.'}
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings?.rightClickPaste !== false}
                    onChange={async (e) => {
                      const updated = { ...settings, rightClickPaste: e.target.checked };
                      setSettings(updated);
                      await persistData(undefined, undefined, undefined, updated);
                    }}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                      {lang === 'vi' ? 'Click chuột phải để dán / bỏ chọn (Right-click to paste)' : 'Right-click to paste or clear selection'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? 'Chuột phải dán nội dung từ Clipboard (nếu không bôi đen) hoặc bỏ vùng đang bôi đen.' : 'Right-click to paste clipboard content or clear highlighted selection.'}
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Cloud Sync Integration Card */}
            <CloudSync settings={settings} setSettings={setSettings} persistData={persistData} />
          </div>
        )}
      </main>

      {/* Floating Notification Banner when New Update Available */}
      {updateInfo?.status === 'update-available' && !showUpdateModal && (
        <div
          onClick={() => setShowUpdateModal(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            borderRadius: '14px',
            padding: '12px 18px',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 2500,
            transition: 'transform 0.2s',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}
        >
          <Sparkles size={18} color="#fff" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              {`${lang === 'vi' ? 'Phiên bản mới' : 'New version'} v${updateInfo.latestVersion} ${lang === 'vi' ? 'đã sẵn sàng!' : 'is available!'}`}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>
              {t('app.bannerClick')}
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <UpdateModal
          updateInfo={updateInfo}
          onClose={() => setShowUpdateModal(false)}
          onCheckAgain={() => socket.emit('updater:check')}
        />
      )}

      {/* Connection Create/Edit Modal */}
      {showModal && (
        <HostModal
          initialData={modalData}
          groups={groups}
          onClose={() => setShowModal(false)}
          onSave={handleSaveConnection}
        />
      )}

      {/* Serial Port Scanner Modal */}
      {showSerialScanner && (
        <SerialScannerModal
          onClose={() => setShowSerialScanner(false)}
          onSaveConnection={handleSaveConnection}
          onConnectDirect={handleConnectTerminal}
        />
      )}
      </div>
    </div>
  );
}
