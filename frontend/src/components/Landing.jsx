import React from 'react';
import { Shield, Zap, Users, ArrowRight } from 'lucide-react';

const Landing = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center animate-fade-in">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-6 animate-bounce-subtle">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
            Ledger Knight
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Secure, transparent, and efficient blockchain-based budget management for institutions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="card group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Secure Transactions</h3>
            <p className="text-gray-600">Blockchain-powered security ensures all transactions are immutable and transparent</p>
          </div>
          
          <div className="card group">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 text-secondary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Real-time Updates</h3>
            <p className="text-gray-600">Live balance tracking and instant transaction status updates</p>
          </div>
          
          <div className="card group">
            <div className="w-12 h-12 bg-gradient-to-br from-success-100 to-success-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Multi-role Access</h3>
            <p className="text-gray-600">Separate dashboards for auditors and associates with role-based permissions</p>
          </div>
        </div>

        <button 
          onClick={onGetStarted}
          className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-3 group"
        >
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};

export default Landing;