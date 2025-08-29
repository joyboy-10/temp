import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Landing from './components/Landing';
import Auth from './components/Auth';
import AuditorDashboard from './components/AuditorDashboard';
import AssociateDashboard from './components/AssociateDashboard';
import MessageBanner from './components/MessageBanner';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const App = () => {
  // Application state
  const [view, setView] = useState('landing'); // 'landing', 'auth', 'auditor', 'associate'
  const [user, setUser] = useState(null);
  const [institutionId, setInstitutionId] = useState('');
  const [balance, setBalance] = useState('0');
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState(null);
  const [loginCredentials, setLoginCredentials] = useState(null);

  // Auto-refresh data every 5 seconds when logged in
  useEffect(() => {
    if (user && institutionId) {
      const interval = setInterval(() => {
        fetchBalance();
        fetchTransactions();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, institutionId]);

  // Initial data fetch when user logs in
  useEffect(() => {
    if (user && institutionId) {
      fetchBalance();
      fetchTransactions();
    }
  }, [user, institutionId]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const clearMessage = () => {
    setMessage(null);
  };

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${BACKEND}/institution/${institutionId}`);
      setBalance(res.data.balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${BACKEND}/transactions/${institutionId}`);
      setTransactions(res.data.txs || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleRegister = async (name, location, auditorPassword) => {
    try {
      const res = await axios.post(`${BACKEND}/registerInstitution`, {
        name,
        location,
        auditorPassword
      });
      
      setInstitutionId(res.data.institutionId);
      showMessage('success', `Institution registered successfully!\nInstitution ID: ${res.data.institutionId}\nAuditor Address: ${res.data.auditorAddress}`);
      
      // Auto-login as auditor after registration
      setUser({
        type: 'auditor',
        address: res.data.auditorAddress,
        institutionId: res.data.institutionId
      });
      setLoginCredentials({ password: auditorPassword, type: 'auditor' });
      setView('auditor');
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Registration failed');
    }
  };

  const handleLogin = async (instId, password, userType, associateId = '') => {
    try {
      let res;
      if (userType === 'auditor') {
        res = await axios.post(`${BACKEND}/loginAuditor`, {
          institutionId: instId,
          password
        });
      } else {
        res = await axios.post(`${BACKEND}/loginAssociate`, {
          institutionId: instId,
          empId: associateId,
          password
        });
      }

      setUser({
        type: userType,
        address: res.data.address,
        institutionId: instId,
        associateId: userType === 'associate' ? associateId : null
      });
      setInstitutionId(instId);
      setLoginCredentials({ password, type: userType, associateId });
      setView(userType);
      showMessage('success', `Logged in successfully as ${userType}`);
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Login failed');
    }
  };

  const handleCreateAssociate = async (password) => {
    try {
      const res = await axios.post(`${BACKEND}/createAssociate`, {
        institutionId,
        password
      });
      showMessage('success', `Associate created successfully!\nID: ${res.data.empId}\nAddress: ${res.data.address}`);
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to create associate');
    }
  };

  const handleDeposit = async (amount) => {
    try {
      const res = await axios.post(`${BACKEND}/depositInstitution`, {
        institutionId,
        auditorPassword: loginCredentials?.password,
        valueEther: amount
      });
      showMessage('success', `Deposit successful! ${amount} ETH added to institution balance`);
      fetchBalance();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Deposit failed');
    }
  };

  const handleCreateTransaction = async (transactionData) => {
    try {
      const res = await axios.post(`${BACKEND}/createTransaction`, {
        institutionId,
        empId: user.associateId,
        password: loginCredentials?.password,
        receiver: transactionData.receiver,
        amountEther: transactionData.amount,
        purpose: transactionData.purpose,
        comment: `${transactionData.comment}\nDeadline: ${transactionData.deadline}\nPriority: ${transactionData.priority}`
      });
      showMessage('success', `Transaction created successfully!\nTransaction ID: ${res.data.txId}`);
      fetchTransactions();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to create transaction');
    }
  };

  const handleReviewTransaction = async (txId, decision, comment = '') => {
    try {
      const res = await axios.post(`${BACKEND}/reviewTransaction`, {
        institutionId,
        auditorPassword: loginCredentials?.password,
        txId,
        decision,
        auditorComment: comment
      });
      showMessage('success', `Transaction ${txId} ${decision.toLowerCase()} successfully`);
      fetchTransactions();
      fetchBalance();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to review transaction');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setInstitutionId('');
    setBalance('0');
    setTransactions([]);
    setLoginCredentials(null);
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
            institutionId={institutionId}
            balance={balance}
            transactions={transactions}
            onCreateAssociate={handleCreateAssociate}
            onDeposit={handleDeposit}
            onReviewTransaction={handleReviewTransaction}
            onLogout={handleLogout}
            message={message}
          />
        );
      
      case 'associate':
        return (
          <AssociateDashboard
            user={user}
            institutionId={institutionId}
            balance={balance}
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