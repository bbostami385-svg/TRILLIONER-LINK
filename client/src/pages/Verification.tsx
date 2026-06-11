import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function Verification() {
  const { user } = useAuth();
  const [selectedBadgeType, setSelectedBadgeType] = useState<"verified" | "creator" | "business" | "media">("verified");

  const { data: userVerification } = trpc.verification.getUserVerification.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );

  const requestVerificationMutation = trpc.verification.requestVerification.useMutation();

  const handleRequestVerification = async () => {
    try {
      await requestVerificationMutation.mutateAsync({ badgeType: selectedBadgeType });
    } catch (error) {
      console.error("Failed to request verification:", error);
    }
  };

  const badgeDescriptions = {
    verified: "For notable public figures, celebrities, and brands",
    creator: "For content creators with significant following",
    business: "For businesses and organizations",
    media: "For media outlets and news organizations",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Verification Badges</h1>
          <p className="text-purple-200">Get verified to increase credibility and trust</p>
        </div>

        {/* Current Verification Status */}
        {user && (
          <Card className="mb-8 p-6 bg-slate-800 border-purple-500">
            <h2 className="text-2xl font-bold text-white mb-4">Your Verification Status</h2>
            {userVerification ? (
              <div className="space-y-3">
                <p className="text-purple-200">
                  Badge Type: <span className="text-pink-400 font-bold">{userVerification.badgeType}</span>
                </p>
                {userVerification.verifiedAt ? (
                  <div>
                    <p className="text-green-400">✓ Verified on {new Date(userVerification.verifiedAt).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <p className="text-yellow-400">⏳ Verification pending approval</p>
                )}
              </div>
            ) : (
              <p className="text-purple-200">You don't have a verification badge yet</p>
            )}
          </Card>
        )}

        {/* Badge Types */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Available Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["verified", "creator", "business", "media"] as const).map((badgeType) => (
              <Card
                key={badgeType}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedBadgeType === badgeType
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 border-pink-400"
                    : "bg-slate-800 border-purple-500 hover:border-pink-500"
                }`}
                onClick={() => setSelectedBadgeType(badgeType)}
              >
                <h3 className="text-lg font-bold text-white mb-2 capitalize">{badgeType} Badge</h3>
                <p className="text-purple-200 text-sm">{badgeDescriptions[badgeType]}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Request Verification */}
        {user && !userVerification && (
          <Card className="p-6 bg-slate-800 border-purple-500">
            <h2 className="text-2xl font-bold text-white mb-4">Request Verification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Select Badge Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["verified", "creator", "business", "media"] as const).map((badgeType) => (
                    <Button
                      key={badgeType}
                      onClick={() => setSelectedBadgeType(badgeType)}
                      className={`${
                        selectedBadgeType === badgeType
                          ? "bg-gradient-to-r from-purple-600 to-pink-600"
                          : "bg-slate-700 hover:bg-slate-600"
                      }`}
                    >
                      {badgeType}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-700 p-4 rounded">
                <p className="text-purple-200 text-sm">
                  <strong>Selected:</strong> {selectedBadgeType} - {badgeDescriptions[selectedBadgeType]}
                </p>
              </div>
              <Button
                onClick={handleRequestVerification}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={requestVerificationMutation.isPending}
              >
                {requestVerificationMutation.isPending ? "Requesting..." : "Request Verification"}
              </Button>
              <p className="text-xs text-purple-300">
                Your request will be reviewed by our team. This may take a few days.
              </p>
            </div>
          </Card>
        )}

        {/* Verification Requirements */}
        <Card className="mt-8 p-6 bg-slate-800 border-purple-500">
          <h2 className="text-2xl font-bold text-white mb-4">Verification Requirements</h2>
          <div className="space-y-3 text-purple-200">
            <div>
              <h3 className="font-bold text-white mb-1">For All Badges:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Active and authentic account</li>
                <li>Complete profile information</li>
                <li>No recent violations of community guidelines</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">For Creator Badge:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Minimum 10,000 followers</li>
                <li>Regular content creation</li>
                <li>Authentic engagement with audience</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">For Business Badge:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Registered business entity</li>
                <li>Business contact information</li>
                <li>Official business account</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
