import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowRight, Zap, Users, Sparkles } from "lucide-react";

/**
 * Home page - Landing page for TRILLIONER LINK
 */
export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

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
