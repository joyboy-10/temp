import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Landing from './components/Landing';
import Auth from './components/Auth';
import AuditorDashboard from './components/AuditorDashboard';
import AssociateDashboard from './components/AssociateDashboard';
import MessageBanner from './components/MessageBanner';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const App = () => {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [institutionData, setInstitutionData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState(null);

  // Setup axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Auto-refresh data when logged in
  useEffect(() => {
    if (user && token) {
      fetchInstitutionData();
      fetchTransactions();
      
      const interval = setInterval(() => {
        fetchInstitutionData();
        fetchTransactions();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const clearMessage = () => {
    setMessage(null);
  };

  const fetchInstitutionData = async () => {
    try {
      const res = await axios.get(`/institutions/${user.institutionId}/summary`);
      setInstitutionData(res.data);
    } catch (error) {
      console.error('Failed to fetch institution data:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/transactions');
      setTransactions(res.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleRegister = async (name, location, auditorPassword) => {
    try {
      const res = await axios.post('/institutions/register', {
        name,
        location,
        auditorPassword
      });
      
      showMessage('success', `Institution registered!\nID: ${res.data.institutionId}\nAuditor: ${res.data.auditorAddress}`);
      
      // Auto-login as auditor
      setTimeout(() => {
        handleLogin(res.data.institutionId, auditorPassword, 'auditor');
      }, 2000);
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Registration failed');
    }
  };

  const handleLogin = async (institutionId, password, userType, associateId = '') => {
    try {
      let res;
      if (userType === 'auditor') {
        res = await axios.post('/auth/login-auditor', {
          institutionId,
          password
        });
      } else {
        res = await axios.post('/auth/login-associate', {
          institutionId,
          username: associateId,
          password
        });
      }

      const { token, user: userData } = res.data;
      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
      setView(userData.role);
      showMessage('success', `Logged in as ${userData.role}`);
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Login failed');
    }
  };

  const handleCreateAssociate = async (username, password, auditorPassword) => {
    try {
      const res = await axios.post('/auth/create-associate', {
        institutionId: user.institutionId,
        username,
        password,
        auditorPassword
      });
      showMessage('success', `Associate created!\nUsername: ${res.data.username}\nID: ${res.data.empId}\nAddress: ${res.data.address}`);
      fetchInstitutionData();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to create associate');
    }
  };

  const handleDeleteAssociate = async (username, auditorPassword) => {
    try {
      const res = await axios.delete('/auth/delete-associate', {
        data: {
          institutionId: user.institutionId,
          username,
          auditorPassword
        }
      });
      showMessage('success', `Associate ${username} deleted successfully`);
      fetchInstitutionData();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to delete associate');
    }
  };

  const handleCreateTransaction = async (transactionData) => {
    try {
      const res = await axios.post('/transactions', {
        receiver: transactionData.receiver,
        amountEther: transactionData.amount,
        purpose: transactionData.purpose,
        comment: transactionData.comment,
        deadline: transactionData.deadline,
        priority: transactionData.priority
      });
      showMessage('success', `Transaction created!\nID: ${res.data.txId}`);
      fetchTransactions();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to create transaction');
    }
  };

  const handleReviewTransaction = async (txId, decision, comment = '') => {
    try {
      const res = await axios.post(`/transactions/${txId}/review`, {
        decision,
        auditorComment: comment
      });
      showMessage('success', `Transaction ${decision.toLowerCase()}`);
      fetchTransactions();
      fetchInstitutionData();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to review transaction');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setInstitutionData(null);
    setTransactions([]);
    localStorage.removeItem('token');
    setView('landing');
    showMessage('info', 'Logged out successfully');
  };

  const renderCurrentView = () => {
    switch (view) {
      case 'landing':
        return <Landing onGetStarted={() => setView('auth')} />;
      
      case 'auth':
        return (
          <Auth
            onRegister={handleRegister}
            onLogin={handleLogin}
            message={message}
            setMessage={setMessage}
          />
        );
      
      case 'auditor':
        return (
          <AuditorDashboard
            user={user}
            institutionData={institutionData}
            transactions={transactions}
            onCreateAssociate={handleCreateAssociate}
            onDeleteAssociate={handleDeleteAssociate}
            onReviewTransaction={handleReviewTransaction}
            onLogout={handleLogout}
            message={message}
          />
        );
      
      case 'associate':
        return (
          <AssociateDashboard
            user={user}
            institutionData={institutionData}
            transactions={transactions}
            onCreateTransaction={handleCreateTransaction}
            onLogout={handleLogout}
            message={message}
          />
        );
      
      default:
        return <Landing onGetStarted={() => setView('auth')} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentView()}
      <MessageBanner message={message} onClose={clearMessage} />
    </div>
  );
};

export default App;