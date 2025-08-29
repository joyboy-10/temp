import React, { useState } from 'react';
import { User, Send, LogOut, MessageSquare, TrendingUp, DollarSign, CheckCircle, Clock } from 'lucide-react';
import MetricsCard from './MetricsCard';
import TransactionTable from './TransactionTable';

const AssociateDashboard = ({ 
  user, 
  institutionData, 
  transactions, 
  onCreateTransaction, 
  onLogout 
}) => {
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);
  const [transactionData, setTransactionData] = useState({
    receiver: '',
    amount: '',
    purpose: '',
    deadline: '',
    priority: 'medium',
    comment: ''
  });

  const purposes = [
    'Office Supplies',
    'Equipment Maintenance', 
    'Software License',
    'Travel Expenses',
    'Marketing',
    'Training',
    'Utilities',
    'Other'
  ];

  const handleInputChange = (field, value) => {
    setTransactionData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!transactionData.receiver || !transactionData.amount || !transactionData.purpose) {
      return;
    }
    await onCreateTransaction(transactionData);
    setTransactionData({
      receiver: '',
      amount: '',
      purpose: '',
      deadline: '',
      priority: 'medium',
      comment: ''
    });
    setShowCreateTransaction(false);
  };

  // Filter user's transactions
  const userTransactions = transactions.filter(tx => 
    tx.creator && user?.address && tx.creator.toLowerCase() === user.address.toLowerCase()
  );
  
  const approvedTransactions = userTransactions.filter(tx => tx.status === 1);
  const totalRequested = userTransactions.reduce((sum, tx) => {
    return sum + (parseFloat(tx.amount) || 0);
  }, 0);
  
  const totalApproved = approvedTransactions.reduce((sum, tx) => {
    return sum + (parseFloat(tx.amount) || 0);
  }, 0);

  const pendingTransactions = userTransactions.filter(tx => tx.status === 0);

  // Get admin messages
  const adminMessages = userTransactions
    .filter(tx => tx.auditorComment && tx.auditorComment.trim())
    .map(tx => ({
      txId: tx.id,
      status: tx.status,
      comment: tx.auditorComment,
      date: tx.createdAt
    }));

  const balance = institutionData?.balance || '0';

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Associate Dashboard</h1>
            <div className="flex flex-col gap-1 text-sm text-gray-600">
              <p>Institution: <span className="font-semibold">{institutionData?.institution?.name}</span></p>
              <p>ID: <span className="font-mono font-semibold">{user?.institutionId}</span></p>
              <p>Address: <span className="font-mono font-semibold">{user?.address}</span></p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateTransaction(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              New Transaction
            </button>
            <button
              onClick={onLogout}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Institution Balance"
            value={`${parseFloat(balance).toFixed(4)} ETH`}
            icon={DollarSign}
            color="primary"
          />
          <MetricsCard
            title="Total Requested"
            value={`${totalRequested.toFixed(4)} ETH`}
            icon={TrendingUp}
            color="secondary"
          />
          <MetricsCard
            title="Total Approved"
            value={`${totalApproved.toFixed(4)} ETH`}
            icon={CheckCircle}
            color="success"
          />
          <MetricsCard
            title="Pending Requests"
            value={pendingTransactions.length}
            icon={Clock}
            color="warning"
          />
        </div>

        {/* Admin Messages */}
        {adminMessages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-secondary-500" />
              Admin Messages ({adminMessages.length})
            </h2>
            <div className="space-y-3">
              {adminMessages.map((msg, index) => (
                <div key={index} className="card border-l-4 border-secondary-500">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-gray-700">Transaction #{msg.txId}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      msg.status === 1 ? 'bg-success-100 text-success-800' :
                      msg.status === 2 ? 'bg-error-100 text-error-800' :
                      'bg-secondary-100 text-secondary-800'
                    }`}>
                      {msg.status === 1 ? 'Approved' : msg.status === 2 ? 'Declined' : 'Under Review'}
                    </span>
                  </div>
                  <p className="text-gray-600">{msg.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Transactions */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" />
            My Transactions ({userTransactions.length})
          </h2>
          <TransactionTable
            transactions={userTransactions}
            showActions={false}
            userType="associate"
            currentUserAddress={user?.address}
          />
        </div>

        {/* Create Transaction Modal */}
        {showCreateTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Transaction</h3>
              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="label">Receiver Address</label>
                  <input
                    type="text"
                    value={transactionData.receiver}
                    onChange={(e) => handleInputChange('receiver', e.target.value)}
                    className="input-field"
                    placeholder="0x..."
                    required
                  />
                </div>
                
                <div>
                  <label className="label">Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={transactionData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="input-field"
                    placeholder="0.0000"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">Purpose</label>
                  <select
                    value={transactionData.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select purpose...</option>
                    {purposes.map((purpose, index) => (
                      <option key={index} value={purpose}>{purpose}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="label">Deadline</label>
                  <input
                    type="datetime-local"
                    value={transactionData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="label">Priority</label>
                  <select
                    value={transactionData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">Comment</label>
                  <textarea
                    value={transactionData.comment}
                    onChange={(e) => handleInputChange('comment', e.target.value)}
                    className="input-field"
                    rows="3"
                    placeholder="Additional details..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Transaction
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateTransaction(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssociateDashboard;