import React, { useState, useEffect } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', role: 'Employee', department: '', status: 'Active'
  });

  // Fetch users from FastAPI backend
  useEffect(() => {
    fetch('http://localhost:8000/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Error fetching users:", err));
  }, []);

  // Handle form submission
  const handleAddUser = (e) => {
    e.preventDefault();
    fetch('http://localhost:8000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    })
    .then(res => res.json())
    .then(data => {
      setUsers([...users, data]); // Instantly update UI
      setShowModal(false); // Close modal
      setNewUser({ name: '', email: '', role: 'Employee', department: '', status: 'Active' });
    });
  };
  const handleDeleteUser = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      fetch(`http://localhost:8000/api/users/${id}`, {
        method: 'DELETE',
      })
      .then(res => {
        if (res.ok) {
          // Remove the user from the UI instantly
          setUsers(users.filter(user => user.id !== id)); 
        }
      })
      .catch(err => console.error("Error deleting user:", err));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add User
        </button>
      </div>

      {/* User Data Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Department</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4 font-semibold text-gray-700">{user.role}</td>
                <td className="p-4">{user.department}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <input type="text" placeholder="Full Name" required className="w-full border p-2 rounded"
                value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              
              <input type="email" placeholder="Email Address" required className="w-full border p-2 rounded"
                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              
              <select className="w-full border p-2 rounded" value={newUser.role} 
                onChange={e => setNewUser({...newUser, role: e.target.value})}>
                <option>Administrator</option>
                <option>Legal Manager</option>
                <option>Compliance Officer</option>
                <option>Contract Manager</option>
                <option>Department Head</option>
                <option>Employee</option>
              </select>

              <input type="text" placeholder="Department" className="w-full border p-2 rounded"
                value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />

              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;