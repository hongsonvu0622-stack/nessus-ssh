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
import { fetchData, saveData, fetchImportConfig, socket } from './services/socket';
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle, Download } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('hosts');
  const [connections, setConnections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [settings, setSettings] = useState({});

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

  const loadAllData = async () => {
    try {
      const res = await fetchData();
      if (res) {
        setConnections(res.connections || []);
        setGroups(res.groups || []);
        setSnippets(res.snippets || []);
        setSettings(res.settings || {});
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

    const timer = setTimeout(() => {
      if (autoCheckUpdate) {
        socket.emit('updater:check');
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      socket.off('updater:status', onUpdateStatus);
    };
  }, []);

  const persistData = async (newConnections, newGroups, newSnippets) => {
    const payload = {
      connections: newConnections !== undefined ? newConnections : connections,
      groups: newGroups !== undefined ? newGroups : groups,
      snippets: newSnippets !== undefined ? newSnippets : snippets,
      settings
    };
    await saveData(payload);
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

  const handleCloseTab = (sessionId) => {
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
    if (!window.confirm('Bạn có chắc muốn xóa kết nối này?')) return;
    const updated = connections.filter(c => c.id !== id);
    setConnections(updated);
    await persistData(updated);
  };

  // Import ~/.ssh/config
  const handleImportSshConfig = async () => {
    try {
      const imported = await fetchImportConfig();
      if (!imported || imported.length === 0) {
        alert('Không tìm thấy cấu hình Host trong ~/.ssh/config.');
        return;
      }
      const updated = [...imported, ...connections];
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
    const updated = snippets.filter(s => s.id !== id);
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

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
        {activeView === 'hosts' && (
          <HostList
            connections={connections}
            groups={groups}
            onConnectTerminal={handleConnectTerminal}
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
              const updatedGroups = groups.filter(g => g.name !== groupName);
              const updatedConns = connections.map(c => (c.group || 'Default') === groupName ? { ...c, group: 'Default' } : c);
              setGroups(updatedGroups);
              setConnections(updatedConns);
              await persistData(updatedConns, updatedGroups);
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
              <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Cài Đặt & Cập Nhật Phần Mềm</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '13px' }}>
                Quản lý phiên bản, kiểm tra cập nhật mới và cấu hình hệ thống NexusSSH Pro.
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
                      Phiên bản hiện tại: <b style={{ color: '#fff' }}>v{updateInfo?.currentVersion || '1.0.0'}</b>
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
                    <RefreshCw size={15} /> Kiểm tra bản cập nhật mới
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
                      ? `🎉 Phát hiện bản cập nhật mới v${updateInfo.latestVersion} từ GitHub!`
                      : updateInfo.status === 'checking'
                        ? '⏳ Đang kiểm tra phiên bản mới từ GitHub...'
                        : '✔ Bạn đang sử dụng phiên bản mới nhất.'}
                  </span>
                  {updateInfo.status === 'update-available' && (
                    <button
                      onClick={() => setShowUpdateModal(true)}
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Xem chi tiết & Tải về
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
                    Tự động kiểm tra bản cập nhật khi khởi động ứng dụng (Auto-Check Updates)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Ứng dụng tự động thông báo khi có bản phát hành mới trên GitHub Releases.
                  </div>
                </div>
              </label>
            </div>
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
              Phiên bản mới v{updateInfo.latestVersion} đã sẵn sàng!
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>
              Nhấp để xem chi tiết và tải về
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
