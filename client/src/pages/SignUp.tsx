import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";

export default function SignUp() {

  const handleSignUp = () => {
    window.location.href = getLoginUrl();
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Join TRILLIONER LINK</CardTitle>
          <CardDescription>
            Create an account to connect, share, and create with the world
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button
              onClick={handleSignUp}
              size="lg"
              className="w-full"
              variant="default"
            >
              Sign Up with Manus
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={handleSignUp}
              >
                Sign In
              </Button>
            </p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              By signing up, you agree to our{" "}
              <Button variant="link" className="p-0 h-auto underline">
                Terms of Service
              </Button>
              {" "}and{" "}
              <Button variant="link" className="p-0 h-auto underline">
                Privacy Policy
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
