import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Download, CheckCircle2, AlertCircle, X, ExternalLink, Zap, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { socket } from '../services/socket';

export default function UpdateModal({ updateInfo, onClose, onCheckAgain }) {
  const { lang, t } = useI18n();
  const [bgProgress, setBgProgress] = useState(null);
  const [bgReady, setBgReady] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [bgError, setBgError] = useState(null);

  useEffect(() => {
    const handleProgress = (data) => {
      setBgProgress(data);
      setBgError(null);
    };
    const handleReady = (data) => {
      setBgProgress(null);
      setBgReady(data);
    };
    const handleInstallProgress = () => {
      setInstalling(true);
      setInstallSuccess(false);
      setBgError(null);
    };
    const handleInstallSuccess = () => {
      setInstalling(false);
      setInstallSuccess(true);
      setTimeout(() => {
        if (typeof onClose === 'function') onClose();
      }, 3500);
    };
    const handleError = (data) => {
      setBgError(data.message);
      setBgProgress(null);
      setInstalling(false);
      setInstallSuccess(false);
    };

    socket.on('updater:progress', handleProgress);
    socket.on('updater:ready', handleReady);
    socket.on('updater:install-progress', handleInstallProgress);
    socket.on('updater:install-success', handleInstallSuccess);
    socket.on('updater:error', handleError);

    return () => {
      socket.off('updater:progress', handleProgress);
      socket.off('updater:ready', handleReady);
      socket.off('updater:install-progress', handleInstallProgress);
      socket.off('updater:install-success', handleInstallSuccess);
      socket.off('updater:error', handleError);
    };
  }, [onClose]);

  if (!updateInfo) return null;

  const {
    status = 'up-to-date',
    currentVersion = '1.0.0',
    latestVersion = '1.0.0',
    releaseName = '',
    releaseNotes = '',
    downloadUrl = 'https://github.com/hongsonvu0622-stack/nessus-ssh/releases/latest',
    assets = [],
    message = ''
  } = updateInfo;

  const isUpdateAvailable = status === 'update-available';
  const isChecking = status === 'checking';

  const handleStartBackgroundDownload = () => {
    const validAssets = (assets || []).filter(a => !a.name.endsWith('.blockmap') && !a.name.endsWith('.yml') && !a.name.endsWith('.yaml'));
    const isWin = navigator.userAgent.includes('Win');
    const isMac = navigator.userAgent.includes('Mac');

    let asset;
    if (isWin) {
      asset = validAssets.find(a => a.name.endsWith('.exe') || a.name.endsWith('.msi')) || validAssets.find(a => a.name.endsWith('.zip'));
    } else if (isMac) {
      asset = validAssets.find(a => a.name.endsWith('.zip')) || validAssets.find(a => a.name.endsWith('.dmg') || a.name.endsWith('.pkg'));
    } else {
      asset = validAssets.find(a => a.name.endsWith('.AppImage') || a.name.endsWith('.deb')) || validAssets.find(a => a.name.endsWith('.zip'));
    }

    const fallbackExt = isWin ? 'exe' : isMac ? 'zip' : 'AppImage';
    const chosenAsset = asset || validAssets[0];
    const targetUrl = chosenAsset ? chosenAsset.downloadUrl : downloadUrl;
    const fileName = chosenAsset ? chosenAsset.name : `NexusSSH-${latestVersion}.${fallbackExt}`;

    setBgError(null);
    setBgProgress({ percent: 1 });
    socket.emit('updater:download', { downloadUrl: targetUrl, fileName });
  };

  const handleStartInstall = () => {
    if (!bgReady || !bgReady.fileName) return;
    setInstalling(true);
    socket.emit('updater:install', { fileName: bgReady.fileName });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000
    }}>
      <div className="glass-panel" style={{
        width: '540px',
        maxHeight: '85vh',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: isUpdateAvailable ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {t('updateModal.title')}
              </h2>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                NexusSSH Pro — Cyber Glass Edition
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Status Banner */}
        <div style={{
          background: isUpdateAvailable
            ? 'rgba(99, 102, 241, 0.15)'
            : isChecking
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(16, 185, 129, 0.12)',
          border: isUpdateAvailable
            ? '1px solid rgba(99, 102, 241, 0.4)'
            : isChecking
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isChecking ? (
              <RefreshCw size={20} className="animate-spin" color="#818cf8" />
            ) : isUpdateAvailable ? (
              <Sparkles size={20} color="#a855f7" />
            ) : status === 'error' ? (
              <AlertCircle size={20} color="#ef4444" />
            ) : (
              <CheckCircle2 size={20} color="#10b981" />
            )}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                {isChecking
                  ? t('updateModal.checking')
                  : isUpdateAvailable
                    ? `${lang === 'vi' ? 'Phát hiện phiên bản mới' : 'New version available'}: v${latestVersion}!`
                    : status === 'error'
                      ? t('updateModal.updateError')
                      : t('updateModal.upToDate')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t('updateModal.currentVersion')}<b>v{currentVersion}</b>
                {isUpdateAvailable && <span>  →  {t('updateModal.latestVersion')}<b style={{ color: '#818cf8' }}>v{latestVersion}</b></span>}
              </div>
            </div>
          </div>

          <button
            onClick={onCheckAgain}
            disabled={isChecking}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
            {t('updateModal.checkAgain')}
          </button>
        </div>

        {/* Background Update Progress */}
        {bgProgress && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#818cf8', marginBottom: '8px' }}>
              <span>⚡ {t('updateModal.downloadingBg')}</span>
              <span>{bgProgress.percent || 0}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${bgProgress.percent || 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                transition: 'width 0.2s'
              }} />
            </div>
          </div>
        )}

        {/* Background Ready Notice */}
        {bgReady && !installing && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} color="#10b981" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                  ✔ Đã tải xong bản cập nhật ({bgReady.fileName})
                </div>
                <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
                  Bộ cài sẽ tự động xóa ngay sau khi cài đặt hoàn tất
                </div>
              </div>
            </div>
            <button
              onClick={handleStartInstall}
              className="btn-primary"
              style={{ background: '#10b981', borderColor: '#10b981', fontSize: '12px', padding: '8px 14px' }}
            >
              <Zap size={14} /> {t('updateModal.installNowBtn')}
            </button>
          </div>
        )}

        {/* Installing notification */}
        {installing && (
          <div style={{
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '13px',
            color: '#e9d5ff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>⏳</span>
            <span>{t('updateModal.installingMsg')}</span>
          </div>
        )}

        {/* Success notification */}
        {installSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.18)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '13px',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600
          }}>
            <span>🎉</span>
            <span>{t('updateModal.installSuccessMsg')}</span>
          </div>
        )}

        {/* Release Notes */}
        {isUpdateAvailable && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-color)',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', marginBottom: '8px' }}>
              {t('updateModal.releaseNotes')} ({releaseName}):
            </h4>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'var(--font-main)',
              fontSize: '12.5px',
              color: '#cbd5e1',
              lineHeight: '1.5',
              margin: 0
            }}>
              {releaseNotes}
            </pre>
          </div>
        )}

        {bgError && (
          <div style={{ fontSize: '13px', color: '#f87171', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px' }}>
            {bgError}
          </div>
        )}

        {(message || bgError) && status === 'error' && (
          <div style={{ fontSize: '13px', color: '#f87171', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px' }}>
            {message}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
          <button onClick={onClose} className="btn-secondary">
            {t('updateModal.close')}
          </button>

          {isUpdateAvailable && !bgReady && !bgProgress && !installing && (
            <>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
              >
                <ExternalLink size={14} />
                {t('updateModal.externalDownload')}
              </a>

              <button
                onClick={handleStartBackgroundDownload}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
              >
                <Zap size={15} />
                {t('updateModal.bgDownloadBtn')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
