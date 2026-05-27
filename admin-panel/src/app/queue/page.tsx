"use client";

import { useEffect, useState } from "react";
import { getQueueMetrics, getRecentJobs } from "./actions";

export default function QueueAuditor() {
  const [metrics, setMetrics] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  async function fetchQueue() {
    try {
      const [m, j] = await Promise.all([getQueueMetrics(), getRecentJobs()]);
      setMetrics(m);
      setJobs(j);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Polling a cada 3 segundos
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '4rem 2rem',
      gap: '2rem'
    }}>
      <header className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-1px', color: '#fff', textShadow: '0 0 20px rgba(102, 252, 241, 0.3)' }}>
          Auditoria de Fila (BullMQ)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
          Monitore todas as chamadas do agente de IA em tempo real.
        </p>
      </header>

      {/* METRICS */}
      <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '1200px', flexWrap: 'wrap' }}>
        <MetricCard title="Waiting" value={metrics?.waiting} color="#3498db" loading={loading} />
        <MetricCard title="Active" value={metrics?.active} color="#f1c40f" loading={loading} />
        <MetricCard title="Completed" value={metrics?.completed} color="#2ecc71" loading={loading} />
        <MetricCard title="Failed" value={metrics?.failed} color="#e74c3c" loading={loading} />
      </div>

      {/* JOB LIST */}
      <section 
        className="glass-panel animate-fade-in delay-1"
        style={{ width: '100%', maxWidth: '1200px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
          <span>Últimas Requisições ({jobs.length})</span>
          {loading && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sincronizando...</span>}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {jobs.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              A fila está vazia. Nenhuma chamada recente do LLM.
            </div>
          )}

          {jobs.map(job => {
            const isExpanded = expandedJob === job.id;
            
            let statusColor = '#fff';
            if (job.status === 'completed') statusColor = '#2ecc71';
            else if (job.status === 'failed') statusColor = '#e74c3c';
            else if (job.status === 'active') statusColor = '#f1c40f';
            else statusColor = '#3498db';

            return (
              <div key={job.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(255,255,255,0.05)`,
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div 
                  onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderLeft: `4px solid ${statusColor}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>
                      {job.name}
                    </span>
                    {job.data?.username && (
                      <span style={{ fontSize: '0.8rem', background: 'rgba(102, 252, 241, 0.1)', color: '#66fcf1', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(102, 252, 241, 0.2)' }}>
                        👤 {job.data.username}
                      </span>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      #{job.id}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: `${statusColor}22`,
                      color: statusColor,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {job.status}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(job.timestamp).toLocaleString()}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    <div>
                      <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Parâmetros da Chamada (Request):</h4>
                      <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#e0e0e0', overflowX: 'auto' }}>
                        {JSON.stringify(job.data, null, 2)}
                      </pre>
                    </div>

                    {job.returnValue && (
                      <div>
                        <h4 style={{ color: '#2ecc71', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Retorno do Graph (Success):</h4>
                        <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#e0e0e0', overflowX: 'auto', maxHeight: '300px' }}>
                          {JSON.stringify(job.returnValue, null, 2)}
                        </pre>
                      </div>
                    )}

                    {job.failedReason && (
                      <div>
                        <h4 style={{ color: '#e74c3c', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Erro / Falha:</h4>
                        <div style={{ background: 'rgba(231, 76, 60, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '2px solid #e74c3c' }}>
                          <p style={{ color: '#ff6b6b', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>{job.failedReason}</p>
                          {job.stacktrace && job.stacktrace.length > 0 && (
                            <pre style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', overflowX: 'auto' }}>
                              {job.stacktrace.join('\n')}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ title, value, color, loading }: { title: string, value: number, color: string, loading: boolean }) {
  return (
    <div className="glass-panel" style={{ flex: '1 1 200px', padding: '1.5rem', textAlign: 'center', borderBottom: `3px solid ${color}` }}>
      <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
        {title}
      </h3>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>
        {loading && value === undefined ? '...' : (value ?? '-')}
      </div>
    </div>
  );
}
