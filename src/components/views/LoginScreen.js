import React, { useState } from 'react';
import Logo from '../Logo';

const LoginScreen = ({ onLogin, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('student');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      onLogin(email, password, { firstName, lastName, role, isSignUp: true });
    } else {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-grip-primary to-grip-accent flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="large" />
        </div>
        
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              !isSignUp ? 'bg-grip-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              isSignUp ? 'bg-grip-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-grip-primary mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary transition-colors"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-grip-primary mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-grip-primary mb-2">
                  I am a...
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      role === 'student' ? 'bg-grip-secondary text-grip-primary' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('coach')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      role === 'coach' ? 'bg-grip-secondary text-grip-primary' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Coach
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-grip-primary mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-grip-primary mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary transition-colors"
              placeholder={isSignUp ? "Create a password" : "Enter your password"}
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-grip-primary text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            disabled={loading}
          >
            {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;