import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Link2, Unlink2, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Provider = "google" | "youtube" | "facebook" | "instagram" | "tiktok";

interface LinkedAccount {
  id: number;
  provider: Provider;
  providerUsername: string | null;
  isVerified: boolean;
  createdAt: Date;
}

export function SocialLinking() {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<Provider | null>(null);

  const getLinkedAccountsQuery = trpc.socialLinking.getLinkedAccounts.useQuery();
  const generateOAuthURLMutation = trpc.socialLinking.generateOAuthURL.useMutation();
  const unlinkAccountMutation = trpc.socialLinking.unlinkAccount.useMutation();
  const syncDataMutation = trpc.socialLinking.syncLinkedAccountData.useMutation();

  // Load linked accounts
  const loadLinkedAccounts = async () => {
    try {
      const result = await getLinkedAccountsQuery.refetch();
      if (result.data) {
        setLinkedAccounts(result.data.accounts);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    void loadLinkedAccounts();
  }, []);

  // Handle OAuth linking
  const handleLinkAccount = async (provider: Provider) => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateOAuthURLMutation.mutateAsync({ provider, origin: window.location.origin });
      // Redirect to OAuth URL
      window.location.href = result.authUrl;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Handle account unlinking
  const handleUnlinkAccount = async (provider: Provider) => {
    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await unlinkAccountMutation.mutateAsync({ provider });
      setLinkedAccounts(linkedAccounts.filter((acc) => acc.provider !== provider));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle data sync
  const handleSyncData = async (provider: Provider) => {
    setSyncing(provider);
    setError(null);

    try {
      await syncDataMutation.mutateAsync({ provider });
      // Reload accounts after sync
      await loadLinkedAccounts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(null);
    }
  };

  const isLinked = (provider: Provider) => {
    return linkedAccounts.some((acc) => acc.provider === provider);
  };

  const getProviderIcon = (provider: Provider) => {
    const icons: Record<Provider, string> = {
      google: "🔍",
      youtube: "📺",
      facebook: "f",
      instagram: "📷",
      tiktok: "🎵",
    };
    return icons[provider];
  };

  const getProviderColor = (provider: Provider) => {
    const colors: Record<Provider, string> = {
      google: "bg-red-50 border-red-200",
      youtube: "bg-red-50 border-red-200",
      facebook: "bg-blue-50 border-blue-200",
      instagram: "bg-pink-50 border-pink-200",
      tiktok: "bg-black/5 border-gray-200",
    };
    return colors[provider];
  };

  const providers: Provider[] = ["google", "youtube", "facebook", "instagram", "tiktok"];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Social Account Linking
          </CardTitle>
          <CardDescription>
            Link your social media accounts to sync data and access cross-platform features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Linked Accounts List */}
          {linkedAccounts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Linked Accounts</h3>
              {linkedAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`border rounded-lg p-4 ${getProviderColor(account.provider)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getProviderIcon(account.provider)}</span>
                      <div>
                        <p className="font-medium capitalize">{account.provider}</p>
                        <p className="text-sm text-gray-600">{account.providerUsername || "Linked account"}</p>
                        {account.isVerified && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncData(account.provider)}
                        disabled={syncing === account.provider}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            syncing === account.provider ? "animate-spin" : ""
                          }`}
                        />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUnlinkAccount(account.provider)}
                        disabled={loading}
                      >
                        <Unlink2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Available Providers */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">
              {linkedAccounts.length > 0 ? "Link More Accounts" : "Link Your Accounts"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {providers.map((provider) => (
                <Button
                  key={provider}
                  onClick={() => handleLinkAccount(provider)}
                  disabled={loading || isLinked(provider)}
                  variant={isLinked(provider) ? "outline" : "default"}
                  className="w-full"
                >
                  <span className="mr-2">{getProviderIcon(provider)}</span>
                  {isLinked(provider) ? "Linked" : `Link ${provider}`}
                </Button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Desktop OAuth linking:</strong> You will be sent to the provider’s official consent screen and returned to this app. If a provider is not configured yet, the app will show a setup message instead of creating a fake connection.
              <br /><br />
              <strong>Benefits:</strong>
              <br />
              • Sync followers and subscribers across platforms
              <br />
              • Cross-post content to multiple platforms
              <br />
              • Unified analytics dashboard
              <br />
              • Easier account recovery
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status Card */}
      {linkedAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {linkedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize">{account.provider}</span>
                  <span className="text-gray-600">
                    {account.createdAt
                      ? new Date(account.createdAt).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
