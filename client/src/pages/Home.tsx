import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowRight, Play, TrendingUp, Zap, Users, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getAllVideoWatchProgress } from "@/lib/videoProgress";

/**
 * Home page - Landing page for TRILLIONER LINK
 */
export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const trendingQuery = trpc.videos.getTrending.useQuery({ limit: 6 }, { staleTime: 30_000, refetchOnWindowFocus: false, retry: false });
  const [watchProgress, setWatchProgress] = useState<Record<string, number>>(() => getAllVideoWatchProgress());
  useEffect(() => { const sync = () => setWatchProgress(getAllVideoWatchProgress()); window.addEventListener("trillioner-video-progress", sync); return () => window.removeEventListener("trillioner-video-progress", sync); }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleSignUp = () => {
    setLocation("/signup");
  };

  const handleLogin = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="border-b border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">TRILLIONER LINK</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleLogin}>
                  Login
                </Button>
                <Button size="sm" onClick={handleSignUp}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Welcome to TRILLIONER LINK
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Connect, share, and create with the world. A comprehensive social media platform
          built for creators, communities, and businesses.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isAuthenticated && (
            <>
              <Button size="lg" onClick={handleSignUp} className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleLogin}>
                Sign In
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><TrendingUp className="h-4 w-4" /> Discover now</p><h2 className="mt-2 text-3xl font-bold">Trending on TRILLIONER LINK</h2><p className="mt-2 text-muted-foreground">Popular public Creator videos, ranked by real view activity.</p></div><Button variant="outline" onClick={() => setLocation("/videos")}>View all <ArrowRight className="ml-2 h-4 w-4" /></Button></div>{trendingQuery.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <Card key={item} className="overflow-hidden"><div className="aspect-video animate-pulse bg-muted" /><CardContent className="space-y-2 p-4"><div className="h-4 w-4/5 animate-pulse rounded bg-muted" /><div className="h-3 w-2/5 animate-pulse rounded bg-muted" /></CardContent></Card>)}</div> : trendingQuery.data?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{trendingQuery.data.map((video) => <Card key={video.id} className="group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"><button className="block w-full text-left" onClick={() => setLocation(`/videos?video=${video.id}`)}><div className="relative aspect-video bg-muted">{video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Play className="h-10 w-10 text-primary" /></div>}<span className="absolute bottom-3 left-3 rounded-full bg-background/85 px-2 py-1 text-xs font-semibold backdrop-blur">{video.views.toLocaleString()} views</span></div><CardContent className="p-4"><h3 className="line-clamp-2 font-semibold group-hover:text-primary">{video.title}</h3><p className="mt-2 text-sm text-muted-foreground">Creator video · Watch the full story</p>{(watchProgress[`long:${video.id}`] ?? 0) > 0 && <div className="mt-3" aria-label={`${Math.round((watchProgress[`long:${video.id}`] ?? 0) * 100)} percent watched`}><div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>Watched</span><span>{Math.round((watchProgress[`long:${video.id}`] ?? 0) * 100)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round((watchProgress[`long:${video.id}`] ?? 0) * 100)}%` }} /></div></div>}</CardContent></button></Card>)}</div> : <Card className="p-8 text-center text-muted-foreground">Trending videos will appear here as creators publish.</Card>}</section>

      {/* Features Section */}
      <section className="container max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Build meaningful connections with friends, followers, and communities worldwide.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Share</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Share your moments, thoughts, and creations with your audience instantly.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Create</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monetize your content and build your creator business with our marketplace.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="container max-w-4xl mx-auto px-4 py-20 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to join?</CardTitle>
              <CardDescription>
                Sign up now and start connecting with millions of creators and users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={handleSignUp}>
                Create Account
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-muted bg-muted/30 mt-20">
        <div className="container max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 TRILLIONER LINK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
