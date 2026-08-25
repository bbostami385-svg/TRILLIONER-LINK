import React from "react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signInWithGoogle, firebaseConfigured } from "@/lib/firebase";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { AlertCircle, Loader2, Users, Sparkles, Shield, Zap } from "lucide-react";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const exchangeFirebaseToken = trpc.auth.exchangeFirebaseToken.useMutation();

  const handleGoogleSignUp = async () => {
    if (!firebaseConfigured) {
      setError("Google Login is not configured. Add the required VITE_FIREBASE_* variables in Vercel.");
      return;
    }
    setError(null);
    try {
      const credential = await signInWithGoogle();
      const idToken = await credential.user.getIdToken();
      await exchangeFirebaseToken.mutateAsync({ idToken });
      setLocation("/verify");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Google Login could not be completed. Please try again.");
    }
  };

  const handleSignIn = () => setLocation("/login");

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
              {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

              <Button
                onClick={handleGoogleSignUp}
                disabled={exchangeFirebaseToken.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105"
              >
                {exchangeFirebaseToken.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting securely…</> : "Continue with Google"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                </div>
              </div>

              <p className="text-center text-sm text-gray-500">Your Google account is securely connected through Firebase Authentication.</p>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Button
                    variant="link"
                    onClick={handleSignIn}
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
