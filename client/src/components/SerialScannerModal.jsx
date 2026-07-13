import React, { useEffect, useState } from 'react';
import { X, Usb, RefreshCw, Plus, Terminal } from 'lucide-react';
import { fetchSerialPorts } from '../services/socket';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function SerialScannerModal({ onClose, onSaveConnection, onConnectDirect }) {
  const { t } = useI18n();
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baudRate, setBaudRate] = useState(9600);

  const loadPorts = async () => {
    setLoading(true);
    try {
      const list = await fetchSerialPorts();
      setPorts(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPorts();
  }, []);

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
        width: '580px',
        maxHeight: '85vh',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Usb size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                {t('serialModal.title')}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {t('serialModal.subTitle')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadPorts}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              title={t('serialModal.rescanTitle')}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {t('serialModal.refresh')}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Baud Rate selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {t('serialModal.baudRateLabel')}
          </span>
          <select
            value={baudRate}
            onChange={e => setBaudRate(parseInt(e.target.value, 10))}
            style={{
              background: '#111622',
              border: '1px solid var(--border-color)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none'
            }}
          >
            {[9600, 19200, 38400, 57600, 115200].map(br => (
              <option key={br} value={br}>{br} {t('serialModal.baud')}</option>
            ))}
          </select>
        </div>

        {/* Port List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            {t('serialModal.scanning')}
          </div>
        ) : ports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            {t('serialModal.noPorts')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ports.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {p.path}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {p.manufacturer || 'Standard USB/Serial Port'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      onConnectDirect({
                        id: 'serial-direct-' + Date.now(),
                        name: `Serial: ${p.path}`,
                        protocol: 'serial',
                        serialPath: p.path,
                        baudRate
                      });
                      onClose();
                    }}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Terminal size={14} />
                    {t('serialModal.connectNow')}
                  </button>

                  <button
                    onClick={() => {
                      onSaveConnection({
                        id: 'serial-' + Date.now(),
                        name: `Serial: ${p.path}`,
                        protocol: 'serial',
                        serialPath: p.path,
                        baudRate,
                        dataBits: 8,
                        stopBits: 1,
                        parity: 'none',
                        group: 'Serial',
                        tags: ['Serial']
                      });
                      onClose();
                    }}
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    title={t('serialModal.saveHost')}
                  >
                    <Plus size={14} />
                    {t('serialModal.save')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
