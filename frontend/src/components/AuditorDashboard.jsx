import React, { useState } from 'react';
import { Shield, Users, LogOut, Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import MetricsCard from './MetricsCard';
import TransactionTable from './TransactionTable';

const AuditorDashboard = ({ 
  user, 
  institutionData, 
  transactions, 
  onCreateAssociate, 
  onDeleteAssociate,
  onReviewTransaction, 
  onLogout 
}) => {
  const [showCreateAssociate, setShowCreateAssociate] = useState(false);
  const [showDeleteAssociate, setShowDeleteAssociate] = useState(false);
  const [createAssociateData, setCreateAssociateData] = useState({
    username: '',
    password: '',
    auditorPassword: ''
  });
  const [deleteAssociateData, setDeleteAssociateData] = useState({
    username: '',
    auditorPassword: ''
  });

  const handleCreateAssociate = async (e) => {
    e.preventDefault();
    if (!createAssociateData.username || !createAssociateData.password || !createAssociateData.auditorPassword) return;
    await onCreateAssociate(createAssociateData.username, createAssociateData.password, createAssociateData.auditorPassword);
    setCreateAssociateData({ username: '', password: '', auditorPassword: '' });
    setShowCreateAssociate(false);
  };

  const handleDeleteAssociate = async (e) => {
    e.preventDefault();
    if (!deleteAssociateData.username || !deleteAssociateData.auditorPassword) return;
    await onDeleteAssociate(deleteAssociateData.username, deleteAssociateData.auditorPassword);
    setDeleteAssociateData({ username: '', auditorPassword: '' });
    setShowDeleteAssociate(false);
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
              onClick={() => setShowDeleteAssociate(true)}
              className="btn-error inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Delete Associate
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
          {institutionData?.associates?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {institutionData.associates.map((associate, index) => (
                <div key={associate.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-secondary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{associate.username}</p>
                        <p className="text-xs text-gray-500 font-mono">{associate.id}</p>
                        <p className="text-xs text-gray-600 font-mono">{associate.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Associates</h3>
              <p className="text-gray-500">Create associates to help manage transactions</p>
            </div>
          )}
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
                  <label className="label">Username</label>
                  <input
                    type="text"
                    value={createAssociateData.username}
                    onChange={(e) => setCreateAssociateData(prev => ({ ...prev, username: e.target.value }))}
                    className="input-field"
                    placeholder="Enter username for associate"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="label">Associate Password</label>
                  <input
                    type="password"
                    value={createAssociateData.password}
                    onChange={(e) => setCreateAssociateData(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field"
                    placeholder="Enter password for new associate"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="label">Auditor Password (Confirmation)</label>
                  <input
                    type="password"
                    value={createAssociateData.auditorPassword}
                    onChange={(e) => setCreateAssociateData(prev => ({ ...prev, auditorPassword: e.target.value }))}
                    className="input-field"
                    placeholder="Enter your auditor password"
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

        {/* Delete Associate Modal */}
        {showDeleteAssociate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md animate-slide-up">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Delete Associate</h3>
              <form onSubmit={handleDeleteAssociate}>
                <div className="mb-4">
                  <label className="label">Username</label>
                  <select
                    value={deleteAssociateData.username}
                    onChange={(e) => setDeleteAssociateData(prev => ({ ...prev, username: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select associate to delete...</option>
                    {institutionData?.associates?.map((associate) => (
                      <option key={associate.id} value={associate.username}>
                        {associate.username} ({associate.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="label">Auditor Password (Confirmation)</label>
                  <input
                    type="password"
                    value={deleteAssociateData.auditorPassword}
                    onChange={(e) => setDeleteAssociateData(prev => ({ ...prev, auditorPassword: e.target.value }))}
                    className="input-field"
                    placeholder="Enter your auditor password"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-error flex-1">
                    Delete Associate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteAssociate(false)}
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