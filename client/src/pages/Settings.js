import React from 'react';
import { cardStyle } from '../uiStyles';

const settingsSections = [
  {
    title: 'Account',
    description: 'Manage your profile and account preferences.'
  },
  {
    title: 'Notifications',
    description: 'Choose how you receive contract and task reminders.'
  },
  {
    title: 'Security',
    description: 'Review authentication and session settings.'
  }
];

const Settings = () => (
  <section style={{ ...cardStyle, padding: '24px' }}>
    <h1 style={{ marginTop: 0 }}>Settings</h1>
    <p style={{ color: '#6c757d' }}>Manage your ContractIQ workspace preferences.</p>
    <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
      {settingsSections.map((section) => (
        <article key={section.title} style={{ padding: '18px', border: '1px solid #dee2e6', borderRadius: '6px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>{section.title}</h2>
          <p style={{ margin: 0, color: '#6c757d' }}>{section.description}</p>
        </article>
      ))}
    </div>
  </section>
);

export default Settings;