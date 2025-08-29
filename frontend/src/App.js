import React, { useState } from 'react';
import axios from 'axios';

const BACKEND = 'http://localhost:4000';

const App = () => {
  const [activeUser, setActiveUser] = useState(null);
  const [institutionId, setInstitutionId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [auditorPassword, setAuditorPassword] = useState('');
  const [associateId, setAssociateId] = useState('');
  const [associatePassword, setAssociatePassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState('N/A');
  const [depositAmount, setDepositAmount] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [comment, setComment] = useState('');
  const [txId, setTxId] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDecision, setReviewDecision] = useState('');

  const registerInstitution = async () => {
    try {
      const res = await axios.post(`${BACKEND}/registerInstitution`, { name, location, auditorPassword });
      setMessage(`Institution ID: ${res.data.institutionId}\nAuditor: ${res.data.auditorAddress}`);
      setInstitutionId(res.data.institutionId);
    } catch (e) {
      setMessage(`Error: ${e.response?.data?.error || e.message}`);
    }
  };

  const createAssociate = async () => {
    try {
      const res = await axios.post(`${BACKEND}/createAssociate`, { institutionId, password: associatePassword });
      setMessage(`Associate created with ID: ${res.data.empId}\nAddress: ${res.data.address}`);
    } catch (e) {
      setMessage(`Error: ${e.response?.data?.error || e.message}`);
    }
  };

  const loginAuditor = async () => {
    try {
      const res = await axios.post(`${BACKEND}/loginAuditor`, { institutionId, password: loginPassword });
      setActiveUser({ type: 'auditor', address: res.data.address, instId: institutionId });
      setMessage(`Logged in as Auditor: ${res.data.address}`);
      getBalance(institutionId);
    } catch (e) {
      setMessage(`Error: ${e.response?.data?.error || e.message}`);
    }
  };

  const loginAssociate = async () => {
    try {
      const res = await axios.post(`${BACKEND}/loginAssociate`, { institutionId, empId: associateId, password: loginPassword });
      setActiveUser({ type: 'associate', address: res.data.address, instId: institutionId });
      setMessage(`Logged in as Associate: ${res.data.address}`);
      getBalance(institutionId);
    } catch (e) {
      setMessage(`Error: ${e.response?.data?.error || e.message}`);
    }
  };

  const getBalance = async (instId) => {
    try {
      const res = await axios.get(`${BACKEND}/institution/${instId}`);
      setBalance(res.data.balance);
    } catch (e) {
      setBalance('Failed to get balance');
      console.error(e);
    }
  };

  const depositFunds = async () => {
    try {
      if (activeUser?.type !== 'auditor') {
        setMessage('Error: Only auditors can deposit funds.');
        return;
      }
      const res = await axios.post(`${BACKEND}/depositInstitution`, { institutionId, auditorPassword: loginPassword, valueEther: depositAmount });
      setMessage(`Deposit transaction sent: ${res.data.message}`);
      getBalance(institutionId);
    } catch (e) {
      setMessage(`Error: ${e.response?.data?.error || e.message}`);
    }
  };

  const createTransaction = async () => {
    try {
      if (activeUser?.type !== 'associate') {
        setMessage('Error: Only associates can create transactions.');
        return;
      }
      const res = await axios.post(`${BACKEND}/createTransaction`, {
        institutionId,
        empId: associateId,
        password: loginPassword,
        receiver,
        amountEther: amount,
        purpose,
        comment
      });
      setMessage(`Transaction created with ID: ${res.data.txId}`);
    } catch (e) {
      setMessage(`Error: ${e.response?.data?.error || e.message}`);
    }
  };

  const reviewTransaction = async () => {
    try {
      if (activeUser?.type !== 'auditor') {
        setMessage('Error: Only auditors can review transactions.');
        return;
      }
      const res = await axios.post(`${BACKEND}/reviewTransaction`, {
        institutionId,
        auditorPassword: loginPassword,
        txId,
        decision: reviewDecision,
        auditorComment: reviewComment
      });
      setMessage(`Transaction ${txId} review complete: ${res.data.message}`);
    } catch (e) {
      setMessage(`Error: ${e.response?.data?.error || e.message}`);
    }
  };

  const renderSection = (title, content, id) => (
    <div key={id} style={{border: '1px solid #ccc', padding: 20, borderRadius: 8, marginBottom: 20}}>
      <h3>{title}</h3>
      {content}
    </div>
  );

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <h1>Ledger Knight Frontend</h1>
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
        {message}
      </pre>

      {renderSection(
        'Register Institution',
        <>
          <label>Name</label><br/>
          <input value={name} onChange={e => setName(e.target.value)} /><br/>
          <label>Location</label><br/>
          <input value={location} onChange={e => setLocation(e.target.value)} /><br/>
          <label>Auditor Password</label><br/>
          <input type="password" value={auditorPassword} onChange={e => setAuditorPassword(e.target.value)} /><br/>
          <button onClick={registerInstitution} style={{ marginTop: 10 }}>Register Institution</button>
        </>,
        'register'
      )}

      {renderSection(
        'Login',
        <>
          <label>Institution ID</label><br/>
          <input value={institutionId} onChange={e => setInstitutionId(e.target.value)} /><br/>
          <label>Login Password</label><br/>
          <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} /><br/>
          <div>
            <label>Associate ID (for associate login)</label><br/>
            <input value={associateId} onChange={e => setAssociateId(e.target.value)} /><br/>
          </div>
          <button onClick={loginAuditor} style={{ marginTop: 10 }}>Login as Auditor</button>
          <button onClick={loginAssociate} style={{ marginTop: 10, marginLeft: 10 }}>Login as Associate</button>
        </>,
        'login'
      )}

      {activeUser && (
        <>
          {renderSection(
            'Create Associate',
            <>
              <p>Auditor needs to be logged in to create associates.</p>
              <label>Associate Password</label><br/>
              <input type="password" value={associatePassword} onChange={e => setAssociatePassword(e.target.value)} /><br/>
              <button onClick={createAssociate} style={{ marginTop: 10 }}>Create Associate</button>
            </>,
            'create-associate'
          )}

          {renderSection(
            `Institution Balance: ${balance} ETH`,
            <>
              {activeUser?.type === 'auditor' && (
                <>
                  <label>Deposit Amount (ETH)</label><br/>
                  <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} /><br/>
                  <button onClick={depositFunds} style={{ marginTop: 10 }}>Deposit Funds</button>
                </>
              )}
            </>,
            'balance-deposit'
          )}

          {activeUser?.type === 'associate' && renderSection(
            'Create Transaction',
            <>
              <label>Receiver Address</label><br/>
              <input value={receiver} onChange={e => setReceiver(e.target.value)} /><br/>
              <label>Amount (ETH)</label><br/>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} /><br/>
              <label>Purpose</label><br/>
              <input value={purpose} onChange={e => setPurpose(e.target.value)} /><br/>
              <label>Comment</label><br/>
              <input value={comment} onChange={e => setComment(e.target.value)} /><br/>
              <button onClick={createTransaction} style={{ marginTop: 10 }}>Create Transaction</button>
            </>,
            'create-tx'
          )}

          {activeUser?.type === 'auditor' && renderSection(
            'Review Transaction',
            <>
              <label>Transaction ID</label><br/>
              <input value={txId} onChange={e => setTxId(e.target.value)} /><br/>
              <label>Decision</label><br/>
              <select value={reviewDecision} onChange={e => setReviewDecision(e.target.value)}>
                <option value="">Select...</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
                <option value="Review">Review</option>
              </select><br/>
              <label>Auditor Comment</label><br/>
              <input value={reviewComment} onChange={e => setReviewComment(e.target.value)} /><br/>
              <button onClick={reviewTransaction} style={{ marginTop: 10 }}>Review Transaction</button>
            </>,
            'review-tx'
          )}
        </>
      )}
    </div>
  );
};

export default App;
