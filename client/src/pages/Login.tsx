import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { getLoginUrl } from "../const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, X, Mail, CheckCircle, ArrowRight, AlertCircle, CheckCircle2, Check } from "lucide-react";

// Toast Notification Component
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const Toast = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500/20 border-green-500/50',
    error: 'bg-red-500/20 border-red-500/50',
    info: 'bg-blue-500/20 border-blue-500/50',
  }[toast.type];

  const textColor = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  }[toast.type];

  const Icon = {
    success: Check,
    error: AlertCircle,
    info: Mail,
  }[toast.type];

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg border ${bgColor} backdrop-blur-sm flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 z-50`}>
      <Icon className={`w-5 h-5 ${textColor}`} />
      <p className={`${textColor} text-sm font-medium`}>{toast.message}</p>
      <button
        onClick={onClose}
        className="ml-2 text-gray-400 hover:text-gray-300 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Email validation function
const validateEmail = (email: string) => {
  if (!email) return { isValid: false, message: "" };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Please enter a valid email address" };
  }
  
  return { isValid: true, message: "" };
};

// Loading Spinner Component
const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <svg
      className={`${sizeClasses[size]} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

// Password strength calculator
const calculatePasswordStrength = (password: string) => {
  let strength = 0;
  let feedback = [];

  if (!password) {
    return { strength: 0, label: "", feedback: [], color: "bg-gray-400" };
  }

  // Length check
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length < 8) feedback.push("At least 8 characters");

  // Lowercase check
  if (/[a-z]/.test(password)) strength += 20;
  else feedback.push("Add lowercase letters");

  // Uppercase check
  if (/[A-Z]/.test(password)) strength += 20;
  else feedback.push("Add uppercase letters");

  // Number check
  if (/[0-9]/.test(password)) strength += 15;
  else feedback.push("Add numbers");

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;
  else feedback.push("Add special characters");

  // Determine label and color
  let label = "";
  let color = "";

  if (strength < 20) {
    label = "Very Weak";
    color = "bg-red-500";
  } else if (strength < 40) {
    label = "Weak";
    color = "bg-orange-500";
  } else if (strength < 60) {
    label = "Fair";
    color = "bg-yellow-500";
  } else if (strength < 80) {
    label = "Good";
    color = "bg-lime-500";
  } else {
    label = "Strong";
    color = "bg-green-500";
  }

  return { strength: Math.min(strength, 100), label, feedback, color };
};

