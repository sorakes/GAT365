"use client";

import { useEffect, useState } from "react";
import { getDashboardData, setConcurrency, toggleTool, toggleBulkTools, getAccounts, removeAccount } from "./actions";

export default function Home() {
  const [concurrency, setConc] = useState(1);
  const [tools, setTools] = useState<any[]>([]);
  const [disabledSet, setDisabledSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Abas e Auth
  const [activeTab, setActiveTab] = useState<'permissions' | 'auth'>('permissions');
  const [accounts, setAccounts] = useState<any[]>([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [accessFilter, setAccessFilter] = useState('ALL');
  
  // Dicas expandidas (Dicas de IA)
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());

  const toggleTip = (toolName: string) => {
    setExpandedTips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolName)) newSet.delete(toolName);
      else newSet.add(toolName);
      return newSet;
    });
  };

  useEffect(() => {
    Promise.all([getDashboardData(), getAccounts()]).then(([data, accs]) => {
      setConc(data.concurrency);
      setTools(data.availableTools);
      setDisabledSet(new Set(data.disabledTools));
      setAccounts(accs);
      setLoading(false);
    });
  }, []);

  async function handleRemoveAccount(id: string) {
    if (!confirm('Deseja realmente desconectar esta conta?')) return;
    const res = await removeAccount(id);
    if (res.success) {
      const accs = await getAccounts();
      setAccounts(accs);
    } else {
      alert("Erro ao remover conta: " + res.error);
    }
  }

  async function handleToggle(toolName: string, currentlyDisabled: boolean) {
    const isEnabling = currentlyDisabled;
    
    setDisabledSet(prev => {
      const newSet = new Set(prev);
      if (isEnabling) newSet.delete(toolName);
      else newSet.add(toolName);
      return newSet;
    });
    
    await toggleTool(toolName, isEnabling);
    const data = await getDashboardData();
    setDisabledSet(new Set(data.disabledTools));
  }

  async function handleBulkToggle(enable: boolean) {
    const toolNames = filteredTools.map(t => t.toolName);
    
    setDisabledSet(prev => {
      const newSet = new Set(prev);
      for (const name of toolNames) {
        if (enable) newSet.delete(name);
        else newSet.add(name);
      }
      return newSet;
    });
    
    await toggleBulkTools(toolNames, enable);
    const data = await getDashboardData();
    setDisabledSet(new Set(data.disabledTools));
  }

  async function handleConcChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value) || 1;
    setConc(val);
    await setConcurrency(val);
  }

  if (loading) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ color: 'var(--primary-color)' }}>Iniciando Sistema...</h2>
        </div>
      </main>
    );
  }

  const filteredTools = tools.filter(t => {
    // 1. Busca textual
    const matchesSearch = 
      t.toolName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.pathPattern.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Filtro de Método
    const matchesMethod = methodFilter === 'ALL' || t.method === methodFilter;

    // 3. Filtro de Acesso
    let matchesAccess = true;
    if (accessFilter !== 'ALL') {
      const isWriteScope = t.scopes?.some((s: string) => s.toLowerCase().includes('write') || s.toLowerCase().includes('send'));
      const isReadMethod = t.method === 'GET' || (t.method === 'POST' && t.toolName.includes('get'));
      const isReadOnly = !isWriteScope && isReadMethod;

      if (accessFilter === 'READ_ONLY') {
        matchesAccess = isReadOnly;
      } else if (accessFilter === 'MODIFY') {
        matchesAccess = !isReadOnly;
      }
    }

    return matchesSearch && matchesMethod && matchesAccess;
  });

  const methods = ['ALL', 'GET', 'POST', 'PATCH', 'DELETE', 'PUT'];
  const accessTypes = [
    { id: 'ALL', label: 'Todos os Acessos' },
    { id: 'READ_ONLY', label: 'Apenas Leitura (Safe)' },
    { id: 'MODIFY', label: 'Modificam Dados (Write/Send)' }
  ];

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: '2rem',
      gap: '1.5rem',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <header className="animate-fade-in" style={{ textAlign: 'center', flexShrink: 0 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', color: '#fff', textShadow: '0 0 20px rgba(102, 252, 241, 0.3)', margin: 0 }}>
          Controlador de Tráfego
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem', margin: 0 }}>
          Gerencie o fluxo e as permissões do seu Servidor MCP em tempo real
        </p>
      </header>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', flexShrink: 0 }}>
        <button onClick={() => setActiveTab('permissions')} style={{ background: 'transparent', border: 'none', color: activeTab === 'permissions' ? '#fff' : 'var(--text-muted)', fontSize: '1.1rem', cursor: 'pointer', borderBottom: activeTab === 'permissions' ? '2px solid var(--primary-color)' : 'none', paddingBottom: '0.5rem', fontWeight: activeTab === 'permissions' ? 'bold' : 'normal' }}>
          Permissões & Tráfego
        </button>
        <button onClick={() => setActiveTab('auth')} style={{ background: 'transparent', border: 'none', color: activeTab === 'auth' ? '#fff' : 'var(--text-muted)', fontSize: '1.1rem', cursor: 'pointer', borderBottom: activeTab === 'auth' ? '2px solid var(--primary-color)' : 'none', paddingBottom: '0.5rem', fontWeight: activeTab === 'auth' ? 'bold' : 'normal' }}>
          Autenticações Ativas
        </button>
      </div>

      {activeTab === 'permissions' ? (
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        width: '100%',
        flex: 1,
        minHeight: 0,
        alignItems: 'stretch'
      }}>
        
        {/* PAINEL LATERAL: CONFIGURAÇÕES E FILTROS */}
        <section 
          className="glass-panel animate-fade-in delay-1"
          style={{
            width: '320px',
            flexShrink: 0,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            overflowY: 'auto'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--primary-color)' }}>
              Tráfego (BullMQ)
            </h2>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Workers Paralelos</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={concurrency}
                  onChange={handleConcChange}
                  style={{ flex: 1, accentColor: 'var(--primary-color)' }}
                />
                <span style={{ 
                  background: 'rgba(102, 252, 241, 0.1)', 
                  color: 'var(--primary-color)',
                  padding: '0.4rem 0.8rem', 
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  {concurrency}
                </span>
              </div>
            </label>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--primary-color)' }}>
              Filtros Avançados
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Tipo de Acesso */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tipo de Acesso</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {accessTypes.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => setAccessFilter(acc.id)}
                      style={{
                        padding: '0.5rem 0.8rem',
                        borderRadius: '8px',
                        border: accessFilter === acc.id ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)',
                        background: accessFilter === acc.id ? 'rgba(102, 252, 241, 0.1)' : 'transparent',
                        color: accessFilter === acc.id ? 'var(--primary-color)' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        fontSize: '0.85rem'
                      }}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Método HTTP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Método HTTP</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {methods.map(m => (
                    <button
                      key={m}
                      onClick={() => setMethodFilter(m)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '20px',
                        border: methodFilter === m ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)',
                        background: methodFilter === m ? 'rgba(102, 252, 241, 0.1)' : 'transparent',
                        color: methodFilter === m ? 'var(--primary-color)' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.75rem',
                        fontWeight: methodFilter === m ? 'bold' : 'normal'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PAINEL PRINCIPAL: LISTA DE FERRAMENTAS */}
        <section 
          className="glass-panel animate-fade-in delay-2"
          style={{
            flex: 1,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            minHeight: 0
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', flexShrink: 0 }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Lista de Permissões
              <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', color: '#fff' }}>
                {filteredTools.length} {filteredTools.length === 1 ? 'resultado' : 'resultados'}
              </span>
            </h2>
            
            <input 
              type="text" 
              placeholder="Buscar por nome, path ou descrição..." 
              className="input-glow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: '280px', maxWidth: '400px', padding: '10px 16px', fontSize: '0.9rem' }}
            />
          </div>

          {/* BARRA DE AÇÕES EM MASSA */}
          {filteredTools.length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              padding: '0.75rem 1rem', 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: '12px',
              alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ações em Massa:</span>
              <button 
                onClick={() => handleBulkToggle(true)}
                style={{
                  background: 'rgba(102, 252, 241, 0.1)',
                  color: 'var(--primary-color)',
                  border: '1px solid rgba(102, 252, 241, 0.3)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  fontSize: '0.75rem'
                }}
              >
                ✓ Ativar {filteredTools.length} Ferramentas
              </button>
              
              <button 
                onClick={() => handleBulkToggle(false)}
                style={{
                  background: 'rgba(255, 75, 75, 0.1)',
                  color: '#ff4b4b',
                  border: '1px solid rgba(255, 75, 75, 0.3)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  fontSize: '0.75rem'
                }}
              >
                ✗ Desativar {filteredTools.length} Ferramentas
              </button>
            </div>
          )}
          
          {/* CONTAINER SCROLLBOX COM O GRID DE CARDS */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '0.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
            alignContent: 'start'
          }}>
            {filteredTools.map(tool => {
              const isDisabled = disabledSet.has(tool.toolName);
              const methodColor = tool.method === 'GET' ? '#66fcf1' : (tool.method === 'POST' ? '#f1c40f' : (tool.method === 'DELETE' ? '#ff4b4b' : '#e67e22'));
              const isTipExpanded = expandedTips.has(tool.toolName);

              return (
                <div key={tool.toolName} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: isDisabled ? 'rgba(255, 75, 75, 0.05)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isDisabled ? 'rgba(255, 75, 75, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                  padding: '1.25rem',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  gap: '1rem',
                  justifyContent: 'space-between',
                  minHeight: '260px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '1.05rem',
                        color: isDisabled ? '#ff4b4b' : '#fff',
                        textDecoration: isDisabled ? 'line-through' : 'none',
                        wordBreak: 'break-all'
                      }}>
                        {tool.toolName}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        background: 'rgba(255,255,255,0.1)',
                        color: methodColor,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        letterSpacing: '1px'
                      }}>
                        {tool.method}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <code style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        wordBreak: 'break-all'
                      }}>
                        {tool.pathPattern}
                      </code>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.45 }}>
                      {tool.description}
                    </p>

                    {tool.scopes && tool.scopes.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                        {tool.scopes.map((scope: string) => (
                          <span key={scope} style={{
                            fontSize: '0.65rem',
                            background: scope.toLowerCase().includes('write') || scope.toLowerCase().includes('send') ? 'rgba(255, 196, 0, 0.1)' : 'rgba(102, 252, 241, 0.05)',
                            color: scope.toLowerCase().includes('write') || scope.toLowerCase().includes('send') ? '#f1c40f' : 'var(--primary-color)',
                            border: `1px solid ${scope.toLowerCase().includes('write') || scope.toLowerCase().includes('send') ? 'rgba(255, 196, 0, 0.3)' : 'rgba(102, 252, 241, 0.2)'}`,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '8px'
                          }}>
                            {scope}
                          </span>
                        ))}
                      </div>
                    )}

                    {tool.llmTip && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <button
                          onClick={() => toggleTip(tool.toolName)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary-color)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 600
                          }}
                        >
                          <span>💡</span> {isTipExpanded ? 'Ocultar Dica de IA' : 'Ver Dica de IA'}
                        </button>
                        {isTipExpanded && (
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            background: 'rgba(102, 252, 241, 0.03)',
                            borderLeft: '2px solid var(--primary-color)',
                            borderRadius: '0 8px 8px 0',
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.6)',
                            fontStyle: 'italic',
                            lineHeight: 1.4,
                            animation: 'fadeIn 0.2s ease-out'
                          }}>
                            {tool.llmTip}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                    <button 
                      onClick={() => handleToggle(tool.toolName, isDisabled)}
                      style={{
                        background: isDisabled ? 'rgba(255, 75, 75, 0.1)' : 'rgba(102, 252, 241, 0.1)',
                        color: isDisabled ? '#ff4b4b' : 'var(--primary-color)',
                        border: `1px solid ${isDisabled ? 'rgba(255, 75, 75, 0.3)' : 'rgba(102, 252, 241, 0.3)'}`,
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        width: '100%',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isDisabled ? 'Reativar' : 'Ativo'}
                    </button>
                  </div>
                </div>
              );
            })}
            
            {filteredTools.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>🔍</div>
                Nenhuma ferramenta encontrada com os filtros selecionados.<br/>
                Tente limpar os filtros para ver mais resultados.
              </div>
            )}
          </div>
        </section>

      </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>Usuários Conectados</h2>
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {accounts.map(acc => (
              <div key={acc.homeAccountId} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{acc.name || acc.username}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{acc.username}</div>
                <div style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {acc.environment}
                </div>
                <button 
                  onClick={() => handleRemoveAccount(acc.homeAccountId)} 
                  style={{ marginTop: '1rem', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)')}
                >
                  Desconectar Usuário
                </button>
              </div>
            ))}
            {accounts.length === 0 && (
              <div style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                Nenhuma conta autenticada no cache.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
