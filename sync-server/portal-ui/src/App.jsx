import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('sync_admin_token') || null);

  const handleLogin = (newToken) => {
    localStorage.setItem('sync_admin_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('sync_admin_token');
    setToken(null);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/*" 
          element={token ? <Dashboard onLogout={handleLogout} token={token} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
