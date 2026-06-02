import React, { useEffect, useState } from 'react';

function App() {
  const [users, setUsers] = useState([]);
  const [backendStatus, setBackendStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Test backend connection
    fetch('http://localhost:5000')
      .then(res => res.json())
      .then(data => setBackendStatus(data.message))
      .catch(() => setBackendStatus('Backend not reachable'));

    // Fetch users
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setUsers(data);
      })
      .catch(() => setError('Could not fetch users'));
  }, []);

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h1>Jenkins CI/CD Test App v2</h1>
      <p>Backend Status: <strong>{backendStatus}</strong></p>

      <h2>Users from PostgreSQL</h2>
      {error && <p style={{ color: 'red' }}>DB Error: {error}</p>}
      {users.length === 0 && !error && <p>No users found in database.</p>}
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name} — {user.email}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;