// Forgot Password Modal Component
const ForgotPasswordModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [resetEmail, setResetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Replace with actual API call
      // await trpc.auth.requestPasswordReset.mutate({ email: resetEmail });
      
      setIsSuccess(true);
      setTimeout(() => {
        setResetEmail("");
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border border-purple-500/20 bg-slate-800/95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/10">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Reset Password</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            // Success State
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Check your email</h4>
                <p className="text-gray-400 text-sm">
                  We've sent a password reset link to <span className="font-medium text-purple-300">{resetEmail}</span>
                </p>
              </div>
              <p className="text-xs text-gray-500">
                The link will expire in 24 hours. If you don't see the email, check your spam folder.
              </p>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-400 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  variant="outline"
                  className="flex-1 py-2 border border-purple-500/30 rounded-lg hover:bg-slate-700/50 transition bg-slate-700/30 text-white font-medium disabled:opacity-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !resetEmail}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [, navigate] = useLocation();
  const { login } = useAuth();

  // Calculate password strength
  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);
  
  // Validate email
  const emailValidation = useMemo(() => validateEmail(email), [email]);
  
  // Validate confirm password
  const confirmPasswordValidation = useMemo(() => {
    if (!confirmPassword) return { isValid: false, message: "" };
    if (confirmPassword !== password) {
      return { isValid: false, message: "Passwords do not match" };
    }
    return { isValid: true, message: "" };
  }, [confirmPassword, password]);

  // Show toast notification
  const showToastNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({
      id: Date.now().toString(),
      message,
      type,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      
      // Save to localStorage if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      
      showToastNotification("Login successful! Redirecting...", "success");
      setTimeout(() => navigate("/feed"), 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      showToastNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // TODO: Replace with actual signup API call
      // await trpc.auth.signup.mutate({ email, password });
      
      // For now, just show success and redirect
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToastNotification("Account created successfully! Redirecting...", "success");
      setTimeout(() => navigate("/feed"), 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Signup failed";
      setError(errorMessage);
      showToastNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Redirect to OAuth provider
    window.location.href = getLoginUrl();
  };

  // Load remembered email on mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main centered container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            TRILLIONER
          </h1>
          <p className="text-lg text-gray-300">LINK</p>
          <p className="text-gray-400 mt-4">Connect, Share, and Create</p>
        </div>

        {/* Login/Signup Card with Smooth Transition */}
        <div className="relative overflow-hidden">
          <Card className="w-full p-8 shadow-2xl border border-purple-500/20 bg-slate-800/50 backdrop-blur-xl transition-all duration-300">
            {/* Login Form */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                isSignUpMode ? "opacity-0 absolute pointer-events-none" : "opacity-100 relative"
              }`}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-gray-400 text-sm">Sign in to your account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full px-4 py-3 pr-10 bg-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition ${
                        email && emailValidation.isValid
                          ? "border border-green-500/50 focus:ring-green-500"
                          : email && !emailValidation.isValid
                          ? "border border-red-500/50 focus:ring-red-500"
                          : "border border-purple-500/30 focus:ring-purple-500"
                      }`}
                    />
                    {email && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {emailValidation.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {email && !emailValidation.isValid && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {emailValidation.message}
                    </p>
                  )}
                  {email && emailValidation.isValid && (
                    <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Email looks good
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="mt-3 space-y-2">
                      {/* Strength Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-semibold ${
                          passwordStrength.strength < 20 ? 'text-red-400' :
                          passwordStrength.strength < 40 ? 'text-orange-400' :
                          passwordStrength.strength < 60 ? 'text-yellow-400' :
                          passwordStrength.strength < 80 ? 'text-lime-400' :
                          'text-green-400'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>

                      {/* Feedback */}
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-gray-400 space-y-1">
                          {passwordStrength.feedback.map((tip, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <span className="text-gray-500">•</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Success Message */}
                      {passwordStrength.strength >= 80 && (
                        <div className="text-xs text-green-400 flex items-center gap-1">
                          <span>✓</span>
                          <span>Password is strong!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remember Me & Forgot Password */}
                  <div className="mt-4 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border border-purple-500/30 bg-slate-700/50 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer accent-purple-600"
                      />
                      <span className="text-sm text-gray-300 select-none">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 mt-6 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="md" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800/50 text-gray-400">Or sign in with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="mt-8 space-y-3">
                {/* Google */}
                <Button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full py-3 border border-purple-500/30 rounded-lg hover:bg-slate-700/50 transition bg-slate-700/30 text-white font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>

                {/* Microsoft */}
                <Button
                  type="button"
                  onClick={() => handleSocialLogin('microsoft')}
                  className="w-full py-3 border border-purple-500/30 rounded-lg hover:bg-slate-700/50 transition bg-slate-700/30 text-white font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" fill="#00A4EF"/>
                  </svg>
                  Microsoft
                </Button>

                {/* GitHub */}
                <Button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  className="w-full py-3 border border-purple-500/30 rounded-lg hover:bg-slate-700/50 transition bg-slate-700/30 text-white font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/>
                  </svg>
                  GitHub
                </Button>
              </div>

              {/* Sign up link */}
              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setIsSignUpMode(true)}
                    className="text-purple-400 font-semibold hover:text-purple-300 transition inline-flex items-center gap-1"
                  >
                    Sign up <ArrowRight className="w-4 h-4" />
                  </button>
                </p>
              </div>
            </div>

            {/* Sign Up Form */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                isSignUpMode ? "opacity-100 relative" : "opacity-0 absolute pointer-events-none"
              }`}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                <p className="text-gray-400 text-sm">Join TRILLIONER LINK today</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full px-4 py-3 pr-10 bg-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition ${
                        email && emailValidation.isValid
                          ? "border border-green-500/50 focus:ring-green-500"
                          : email && !emailValidation.isValid
                          ? "border border-red-500/50 focus:ring-red-500"
                          : "border border-purple-500/30 focus:ring-purple-500"
                      }`}
                    />
                    {email && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {emailValidation.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {email && !emailValidation.isValid && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {emailValidation.message}
                    </p>
                  )}
                  {email && emailValidation.isValid && (
                    <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Email looks good
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-semibold ${
                          passwordStrength.strength < 20 ? 'text-red-400' :
                          passwordStrength.strength < 40 ? 'text-orange-400' :
                          passwordStrength.strength < 60 ? 'text-yellow-400' :
                          passwordStrength.strength < 80 ? 'text-lime-400' :
                          'text-green-400'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>

                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-gray-400 space-y-1">
                          {passwordStrength.feedback.map((tip, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <span className="text-gray-500">•</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {passwordStrength.strength >= 80 && (
                        <div className="text-xs text-green-400 flex items-center gap-1">
                          <span>✓</span>
                          <span>Password is strong!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full px-4 py-3 pr-10 bg-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition ${
                        confirmPassword && confirmPasswordValidation.isValid
                          ? "border border-green-500/50 focus:ring-green-500"
                          : confirmPassword && !confirmPasswordValidation.isValid
                          ? "border border-red-500/50 focus:ring-red-500"
                          : "border border-purple-500/30 focus:ring-purple-500"
                      }`}
                    />
                    {confirmPassword && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {confirmPasswordValidation.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition focus:outline-none"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && !confirmPasswordValidation.isValid && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {confirmPasswordValidation.message}
                    </p>
                  )}
                  {confirmPassword && confirmPasswordValidation.isValid && (
                    <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Passwords match
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="w-4 h-4 rounded border border-purple-500/30 bg-slate-700/50 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer accent-purple-600"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
                    I agree to the{" "}
                    <a href="#" className="text-purple-400 hover:text-purple-300">
                      Terms of Service
                    </a>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 mt-6 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="md" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800/50 text-gray-400">Or sign up with</span>
                </div>
              </div>

              {/* Social Signup Buttons */}
              <div className="mt-8 space-y-3">
                <Button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full py-3 border border-purple-500/30 rounded-lg hover:bg-slate-700/50 transition bg-slate-700/30 text-white font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSocialLogin('microsoft')}
                  className="w-full py-3 border border-purple-500/30 rounded-lg hover:bg-slate-700/50 transition bg-slate-700/30 text-white font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" fill="#00A4EF"/>
                  </svg>
                  Microsoft
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  className="w-full py-3 border border-purple-500/30 rounded-lg hover:bg-slate-700/50 transition bg-slate-700/30 text-white font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/>
                  </svg>
                  GitHub
                </Button>
              </div>

              {/* Back to login link */}
              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsSignUpMode(false)}
                    className="text-purple-400 font-semibold hover:text-purple-300 transition"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          toast={toast}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
