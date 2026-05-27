import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MS 365 Admin Panel",
  description: "Advanced Server Management and Graph API Controller",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100vh', margin: 0, overflow: 'hidden' }}>
        
        {/* Sidebar Lateral */}
        <aside style={{
          flexShrink: 0,
          width: '260px',
          height: '100vh',
          background: 'rgba(0,0,0,0.4)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          backdropFilter: 'blur(10px)',
          zIndex: 50
        }}>
          <div style={{ textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#fff', textShadow: '0 0 10px rgba(102, 252, 241, 0.3)' }}>
              MS 365<br/><span style={{ color: 'var(--primary-color)' }}>MCP Server</span>
            </h1>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a href="/" style={{
              display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#fff', textDecoration: 'none',
              padding: '0.8rem 1rem', borderRadius: '8px', background: 'rgba(102, 252, 241, 0.05)',
              border: '1px solid rgba(102, 252, 241, 0.2)', transition: 'all 0.2s', fontWeight: 600, fontSize: '0.95rem'
            }} className="menu-link">
              <span style={{ fontSize: '1.2rem' }}>🛡️</span> Permissões
            </a>
            <a href="/queue" style={{
              display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#fff', textDecoration: 'none',
              padding: '0.8rem 1rem', borderRadius: '8px', background: 'rgba(102, 252, 241, 0.05)',
              border: '1px solid rgba(102, 252, 241, 0.2)', transition: 'all 0.2s', fontWeight: 600, fontSize: '0.95rem'
            }} className="menu-link">
              <span style={{ fontSize: '1.2rem' }}>📈</span> Fila (Queue)
            </a>
          </nav>
        </aside>

        {/* Conteúdo Principal */}
        <div style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative' }}>
          {children}
        </div>
        
      </body>
    </html>
  );
}
