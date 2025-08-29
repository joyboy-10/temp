import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const MetricsCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    error: 'from-error-500 to-error-600'
  };

  const bgColorClasses = {
    primary: 'from-primary-50 to-primary-100',
    secondary: 'from-secondary-50 to-secondary-100',
    success: 'from-success-50 to-success-100',
    warning: 'from-warning-50 to-warning-100',
    error: 'from-error-50 to-error-100'
  };

  return (
    <div className="card group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-error-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${trend > 0 ? 'text-success-600' : 'text-error-600'}`}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${bgColorClasses[color]} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          {Icon ? (
            <Icon className={`w-6 h-6 bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`} />
          ) : (
            <DollarSign className={`w-6 h-6 bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;