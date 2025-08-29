import React, { useState } from 'react';
import { Shield, Users, LogOut, Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import MetricsCard from './MetricsCard';
import TransactionTable from './TransactionTable';

const AuditorDashboard = ({ 
  user, 
  institutionData, 
  transactions, 
  onCreateAssociate, 
  onReviewTransaction, 
  onLogout 
}) => {
  const [showCreateAssociate, setShowCreateAssociate] = useState(false);
  const [associatePassword, setAssociatePassword] = useState('');

  const handleCreateAssociate = async (e) => {
    e.preventDefault();
    if (!associatePassword) return;
    await onCreateAssociate(associatePassword);
    setAssociatePassword('');
    setShowCreateAssociate(false);
  };

  const pendingTransactions = transactions.filter(tx => tx.status === 0);
  const balance = institutionData?.balance || '0';
  const metrics = institutionData?.metrics || {};

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Auditor Dashboard</h1>
            <div className="flex flex-col gap-1 text-sm text-gray-600">
              <p>Institution: <span className="font-semibold">{institutionData?.institution?.name}</span></p>
              <p>ID: <span className="font-mono font-semibold">{user?.institutionId}</span></p>
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
            value={`${parseFloat(balance).toFixed(4)} ETH`}
            icon={Wallet}
            color="primary"
          />
          <MetricsCard
            title="Total Spent"
            value={`${metrics.totalSpent || '0'} ETH`}
            icon={TrendingDown}
            color="error"
          />
          <MetricsCard
            title="Pending Reviews"
            value={metrics.pendingTransactions || 0}
            icon={Clock}
            color="warning"
          />
          <MetricsCard
            title="Avg Transaction"
            value={`${metrics.avgTransaction || '0'} ETH`}
            icon={TrendingUp}
            color="success"
          />
        </div>

        {/* Associates */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary-500" />
            Associates ({institutionData?.associates?.length || 0}/2)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {institutionData?.associates?.map((associate, index) => (
              <div key={associate.id} className="card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{associate.id}</p>
                    <p className="text-sm text-gray-600 font-mono">{associate.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            <Shield className="w-5 h-5 text-primary-500" />
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
      </div>
    </div>
  );
};

export default AuditorDashboard;