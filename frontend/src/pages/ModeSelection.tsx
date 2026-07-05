import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Play, Users, Zap, Share2 } from "lucide-react";

export default function ModeSelection() {
  const [, navigate] = useLocation();
  const setModeMutation = trpc.accountMode.setMode.useMutation();

  const handleModeSelect = (mode: "youtube" | "social") => {
    setModeMutation.mutate(
      { mode },
      {
        onSuccess: () => {
          navigate("/");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Choose Your Mode
          </h1>
          <p className="text-xl text-gray-600">
            Select how you want to use TRILLIONER LINK
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* YouTube Mode */}
          <Card className="p-8 shadow-2xl border-0 bg-white/95 backdrop-blur hover:shadow-3xl transition transform hover:scale-105 cursor-pointer">
            <div className="text-center">
              <div className="inline-block p-4 bg-red-100 rounded-full mb-6">
                <Play className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">YouTube Mode</h2>
              <p className="text-gray-600 mb-6">
                Create channels, upload videos, and gain subscribers
              </p>

              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <span className="text-gray-700">Video uploads & streaming</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700">Subscribers system</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Channel analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-gray-700">Monetization options</span>
                </div>
              </div>

              <Button
                onClick={() => handleModeSelect("youtube")}
                disabled={setModeMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
              >
                {setModeMutation.isPending ? "Selecting..." : "Choose YouTube Mode"}
              </Button>
            </div>
          </Card>

          {/* Social Mode */}
          <Card className="p-8 shadow-2xl border-0 bg-white/95 backdrop-blur hover:shadow-3xl transition transform hover:scale-105 cursor-pointer">
            <div className="text-center">
              <div className="inline-block p-4 bg-blue-100 rounded-full mb-6">
                <Share2 className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Social Mode</h2>
              <p className="text-gray-600 mb-6">
                Share posts, stories, and connect with friends and followers
              </p>

              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center space-x-3">
                  <Share2 className="w-5 h-5 text-pink-500 flex-shrink-0" />
                  <span className="text-gray-700">Posts, stories & reels</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-gray-700">Followers & friends</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Direct messaging</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-gray-700">Live streaming</span>
                </div>
              </div>

              <Button
                onClick={() => handleModeSelect("social")}
                disabled={setModeMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                {setModeMutation.isPending ? "Selecting..." : "Choose Social Mode"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            You can change your mode anytime in settings
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="px-6 py-2"
          >
            Skip for now
          </Button>
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
      `}</style>
    </div>
  );
}
