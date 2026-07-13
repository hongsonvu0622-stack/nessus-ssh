import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Terminal, 
  FolderGit2, 
  Edit3, 
  Trash2, 
  Usb, 
  Download, 
  Server, 
  Cpu, 
  Tag, 
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  FileJson,
  LayoutGrid,
  FolderTree,
  MoreVertical,
  X,
  AlertTriangle,
  Monitor
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function HostList({
  connections,
  groups,
  onConnectTerminal,
  onOpenSftp,
  onOpenModal,
  onDeleteConnection,
  onScanSerial,
  onImportSshConfig,
  onSaveBatch,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onRdpConnect
}) {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState('');
  const [filterProtocol, setFilterProtocol] = useState('all'); // all, ssh, serial, local, rdp
  const [filterGroup, setFilterGroup] = useState('all');

  // View mode: 'folder' or 'grid'
  const [viewMode, setViewMode] = useState('folder');
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [activeFolderMenu, setActiveFolderMenu] = useState(null);
  const fileInputRef = useRef(null);

  // Custom React Modals (works perfectly in Electron without window.prompt block)
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [renameModal, setRenameModal] = useState(null); // { oldName: string, newName: string }
  const [deleteModal, setDeleteModal] = useState(null); // { groupName: string, count: number }
  const [importPreviewModal, setImportPreviewModal] = useState(null); // { fileName, connections, groups }
  const [selectedImportIndices, setSelectedImportIndices] = useState([]);

  const toggleFolder = (groupName) => {
    setCollapsedFolders(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const filtered = connections.filter(conn => {
    const matchesSearch = 
      conn.name?.toLowerCase().includes(search.toLowerCase()) ||
      conn.host?.toLowerCase().includes(search.toLowerCase()) ||
      conn.serialPath?.toLowerCase().includes(search.toLowerCase()) ||
      conn.group?.toLowerCase().includes(search.toLowerCase());

    const matchesProtocol = 
      filterProtocol === 'all' || conn.protocol === filterProtocol;

    const matchesGroup = 
      filterGroup === 'all' || conn.group === filterGroup;

    return matchesSearch && matchesProtocol && matchesGroup;
  });

  // Unique Group Names
  const groupNames = Array.from(new Set([
    'Production',
    ...groups.map(g => g.name),
    ...connections.map(c => c.group || 'Production')
  ])).filter(Boolean);

  // Submit Create Group
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    await onCreateGroup(trimmed);
    setNewGroupName('');
    setCreateGroupModal(false);
  };

  // Submit Rename Group
  const handleRenameGroupSubmit = async (e) => {
    e.preventDefault();
    if (!renameModal || !renameModal.newName.trim()) return;
    await onRenameGroup(renameModal.oldName, renameModal.newName.trim());
    setRenameModal(null);
  };

  // Submit Delete Group
  const handleDeleteGroupSubmit = async () => {
    if (!deleteModal) return;
    await onDeleteGroup(deleteModal.groupName);
    setDeleteModal(null);
  };

  // Download Excel Import Template
  const handleDownloadTemplate = () => {
    setShowImportMenu(false);
    const templateRows = [
      {
        Name: 'Production Web Server',
        Protocol: 'SSH',
        Host: '192.168.1.100',
        Port: 22,
        Username: 'root',
        Password: 'YourPassword123',
        Group: 'Production',
        Tags: 'web, linux, nginx',
        Notes: 'Máy chủ web chính chạy Ubuntu 22.04'
      },
      {
        Name: 'Cisco Core Switch Console',
        Protocol: 'SERIAL',
        Host: '/dev/cu.usbserial-A9007UX',
        Port: '',
        Username: '',
        Password: '',
        Group: 'Network Devices',
        Tags: 'cisco, switch, core',
        Notes: 'Cáp USB Console cắm vào Switch Core'
      },
      {
        Name: 'Local macOS / Windows Shell',
        Protocol: 'LOCAL',
        Host: '/bin/zsh',
        Port: '',
        Username: '',
        Password: '',
        Group: 'Local Shells',
        Tags: 'local, terminal',
        Notes: 'Terminal nội bộ của máy tính'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    worksheet['!cols'] = [
      { wch: 26 }, // Name
      { wch: 12 }, // Protocol
      { wch: 26 }, // Host
      { wch: 8 },  // Port
      { wch: 14 }, // Username
      { wch: 18 }, // Password
      { wch: 18 }, // Group
      { wch: 22 }, // Tags
      { wch: 38 }  // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NexusSSH_Template');
    XLSX.writeFile(workbook, 'NexusSSH_Import_Template.xlsx');
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    setShowExportMenu(false);
    const rows = connections.map(c => ({
      Name: c.name || '',
      Host: c.host || c.serialPath || '',
      Port: c.port || 22,
      Username: c.username || 'root',
      Protocol: (c.protocol || 'ssh').toUpperCase(),
      Group: c.group || 'Production',
      Tags: (c.tags || []).join(', '),
      Notes: c.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NexusSSH_Hosts');
    XLSX.writeFile(workbook, `nexusssh_hosts_backup_${Date.now()}.xlsx`);
  };

  // Export JSON Backup
  const handleExportJson = () => {
    setShowExportMenu(false);
    const payload = { connections, groups, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexusssh_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Excel (.xlsx/.csv) or JSON
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (Array.isArray(data.connections) && data.connections.length > 0) {
            setImportPreviewModal({
              fileName: file.name,
              connections: data.connections,
              groups: data.groups || groups
            });
            setSelectedImportIndices(data.connections.map((_, idx) => idx));
          } else {
            alert('File JSON backup không chứa danh sách kết nối hợp lệ.');
          }
        } catch (err) {
          alert('Lỗi đọc file JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
      return;
    }

    // Excel or CSV import
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!rows || rows.length === 0) {
          alert('File Excel không có dữ liệu kết nối.');
          return;
        }

        const importedConns = rows.map((row, idx) => {
          const proto = (row.Protocol || row['Giao thức'] || 'ssh').toString().toLowerCase();
          return {
            id: 'excel-' + Date.now() + '-' + idx,
            name: row.Name || row['Tên'] || row.Host || `Host ${idx + 1}`,
            protocol: proto === 'serial' ? 'serial' : proto === 'local' ? 'local' : 'ssh',
            host: row.Host || row['IP'] || row['Máy chủ'] || '',
            port: parseInt(row.Port || row['Cổng'], 10) || 22,
            username: row.Username || row['User'] || row['Tài khoản'] || 'root',
            password: row.Password || row['Mật khẩu'] || '',
            group: row.Group || row['Nhóm'] || row['Thư mục'] || 'Imported Excel',
            tags: (row.Tags || row['Thẻ'] || 'Excel').toString().split(',').map(t => t.trim()).filter(Boolean),
            notes: row.Notes || row['Ghi chú'] || '',
            status: 'offline'
          };
        });

        const newGroupsList = [...groups];
        importedConns.forEach(c => {
          if (!newGroupsList.some(g => g.name === c.group)) {
            newGroupsList.push({ name: c.group });
          }
        });

        setImportPreviewModal({
          fileName: file.name,
          connections: importedConns,
          groups: newGroupsList
        });
        setSelectedImportIndices(importedConns.map((_, idx) => idx));
      } catch (err) {
        alert('Lỗi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importPreviewModal) return;
    const selectedConns = importPreviewModal.connections.filter((_, idx) => selectedImportIndices.includes(idx));
    if (selectedConns.length === 0) {
      alert('Vui lòng chọn ít nhất 1 kết nối để Import!');
      return;
    }

    const updatedConns = [...selectedConns, ...connections];
    await onSaveBatch(updatedConns, importPreviewModal.groups);
    setImportPreviewModal(null);
    setSelectedImportIndices([]);
  };

  const renderHostCard = (conn) => (
    <div
      key={conn.id}
      className="glass-panel"
      style={{
        padding: '16px 18px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '12px',
        border: '1px solid var(--border-color)',
        transition: 'border-color 0.2s, transform 0.15s',
        background: 'rgba(17, 22, 34, 0.75)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: conn.protocol === 'serial' 
              ? 'rgba(139, 92, 246, 0.18)' 
              : conn.protocol === 'local'
              ? 'rgba(16, 185, 129, 0.18)'
              : 'rgba(99, 102, 241, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {conn.protocol === 'serial' ? (
              <Usb size={19} color="#a78bfa" />
            ) : conn.protocol === 'local' ? (
              <Cpu size={19} color="#10b981" />
            ) : (
              <Server size={19} color="#818cf8" />
            )}
          </div>

          <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {conn.name}
              </h3>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: '4px',
                background: conn.protocol === 'serial' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(99, 102, 241, 0.25)',
                color: conn.protocol === 'serial' ? '#c4b5fd' : '#a5b4fc',
                flexShrink: 0
              }}>
                {conn.protocol}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {conn.protocol === 'serial' 
                ? `${conn.serialPath} (${conn.baudRate || 9600} baud)`
                : conn.protocol === 'local'
                ? 'Local macOS Shell (/bin/zsh)'
                : `${conn.username || 'root'}@${conn.host}:${conn.port || 22}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => onOpenModal(conn)}
            className="btn-icon"
            title="Chỉnh sửa kết nối"
          >
            <Edit3 size={15} />
          </button>
          <button
            onClick={() => onDeleteConnection(conn.id)}
            className="btn-icon"
            title="Xóa kết nối"
            style={{ color: 'var(--danger)' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {conn.tags && conn.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {conn.tags.map((tag, idx) => (
            <span key={idx} style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Tag size={11} />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {conn.protocol === 'rdp' ? (
          <button
            onClick={() => onRdpConnect && onRdpConnect(conn)}
            className="btn-primary"
            style={{ flex: 1, fontSize: '13px', padding: '8px 14px', background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', borderColor: '#0ea5e9' }}
          >
            <Monitor size={15} />
            {t('hostModal.rdpConnectBtn')}
          </button>
        ) : (
          <button
            onClick={() => onConnectTerminal(conn)}
            className="btn-primary"
            style={{ flex: 1, fontSize: '13px', padding: '8px 14px' }}
          >
            <Terminal size={15} />
            {t('hostList.openTerminalBtn')}
          </button>
        )}

        {/* Tạm ẩn tính năng SFTP phát triển sau
        {conn.protocol === 'ssh' && (
          <button
            onClick={() => onOpenSftp(conn)}
            className="btn-secondary"
            style={{ padding: '8px 12px' }}
            title="Trình duyệt file SFTP"
          >
            <FolderGit2 size={16} color="#818cf8" />
          </button>
        )}
        */}
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Hidden File Picker for Import Excel/JSON */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls,.csv,.json"
        style={{ display: 'none' }}
      />

      {/* Top Header Controls */}
      <div style={{
        padding: '20px 28px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
              {t('hostList.pageTitle')}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t('hostList.pageSubTitle')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
            {/* View Mode Switch */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <button
                onClick={() => setViewMode('folder')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 11px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'folder' ? 'var(--accent)' : 'transparent',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <FolderTree size={14} /> {t('hostList.byFolder')}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 11px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'grid' ? 'var(--accent)' : 'transparent',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <LayoutGrid size={14} /> {t('hostList.allHostsGrid')}
              </button>
            </div>

            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setShowImportMenu(!showImportMenu)}
                className="btn-secondary"
                style={{ fontSize: '12.5px', padding: '7px 11px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <Upload size={14} color="#10b981" />
                <span>Import</span>
              </button>

              {showImportMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '6px',
                  background: '#151b2b',
                  border: '1px solid var(--border-active)',
                  borderRadius: '10px',
                  padding: '6px',
                  zIndex: 100,
                  width: '230px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                }}>
                  <button
                    onClick={() => {
                      setShowImportMenu(false);
                      fileInputRef.current?.click();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '9px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12.5px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '6px'
                    }}
                  >
                    <Upload size={15} color="#10b981" /> Tải lên File (.xlsx / .json)
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '9px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12.5px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '6px'
                    }}
                  >
                    <FileSpreadsheet size={15} color="#fbbf24" /> Tải File Mẫu (.xlsx)
                  </button>
                </div>
              )}
            </div>

            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn-secondary"
                style={{ fontSize: '12.5px', padding: '7px 11px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <Download size={14} color="#38bdf8" />
                <span>Export</span>
              </button>

              {showExportMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '6px',
                  background: '#151b2b',
                  border: '1px solid var(--border-active)',
                  borderRadius: '10px',
                  padding: '6px',
                  zIndex: 100,
                  width: '200px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                }}>
                  <button
                    onClick={handleExportExcel}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '9px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12.5px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '6px'
                    }}
                  >
                    <FileSpreadsheet size={15} color="#10b981" /> Xuất Excel (.xlsx)
                  </button>
                  <button
                    onClick={handleExportJson}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '9px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12.5px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '6px'
                    }}
                  >
                    <FileJson size={15} color="#38bdf8" /> Xuất Backup (.json)
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onScanSerial}
              className="btn-secondary"
              style={{
                fontSize: '12.5px',
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'rgba(167, 139, 250, 0.4)',
                color: '#a78bfa',
                background: 'rgba(167, 139, 250, 0.08)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              title={t('hostList.scanSerialTooltip')}
            >
              <Usb size={15} />
              <span>{t('hostList.scanSerial')}</span>
            </button>

            <button
              onClick={() => onOpenModal(null)}
              className="btn-primary"
              style={{ fontSize: '13px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <Plus size={16} />
              <span>{t('hostList.newConnection')}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ position: 'relative', width: '340px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('hostList.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px', height: '36px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: '8px' }}>
              {[
                { id: 'all', label: t('hostList.filterAll') },
                { id: 'ssh', label: t('hostList.filterSsh') },
                { id: 'serial', label: t('hostList.filterSerial') },
                // { id: 'rdp', label: t('hostList.filterRdp') }, // Tạm ẩn RDP
                { id: 'local', label: t('hostList.filterLocal') }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setFilterProtocol(item.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: filterProtocol === item.id ? 'var(--accent)' : 'transparent',
                    color: filterProtocol === item.id ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* CREATE FOLDER BUTTON - Opens custom React modal */}
            <button
              onClick={() => setCreateGroupModal(true)}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 14px', background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc' }}
            >
              <Folder size={14} color="#818cf8" /> {t('hostList.createGroupBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }} onClick={() => setActiveFolderMenu(null)}>
        {viewMode === 'folder' ? (
          /* FOLDER / GROUP ACCORDION TREE VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {groupNames.map(gName => {
              const groupHosts = filtered.filter(c => (c.group || 'Production') === gName);
              if (groupHosts.length === 0 && search.trim() !== '') return null;

              const isCollapsed = collapsedFolders[gName];

              return (
                <div key={gName} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Folder Header Banner */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onClick={() => toggleFolder(gName)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isCollapsed ? <ChevronRight size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                      {isCollapsed ? <Folder size={20} color="#fbbf24" /> : <FolderOpen size={20} color="#fbbf24" />}
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                        {gName}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'rgba(251, 191, 36, 0.15)',
                        color: '#fbbf24',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        {groupHosts.length} {t('hostList.serverCount')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenModal({ group: gName, protocol: 'ssh' })}
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 12px' }}
                      >
                        <Plus size={13} /> {t('hostList.addHostBtn')}
                      </button>

                      {/* 3-DOT MENU BUTTON */}
                      <button
                        onClick={() => setActiveFolderMenu(activeFolderMenu === gName ? null : gName)}
                        className="btn-icon"
                        title="Tùy chọn thư mục"
                        style={{
                          width: '32px',
                          height: '32px',
                          background: activeFolderMenu === gName ? 'rgba(255,255,255,0.15)' : 'transparent',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none'
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeFolderMenu === gName && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: '6px',
                          background: '#151b2b',
                          border: '1px solid var(--border-active)',
                          borderRadius: '10px',
                          padding: '6px',
                          zIndex: 100,
                          width: '185px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                        }}>
                          <button
                            onClick={() => {
                              setActiveFolderMenu(null);
                              setRenameModal({ oldName: gName, newName: gName });
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              width: '100%',
                              padding: '8px 10px',
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              fontSize: '13px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              borderRadius: '6px'
                            }}
                          >
                            <Edit3 size={15} color="#38bdf8" /> Đổi tên thư mục
                          </button>

                          {gName !== 'Production' && (
                            <button
                              onClick={() => {
                                setActiveFolderMenu(null);
                                setDeleteModal({ groupName: gName, count: groupHosts.length });
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '8px 10px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--danger)',
                                fontSize: '13px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: '6px'
                              }}
                            >
                              <Trash2 size={15} /> Xóa thư mục
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Indented Hosts Grid inside Folder */}
                  {!isCollapsed && (
                    <div style={{
                      paddingLeft: '22px',
                      borderLeft: '2px solid rgba(251, 191, 36, 0.22)',
                      marginLeft: '12px'
                    }}>
                      {groupHosts.length === 0 ? (
                        <div style={{
                          padding: '16px 20px',
                          background: 'rgba(255,255,255,0.015)',
                          borderRadius: '10px',
                          border: '1px dashed rgba(255,255,255,0.08)',
                          color: 'var(--text-muted)',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>{t('hostList.emptyFolderMsg')}</span>
                          <button
                            onClick={() => onOpenModal({ group: gName, protocol: 'ssh' })}
                            className="btn-secondary"
                            style={{ fontSize: '12px', padding: '4px 10px' }}
                          >
                            {t('hostList.addHostToGroupBtn')}
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                          gap: '14px'
                        }}>
                          {groupHosts.map(conn => renderHostCard(conn))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* FLAT GRID VIEW */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {filtered.map(conn => renderHostCard(conn))}
          </div>
        )}
      </div>

      {/* CREATE FOLDER MODAL */}
      {createGroupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-glass" style={{
            width: '440px',
            padding: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Folder size={22} color="#fbbf24" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                    Tạo Thư mục Nhóm mới
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Phân loại máy chủ SSH/Serial theo nhóm
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCreateGroupModal(false)}
                className="btn-icon"
                style={{ width: '32px', height: '32px', border: 'none', outline: 'none' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
                  Tên Thư mục / Nhóm máy chủ
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="ví dụ: Linux Servers, Cisco Switches..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="input-field"
                  style={{ height: '44px', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setCreateGroupModal(false)} className="btn-secondary" style={{ padding: '10px 18px' }}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 22px' }}>
                  <Plus size={16} /> Tạo Thư mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME FOLDER MODAL */}
      {renameModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-glass" style={{
            width: '440px',
            padding: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Edit3 size={22} color="#38bdf8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                    Đổi tên Thư mục
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Cập nhật tên và tự động đồng bộ máy chủ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRenameModal(null)}
                className="btn-icon"
                style={{ width: '32px', height: '32px', border: 'none', outline: 'none' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRenameGroupSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
                  Tên mới cho "{renameModal.oldName}"
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={renameModal.newName}
                  onChange={e => setRenameModal({ ...renameModal, newName: e.target.value })}
                  className="input-field"
                  style={{ height: '44px', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setRenameModal(null)} className="btn-secondary" style={{ padding: '10px 18px' }}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 22px' }}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE FOLDER MODAL */}
      {deleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{
            width: '440px',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={20} color="var(--danger)" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                  Xác nhận xóa thư mục "{deleteModal.groupName}"
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              {deleteModal.count > 0 ? (
                <>
                  Thư mục này đang chứa <b>{deleteModal.count} máy chủ</b>. Khi xóa, các máy chủ bên trong sẽ được chuyển an toàn về thư mục <b>"Production"</b>.
                </>
              ) : (
                <>Thư mục này hiện đang trống. Bạn có chắc chắn muốn xóa khỏi danh sách?</>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setDeleteModal(null)} className="btn-secondary">
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteGroupSubmit}
                className="btn-primary"
                style={{ background: 'var(--danger)', border: 'none' }}
              >
                Xóa Thư mục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Review Modal */}
      {importPreviewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '720px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '24px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                  Duyệt & Xác Nhận Import Dữ Liệu
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Tệp: <b style={{ color: '#38bdf8' }}>{importPreviewModal.fileName}</b> — Tìm thấy <b>{importPreviewModal.connections.length}</b> kết nối
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportPreviewModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Select All Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={selectedImportIndices.length === importPreviewModal.connections.length}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedImportIndices(importPreviewModal.connections.map((_, idx) => idx));
                    } else {
                      setSelectedImportIndices([]);
                    }
                  }}
                  style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Chọn tất cả ({selectedImportIndices.length}/{importPreviewModal.connections.length})
              </label>
            </div>

            {/* List Table */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', paddingRight: '4px' }}>
              {importPreviewModal.connections.map((conn, idx) => {
                const isSelected = selectedImportIndices.includes(idx);
                return (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-color)'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedImportIndices(prev => [...prev, idx]);
                        } else {
                          setSelectedImportIndices(prev => prev.filter(i => i !== idx));
                        }
                      }}
                      style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />

                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: conn.protocol === 'serial' ? 'rgba(139, 92, 246, 0.2)' : conn.protocol === 'local' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(96, 165, 250, 0.2)',
                      color: conn.protocol === 'serial' ? '#a78bfa' : conn.protocol === 'local' ? '#34d399' : '#60a5fa'
                    }}>
                      {conn.protocol ? conn.protocol.toUpperCase() : 'SSH'}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conn.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {conn.host || conn.serialPath || ''} {conn.protocol === 'ssh' ? `:${conn.port}` : ''}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div>User: {conn.username || 'root'}</div>
                      <div style={{ marginTop: '2px' }}>📁 {conn.group}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setImportPreviewModal(null);
                  setSelectedImportIndices([]);
                }}
                className="btn-secondary"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="btn-primary"
                disabled={selectedImportIndices.length === 0}
              >
                ✔ Nhập Đã Chọn ({selectedImportIndices.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
