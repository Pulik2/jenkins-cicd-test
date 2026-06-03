import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [users, setUsers] = useState([]);
  const [backendStatus, setBackendStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}`)
      .then(res => res.json())
      .then(data => setBackendStatus(data.message))
      .catch(() => setBackendStatus('Backend not reachable'));

    fetch(`${API}/api/users`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setUsers(data);
      })
      .catch(() => setError('Could not fetch users'));
  }, []);

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h1>Jenkins CI/CD Test App v17</h1>
      <p>Backend Status: <strong>{backendStatus}</strong></p>
      <h2>Users from PostgreSQL Live</h2>
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