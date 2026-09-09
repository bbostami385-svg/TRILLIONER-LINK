import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Users, Sparkles, Shield, Zap } from "lucide-react";

export default function SignUp() {
  const handleSignUp = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left side - Benefits */}
          <div className="hidden md:flex flex-col justify-center space-y-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Join TRILLIONER LINK
              </h1>
              <p className="text-xl text-gray-600">
                Be part of a global community of creators and innovators
              </p>
            </div>

            {/* Benefits cards */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition transform hover:scale-105">
                <Users className="w-8 h-8 text-purple-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Connect Globally</h3>
                  <p className="text-sm text-gray-600">Meet millions of creators worldwide</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition transform hover:scale-105">
                <Sparkles className="w-8 h-8 text-pink-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Express Yourself</h3>
                  <p className="text-sm text-gray-600">Share your unique content and ideas</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition transform hover:scale-105">
                <Shield className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Stay Safe</h3>
                  <p className="text-sm text-gray-600">Your privacy and security matter</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition transform hover:scale-105">
                <Zap className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Earn Money</h3>
                  <p className="text-sm text-gray-600">Monetize your content and grow</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Signup Form */}
          <Card className="w-full max-w-md mx-auto p-8 shadow-2xl border-0 bg-white/95 backdrop-blur">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600">Join millions of creators today</p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleSignUp}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105"
              >
                Sign Up with TRILLIONER LINK
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3.7 12c0 2.05-1.65 3.7-3.7 3.7s-3.7-1.65-3.7-3.7 1.65-3.7 3.7-3.7 3.7 1.65 3.7 3.7z" />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Button
                    variant="link"
                    onClick={handleSignUp}
                    className="p-0 h-auto text-purple-600 font-semibold hover:text-purple-700 transition"
                  >
                    Sign in
                  </Button>
                </p>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500">
                <p>
                  By signing up, you agree to our{" "}
                  <a href="#" className="text-purple-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-purple-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

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
      `}</style>
    </div>
  );
}
