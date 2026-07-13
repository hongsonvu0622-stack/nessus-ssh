import React from 'react';
import { Sparkles, RefreshCw, Download, CheckCircle2, AlertCircle, X, ExternalLink, ArrowRight } from 'lucide-react';

export default function UpdateModal({ updateInfo, onClose, onCheckAgain }) {
  if (!updateInfo) return null;

  const {
    status = 'up-to-date',
    currentVersion = '1.0.0',
    latestVersion = '1.0.0',
    releaseName = '',
    releaseNotes = '',
    downloadUrl = 'https://github.com/hongsonvu0622-stack/nessus-ssh/releases/latest',
    message = ''
  } = updateInfo;

  const isUpdateAvailable = status === 'update-available';
  const isChecking = status === 'checking';

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
        padding: '28px',
        border: isUpdateAvailable ? '1px solid rgba(129, 140, 248, 0.6)' : '1px solid var(--border-color)',
        boxShadow: isUpdateAvailable ? '0 0 40px rgba(99, 102, 241, 0.25)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                Cập Nhật Phần Mềm (Software Update)
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
                  ? 'Đang kiểm tra phiên bản mới...'
                  : isUpdateAvailable
                    ? `Phát hiện phiên bản mới: v${latestVersion}!`
                    : status === 'error'
                      ? 'Lỗi kiểm tra cập nhật'
                      : 'Bạn đang sử dụng phiên bản mới nhất!'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Phiên bản hiện tại: <b>v{currentVersion}</b>
                {isUpdateAvailable && <span>  →  Mới nhất: <b style={{ color: '#818cf8' }}>v{latestVersion}</b></span>}
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
            Kiểm tra lại
          </button>
        </div>

        {/* Release Notes */}
        {isUpdateAvailable && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-color)',
            maxHeight: '220px',
            overflowY: 'auto'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', marginBottom: '8px' }}>
              📝 Ghi chú thay đổi ({releaseName}):
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

        {message && status === 'error' && (
          <div style={{ fontSize: '13px', color: '#f87171', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px' }}>
            {message}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
          <button onClick={onClose} className="btn-secondary">
            Đóng
          </button>

          {isUpdateAvailable && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            >
              <Download size={16} />
              Tải Về & Cập Nhật Ngay
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
