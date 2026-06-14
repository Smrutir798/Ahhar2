import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-center">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100 flex flex-col items-center">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h1 className="text-6xl font-extrabold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
