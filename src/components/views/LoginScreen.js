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
  const [resendEmail, setResendEmail] = useState('');
  const [showResend, setShowResend] = useState(false);

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

  const handleResendVerification = async () => {
    if (!resendEmail) {
      alert('Please enter your email address');
      return;
    }
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
      });
      
      if (error) throw error;
      
      alert('Verification email sent! Please check your inbox.');
      setShowResend(false);
      setResendEmail('');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-[12px] shadow-gym p-4 w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="large" />
        </div>
        
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 rounded-grip font-medium transition-all ${
              !isSignUp ? 'bg-gym-primary text-white' : 'bg-gray-200 text-gym-text-dark'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 rounded-grip font-medium transition-all ${
              isSignUp ? 'bg-grip-primary text-white' : 'bg-grip-secondary text-gray-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gym-text-dark mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-grip bg-white focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gym-text-dark mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-grip bg-white focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-grip-dark mb-2">
                  I am a...
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 py-2 rounded-grip font-semibold transition-all ${
                      role === 'student' ? 'bg-gym-primary text-white' : 'bg-gray-200 text-gym-text-dark'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('coach')}
                    className={`flex-1 py-2 rounded-grip font-semibold transition-all ${
                      role === 'coach' ? 'bg-gym-primary text-white' : 'bg-gray-200 text-gym-text-dark'
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
              <label className="block text-sm font-semibold text-grip-dark mb-2">
                Access Code *
              </label>
              <input
                type="password"
                placeholder="Enter your access code from MJG Fitness"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-grip focus:outline-none focus:ring-2 focus:ring-grip-primary focus:border-transparent transition-colors"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                {role === 'coach' ? 'Enter coach access code' : 'Enter member access code'}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-grip focus:outline-none focus:ring-2 focus:ring-grip-primary focus:border-transparent transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-grip-dark mb-2">
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
              className={`w-full px-4 py-3 border rounded-grip focus:outline-none transition-colors
                ${passwordError ? 'border-gym-error' : 'border-gray-200 focus:ring-2 focus:ring-gym-primary focus:border-transparent'}`}
              required
            />
            
            {/* Password Requirements Checklist */}
            {isSignUp && showRequirements && (
              <div className="mt-2 p-3 bg-gray-50 rounded-grip text-sm">
                <p className="font-semibold text-gym-text-dark mb-2">Password must have:</p>
                <ul className="space-y-1">
                  <li className={`flex items-center ${validatePassword(password).requirements.minLength ? 'text-green-600' : 'text-gray-600'}`}>
                    <span className="mr-2">{validatePassword(password).requirements.minLength ? '✓' : '○'}</span>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center ${validatePassword(password).requirements.hasUpperCase ? 'text-green-600' : 'text-gray-600'}`}>
                    <span className="mr-2">{validatePassword(password).requirements.hasUpperCase ? '✓' : '○'}</span>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center ${validatePassword(password).requirements.hasLowerCase ? 'text-green-600' : 'text-gray-600'}`}>
                    <span className="mr-2">{validatePassword(password).requirements.hasLowerCase ? '✓' : '○'}</span>
                    One lowercase letter
                  </li>
                  <li className={`flex items-center ${validatePassword(password).requirements.hasNumber ? 'text-green-600' : 'text-gray-600'}`}>
                    <span className="mr-2">{validatePassword(password).requirements.hasNumber ? '✓' : '○'}</span>
                    One number
                  </li>
                  <li className={`flex items-center ${validatePassword(password).requirements.hasSpecial ? 'text-green-600' : 'text-gray-600'}`}>
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
              className="text-sm text-gym-accent hover:underline mt-1"
            >
              Forgot Password?
            </button>
          )}
          
          <button 
            type="submit"
            className="w-full bg-gym-primary text-white py-3 rounded-grip font-semibold hover:bg-[#ff8555] transition-all duration-200 min-h-[48px]"
            disabled={loading}
          >
            {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
          
          {!isSignUp && (
            <>
              <button
                type="button"
                onClick={() => setShowResend(true)}
                className="mt-3 text-sm text-gym-accent hover:underline"
              >
                Didn't receive verification email?
              </button>
            </>
          )}
        </form>
      </div>
      
      {/* Password Reset Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-gym-text-dark mb-4">Reset Password</h2>
            <p className="text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handlePasswordReset}>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-grip focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent transition-colors mb-4"
                required
              />
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(false);
                    setResetEmail('');
                  }}
                  className="flex-1 border-2 border-gym-accent text-gym-accent bg-transparent py-3 rounded-grip font-semibold hover:bg-gym-accent hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gym-primary text-white py-3 rounded-grip font-semibold hover:bg-[#ff8555]"
                >
                  Send Reset Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resend Verification Modal */}
      {showResend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gym-text-dark mb-4">Resend Verification Email</h3>
            <input
              type="email"
              placeholder="Enter your email address"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-grip focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowResend(false)}
                className="flex-1 bg-grip-secondary text-grip-primary py-3 rounded-grip font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResendVerification}
                className="flex-1 bg-grip-primary text-white py-3 rounded-grip font-semibold"
              >
                Resend Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;