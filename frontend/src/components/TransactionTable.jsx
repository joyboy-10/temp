import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';

const TransactionTable = ({ 
  transactions, 
  showActions = false, 
  onReview, 
  userType = 'auditor',
  currentUserAddress 
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 0: return <Clock className="w-4 h-4 text-warning-500" />;
      case 1: return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 2: return <XCircle className="w-4 h-4 text-error-500" />;
      case 3: return <AlertCircle className="w-4 h-4 text-secondary-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Declined';
      case 3: return 'Review';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return 'bg-warning-100 text-warning-800';
      case 1: return 'bg-success-100 text-success-800';
      case 2: return 'bg-error-100 text-error-800';
      case 3: return 'bg-secondary-100 text-secondary-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amountWei) => {
    try {
      const eth = parseFloat(amountWei);
      return `${eth.toFixed(4)} ETH`;
    } catch {
      return '0 ETH';
    }
  };

  const formatDate = (timestamp) => {
    try {
      return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Transactions</h3>
        <p className="text-gray-500">No transactions found for this view</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Receiver</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Purpose</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              {showActions && <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr 
                key={tx.id || index} 
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                  currentUserAddress && tx.creator && tx.creator.toLowerCase() === currentUserAddress.toLowerCase() 
                    ? 'bg-blue-50' : ''
                }`}
              >
                <td className="py-3 px-4 font-mono text-sm">{tx.id}</td>
                <td className="py-3 px-4 font-mono text-sm">{truncateAddress(tx.receiver)}</td>
                <td className="py-3 px-4 font-semibold text-gray-800">{formatAmount(tx.amount)}</td>
                <td className="py-3 px-4 text-gray-600">{tx.purpose || 'N/A'}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                    {getStatusIcon(tx.status)}
                    {getStatusText(tx.status)}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
                {showActions && tx.status === 0 && (
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onReview(tx.id, 'Approved', '')}
                        className="btn-success text-xs px-3 py-1"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onReview(tx.id, 'Declined', '')}
                        className="btn-error text-xs px-3 py-1"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => onReview(tx.id, 'Review', '')}
                        className="btn-warning text-xs px-3 py-1"
                      >
                        Review
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;