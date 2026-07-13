import React, { useEffect, useState } from 'react';
import { X, Usb, RefreshCw, Plus, Terminal } from 'lucide-react';
import { fetchSerialPorts } from '../services/socket';

export default function SerialScannerModal({ onClose, onSaveConnection, onConnectDirect }) {
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
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '580px',
        maxHeight: '85vh',
        overflowY: 'auto',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Usb size={20} color="#a78bfa" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                Quét Thiết Bị Serial (USB / UART / COM)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Cáp USB-to-Serial / Cisco Console Cable / COM Port / Arduino / IoT
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadPorts}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              title="Quét lại"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
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
            Mặc định Baud Rate cho kết nối:
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
              <option key={br} value={br}>{br} baud</option>
            ))}
          </select>
        </div>

        {/* Port List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Đang quét cổng Serial (USB / COM / UART)...
          </div>
        ) : ports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            Không tìm thấy cổng Serial nào đang kết nối. Hãy cắm cáp USB Console / COM port vào máy tính và bấm Refresh.
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
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {p.path}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {p.manufacturer || 'macOS Serial Device'} {p.serialNumber ? `(S/N: ${p.serialNumber})` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      onConnectDirect({
                        id: 'serial-quick-' + Date.now(),
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
                    Kết nối ngay
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
                        group: 'Network Devices',
                        tags: ['Serial', 'macOS']
                      });
                      onClose();
                    }}
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    title="Lưu vào danh sách"
                  >
                    <Plus size={14} />
                    Lưu
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
