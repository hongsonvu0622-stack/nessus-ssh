import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import HostList from './components/HostList';
import HostModal from './components/HostModal';
import TerminalTab from './components/TerminalTab';
import SftpBrowser from './components/SftpBrowser';
import SnippetDrawer from './components/SnippetDrawer';
import IdentityManager from './components/IdentityManager';
import SerialScannerModal from './components/SerialScannerModal';
import { fetchData, saveData, fetchImportConfig } from './services/socket';

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
          <div style={{ padding: '32px', color: '#fff' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Settings</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
              NexusSSH v1.0.0 Pro - Cấu hình ứng dụng, phím tắt và tuỳ chọn giao diện.
            </p>
          </div>
        )}
      </main>

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
