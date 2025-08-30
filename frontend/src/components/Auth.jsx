import React, { useState } from 'react';
import { Building2, User, Lock, MapPin, Key } from 'lucide-react';

const Auth = ({ onRegister, onLogin, message, setMessage }) => {
  const [activeTab, setActiveTab] = useState('register');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    auditorPassword: '',
    institutionId: '',
    loginPassword: '',
    associateId: '',
    userType: 'auditor'
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(''); // Clear messages when user types
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.auditorPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }
    await onRegister(formData.name, formData.location, formData.auditorPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.institutionId || !formData.loginPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }
    
    if (formData.userType === 'associate' && !formData.associateId) {
      setMessage({ type: 'error', text: 'Associate ID is required for associate login' });
      return;
    }
    
    await onLogin(formData.institutionId, formData.loginPassword, formData.userType, formData.associateId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Access your Ledger Knight dashboard</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'register'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'login'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Login
            </button>
          </div>

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Institution Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-field"
                  placeholder="Enter institution name"
                />
              </div>
              
              <div>
                <label className="label">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="input-field"
                  placeholder="Enter location"
                />
              </div>
              
              <div>
                <label className="label">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Auditor Password
                </label>
                <input
                  type="password"
                  value={formData.auditorPassword}
                  onChange={(e) => handleInputChange('auditorPassword', e.target.value)}
                  className="input-field"
                  placeholder="Create a secure password"
                />
              </div>
              
              <button type="submit" className="btn-primary w-full">
                Register Institution
              </button>
            </form>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">
                  <Key className="w-4 h-4 inline mr-2" />
                  Institution ID
                </label>
                <input
                  type="text"
                  value={formData.institutionId}
                  onChange={(e) => handleInputChange('institutionId', e.target.value)}
                  className="input-field"
                  placeholder="Enter institution ID"
                />
              </div>
              
              <div>
                <label className="label">User Type</label>
                <select
                  value={formData.userType}
                  onChange={(e) => handleInputChange('userType', e.target.value)}
                  className="input-field"
                >
                  <option value="auditor">Auditor</option>
                  <option value="associate">Associate</option>
                </select>
              </div>
              
              {formData.userType === 'associate' && (
                <div>
                  <label className="label">
                    <User className="w-4 h-4 inline mr-2" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.associateId}
                    onChange={(e) => handleInputChange('associateId', e.target.value)}
                    className="input-field"
                    placeholder="Enter username"
                  />
                </div>
              )}
              
              <div>
                <label className="label">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <input
                  type="password"
                  value={formData.loginPassword}
                  onChange={(e) => handleInputChange('loginPassword', e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                />
              </div>
              
              <button type="submit" className="btn-primary w-full">
                Login as {formData.userType === 'auditor' ? 'Auditor' : 'Associate'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;