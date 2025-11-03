import React, { useState } from 'react';
import Logo from '../Logo';
import { supabase } from '../../utils/supabaseClient';

// Password validation function
const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const isValid = Object.values(requirements).every(req => req === true);
  return { requirements, isValid };
};

const LoginScreen = ({ onLogin, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showRequirements, setShowRequirements] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password for signup
    if (isSignUp) {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        alert('Please create a password that meets all requirements');
        return;
      }
      
      // Define your codes here - change these!
      const STUDENT_CODE = 'GRIPMEMBER2024';
      const COACH_CODE = 'GRIPCOACH2024';
      
      if (role === 'coach' && accessCode !== COACH_CODE) {
        alert('Invalid coach access code');
        return;
      }
      
      if (role === 'student' && accessCode !== STUDENT_CODE) {
        alert('Invalid member access code');
        return;
      }
      
      onLogin(email, password, { firstName, lastName, role, isSignUp: true });
    } else {
      onLogin(email, password);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      alert('Please enter your email address');
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      alert('Password reset email sent! Check your inbox.');
      setShowReset(false);
      setResetEmail('');
    } catch (error) {
      alert('Error sending reset email: ' + error.message);
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

          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-grip-primary mb-2">
                Access Code *
              </label>
              <input
                type="password"
                placeholder="Enter your access code from Grip Fitness"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary transition-colors"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {role === 'coach' ? 'Enter coach access code' : 'Enter member access code'}
              </p>
            </div>
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
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-grip-primary mb-2">
              Password {isSignUp && '*'}
            </label>
            <input
              type="password"
              placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (isSignUp) {
                  const validation = validatePassword(e.target.value);
                  setShowRequirements(true);
                  if (!validation.isValid && e.target.value.length > 0) {
                    setPasswordError('Password does not meet requirements');
                  } else {
                    setPasswordError('');
                  }
                }
              }}
              onFocus={() => isSignUp && setShowRequirements(true)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors
                ${passwordError ? 'border-red-500' : 'border-grip-secondary focus:border-grip-primary'}`}
              required
            />
            
            {/* Password Requirements Checklist */}
            {isSignUp && showRequirements && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-semibold text-gray-700 mb-2">Password must have:</p>
                <ul className="space-y-1">
                  <li className={`flex items-center ${validatePassword(password).requirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{validatePassword(password).requirements.minLength ? '✓' : '○'}</span>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center ${validatePassword(password).requirements.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{validatePassword(password).requirements.hasUpperCase ? '✓' : '○'}</span>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center ${validatePassword(password).requirements.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{validatePassword(password).requirements.hasLowerCase ? '✓' : '○'}</span>
                    One lowercase letter
                  </li>
                  <li className={`flex items-center ${validatePassword(password).requirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{validatePassword(password).requirements.hasNumber ? '✓' : '○'}</span>
                    One number
                  </li>
                  <li className={`flex items-center ${validatePassword(password).requirements.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{validatePassword(password).requirements.hasSpecial ? '✓' : '○'}</span>
                    One special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          {!isSignUp && (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="text-sm text-grip-primary hover:underline mt-1"
            >
              Forgot Password?
            </button>
          )}
          
          <button 
            type="submit"
            className="w-full bg-grip-primary text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            disabled={loading}
          >
            {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>
      </div>
      
      {/* Password Reset Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-grip-primary mb-4">Reset Password</h2>
            <p className="text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handlePasswordReset}>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary transition-colors mb-4"
                required
              />
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(false);
                    setResetEmail('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-grip-primary text-white py-3 rounded-lg font-semibold"
                >
                  Send Reset Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;