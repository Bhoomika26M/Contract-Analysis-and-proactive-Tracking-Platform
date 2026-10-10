import React, { useState, useEffect } from 'react';

const Settings = ({ activeRole }) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // 1. New State for Profile
  const [profile, setProfile] = useState({ id: null, name: '', email: '' });
  const [systemSettings, setSystemSettings] = useState({
    renewal_warning_days: 30, session_timeout: 60, require_2fa: false
  });

  useEffect(() => {
    // Fetch Global Settings (Admin Only)
    if (activeRole === 'Administrator') {
      fetch('http://localhost:8000/api/settings/system')
        .then(res => res.json())
        .then(data => setSystemSettings(data))
        .catch(err => console.error("Error fetching system settings:", err));
    }

    // 2. Fetch the User for the Profile Tab
    // We fetch all users and find the first one that matches the activeRole to simulate a login
    fetch('http://localhost:8000/api/users')
      .then(res => res.json())
      .then(users => {
        const matchingUser = users.find(u => u.role === activeRole);
        if (matchingUser) {
          setProfile({ id: matchingUser.id, name: matchingUser.name, email: matchingUser.email });
        } else {
          // Fallback if no user exists for this role yet
          setProfile({ id: null, name: 'No user found for this role', email: '' });
        }
      })
      .catch(err => console.error("Error fetching profile:", err));
  }, [activeRole]);

  // 3. Save Profile Function
  const handleSaveProfile = () => {
    if (!profile.id) {
      alert("No user exists for this role yet! Create one in User Management first.");
      return;
    }

    fetch(`http://localhost:8000/api/users/${profile.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.name, email: profile.email })
    })
    .then(res => res.json())
    .then(data => {
      alert("Profile updated successfully in the database!");
    })
    .catch(err => console.error("Error saving profile:", err));
  };

  const handleSaveSystemSettings = () => {
    fetch('http://localhost:8000/api/settings/system', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(systemSettings)
    })
    .then(res => res.json())
    .then(data => {
      setSystemSettings(data);
      alert("System configurations updated successfully!");
    })
    .catch(err => console.error("Error saving settings:", err));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="flex space-x-4 border-b mb-6">
        <button onClick={() => setActiveTab('profile')} className={`py-2 px-4 font-semibold ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>My Profile</button>
        <button onClick={() => setActiveTab('notifications')} className={`py-2 px-4 font-semibold ${activeTab === 'notifications' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Notifications</button>
        {activeRole === 'Administrator' && (
          <button onClick={() => setActiveTab('system')} className={`py-2 px-4 font-semibold ${activeTab === 'system' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>System Configuration</button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full border p-2 rounded" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  className="w-full border p-2 rounded" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Current Role</label>
              <input type="text" value={activeRole} disabled className="w-full border p-2 rounded bg-gray-50 text-gray-500" />
            </div>
            
            {/* 4. Connected Save Button */}
            <button 
              onClick={handleSaveProfile}
              className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Email Alerts</h2>
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-semibold">Contract Renewals</p>
                <p className="text-sm text-gray-500">Get notified when a contract is near expiry.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4">Update Preferences</button>
          </div>
        )}

        {/* SYSTEM CONFIGURATION TAB (Admin Only) */}
        {activeTab === 'system' && activeRole === 'Administrator' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Global Parameters</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Default Renewal Warning Period (Days)</label>
              <select value={systemSettings.renewal_warning_days} onChange={(e) => setSystemSettings({...systemSettings, renewal_warning_days: parseInt(e.target.value)})} className="w-full border p-2 rounded">
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Maximum Session Timeout (Minutes)</label>
              <input type="number" value={systemSettings.session_timeout} onChange={(e) => setSystemSettings({...systemSettings, session_timeout: parseInt(e.target.value)})} className="w-full border p-2 rounded" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded mt-4">
              <div>
                <p className="font-semibold">Require Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Force all users to set up 2FA on next login.</p>
              </div>
              <input type="checkbox" checked={systemSettings.require_2fa} onChange={(e) => setSystemSettings({...systemSettings, require_2fa: e.target.checked})} className="w-5 h-5" />
            </div>
            <button onClick={handleSaveSystemSettings} className="bg-red-600 text-white px-4 py-2 rounded mt-4">Save System Config</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;