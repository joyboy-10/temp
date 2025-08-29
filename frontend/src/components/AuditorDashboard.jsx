import React, { useState } from 'react';
import { Shield, Plus, LogOut, Wallet, Users, TrendingUp, DollarSign } from 'lucide-react';
import MetricsCard from './MetricsCard';
import TransactionTable from './TransactionTable';

const AuditorDashboard = ({ 
  user, 
  institutionId, 
  balance, 
  transactions, 
  onCreateAssociate, 
  onDeposit, 
  onReviewTransaction, 
  onLogout,
  message 
}) => {
  const [showCreateAssociate, setShowCreateAssociate] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [associatePassword, setAssociatePassword] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  const handleCreateAssociate = async (e) => {
    e.preventDefault();
    if (!associatePassword) return;
    await onCreateAssociate(associatePassword);
    setAssociatePassword('');
    setShowCreateAssociate(false);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount) return;
    await onDeposit(depositAmount);
    setDepositAmount('');
    setShowDeposit(false);
  };

  // Calculate metrics from transactions
  const approvedTransactions = transactions.filter(tx => tx.status === 1);
  const totalSpent = approvedTransactions.reduce((sum, tx) => {
    return sum + (parseFloat(tx.amountWei) / Math.pow(10, 18));
  }, 0);
  
  const pendingTransactions = transactions.filter(tx => tx.status === 0);
  const avgTransactionAmount = approvedTransactions.length > 0 
    ? totalSpent / approvedTransactions.length 
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Auditor Dashboard</h1>
            <div className="flex flex-col gap-1 text-sm text-gray-600">
              <p>Institution ID: <span className="font-mono font-semibold">{institutionId}</span></p>
              <p>Address: <span className="font-mono font-semibold">{user?.address}</span></p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateAssociate(true)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Add Associate
            </button>
            <button
              onClick={() => setShowDeposit(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Deposit Funds
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
            title="Current Balance"
            value={`${parseFloat(balance || 0).toFixed(4)} ETH`}
            icon={Wallet}
            color="primary"
          />
          <MetricsCard
            title="Total Spent"
            value={`${totalSpent.toFixed(4)} ETH`}
            icon={TrendingDown}
            color="error"
          />
          <MetricsCard
            title="Pending Reviews"
            value={pendingTransactions.length}
            icon={Clock}
            color="warning"
          />
          <MetricsCard
            title="Avg Transaction"
            value={`${avgTransactionAmount.toFixed(4)} ETH`}
            icon={TrendingUp}
            color="success"
          />
        </div>

        {/* Pending Transactions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning-500" />
            Pending Transactions ({pendingTransactions.length})
          </h2>
          <TransactionTable
            transactions={pendingTransactions}
            showActions={true}
            onReview={onReviewTransaction}
            userType="auditor"
          />
        </div>

        {/* All Transactions */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-500" />
            Transaction History ({transactions.length})
          </h2>
          <TransactionTable
            transactions={transactions}
            showActions={false}
            userType="auditor"
          />
        </div>

        {/* Create Associate Modal */}
        {showCreateAssociate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md animate-slide-up">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Associate</h3>
              <form onSubmit={handleCreateAssociate}>
                <div className="mb-4">
                  <label className="label">Associate Password</label>
                  <input
                    type="password"
                    value={associatePassword}
                    onChange={(e) => setAssociatePassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter password for new associate"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1">
                    Create Associate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateAssociate(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md animate-slide-up">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Deposit Funds</h3>
              <form onSubmit={handleDeposit}>
                <div className="mb-4">
                  <label className="label">Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input-field"
                    placeholder="Enter amount to deposit"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1">
                    Deposit Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeposit(false)}
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

export default AuditorDashboard;