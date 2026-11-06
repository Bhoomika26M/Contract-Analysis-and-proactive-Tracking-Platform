import React from 'react';
import './authLayout.css';

const AuthLayout = ({ children }) => (
  <main
    className="auth-layout"
    style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}
  >
    <section
      className="auth-branding-panel"
      style={{
        width: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #2b1687 0%, #1e0e5c 100%)',
        color: '#ffffff'
      }}
    >
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ marginBottom: '44px' }}>
          <h1 style={{ margin: '0 0 14px', color: '#ffffff', fontSize: '3rem', fontWeight: 700, letterSpacing: '-1px' }}>
            ContractIQ
          </h1>
          <p style={{ margin: 0, color: '#d1c4e9', fontSize: '18px', lineHeight: 1.6 }}>
            Intelligent Contract Lifecycle Management
          </p>
        </div>
        <svg
          aria-hidden="true"
          viewBox="0 0 440 330"
          style={{ display: 'block', width: '100%', maxWidth: '440px', height: 'auto', opacity: 0.88 }}
        >
          <defs>
            <linearGradient id="document-glow" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#d1c4e9" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          <rect x="69" y="34" width="238" height="270" rx="18" fill="url(#document-glow)" stroke="#ffffff" strokeOpacity="0.72" strokeWidth="2" />
          <path d="M259 35v66h66" fill="#ffffff" fillOpacity="0.12" stroke="#ffffff" strokeOpacity="0.72" strokeWidth="2" />
          <path d="M108 131h130M108 162h110M108 193h87" stroke="#ffffff" strokeOpacity="0.72" strokeWidth="8" strokeLinecap="round" />
          <path d="M110 245c20-27 29 20 49-2 12-14 17-28 25-16 7 11 8 19 19 6 9-11 17-10 26 1" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="318" cy="228" r="67" fill="#2b1687" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="2" />
          <path d="M318 179l36 14v29c0 27-16 46-36 58-20-12-36-31-36-58v-29l36-14Z" fill="#ffffff" fillOpacity="0.17" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
          <path d="m301 223 12 12 24-27" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="64" cy="85" r="5" fill="#ffffff" fillOpacity="0.65" />
          <circle cx="385" cy="111" r="4" fill="#ffffff" fillOpacity="0.55" />
          <circle cx="360" cy="302" r="6" fill="#ffffff" fillOpacity="0.45" />
        </svg>
      </div>
    </section>
    <section
      className="auth-form-panel"
      style={{
        width: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, #f3effe 0%, #fdf5f2 100%)'
      }}
    >
      <div
        className="auth-form-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          boxSizing: 'border-box',
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
        }}
      >
        {children}
      </div>
    </section>
  </main>
);

export default AuthLayout;
