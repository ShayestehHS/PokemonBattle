"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PokeballIllustration } from "@/components/pokemon/pokeball-illustration";
import { StarterSelectionIllustration } from "@/components/pokemon/starter-selection-illustration";
import { tokenStorage, ApiError, api } from "@/lib/api";
import { mockSetCurrentPlayer, initializeMockData } from "@/lib/mocks";
import { showErrorToast } from "@/lib/toast";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isLogin = mode === "login";

  // Initialize mock data and check existing auth
  useEffect(() => {
    initializeMockData();

    const checkAuth = async () => {
      const token = tokenStorage.getAccessToken();
      if (token) {
        // User already logged in, check if they have pokemon in their collection
        try {
          const myPokemon = await api.listMyPokemon();
          if (myPokemon && myPokemon.length > 0) {
            router.replace("/dashboard");
          } else {
            router.replace("/starter");
          }
        } catch (err) {
          // If API call fails, default to starter selection
          router.replace("/starter");
        }
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const resetForm = () => {
    setFormData({ username: "", password: "", confirmPassword: "" });
    setError(null);
  };

  const toggleMode = () => {
    setMode(isLogin ? "register" : "login");
    resetForm();
  };

  const formatError = (err: ApiError): string => {
    // FormError format: { field_name: "...", message: "..." }
    if (err.field_name && err.message) {
      return err.message;
    }
    // DRF ValidationError format
    if (err.detail) return err.detail;
    if (err.username) return `Username: ${err.username.join(", ")}`;
    if (err.password) return `Password: ${err.password.join(", ")}`;
    if (err.non_field_errors) return err.non_field_errors.join(", ");
    return "An unexpected error occurred. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation for register mode
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = isLogin
        ? await api.login(formData.username, formData.password)
        : await api.register(formData.username, formData.password);

      // Store tokens
      tokenStorage.setTokens(response.token.access, response.token.refresh);

      // Store current player ID for mock API
      await mockSetCurrentPlayer(response.id);

      if (isLogin) {
        // Login: check if user has pokemon in their collection
        try {
          const myPokemon = await api.listMyPokemon();
          if (myPokemon && myPokemon.length > 0) {
            router.push("/dashboard");
          } else {
            router.push("/starter");
          }
        } catch (err) {
          // If API call fails, default to starter selection
          router.push("/starter");
        }
      } else {
        // Registration: always go to starter selection
        router.push("/starter");
      }

    } catch (err) {
      const apiError = err as ApiError;

      // Determine error type: FormError has field_name, ToastError has message but no field_name
      if (apiError.field_name) {
        // FormError: show inline error only
        const formattedError = formatError(apiError);
        setError(formattedError);
      } else {
        // ToastError: show toast only
        showErrorToast(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen landing-bg flex items-center justify-center">
        <div className="animate-pokeball-spin">
          <svg viewBox="0 0 40 40" className="w-16 h-16">
            <circle cx="20" cy="20" r="18" fill="#EE1515" />
            <path d="M 20 38 A 18 18 0 0 1 2 20 L 38 20 A 18 18 0 0 1 20 38" fill="white" />
            <rect x="2" y="18" width="36" height="4" fill="#2D2D2D" />
            <circle cx="20" cy="20" r="6" fill="#2D2D2D" />
            <circle cx="20" cy="20" r="4" fill="white" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#E8F4FD] via-[#F0FFF4] to-[#FFF8E7] -z-10" />

      {/* Decorative background shapes */}
      <div className="fixed inset-0 overflow-hidden -z-5">
        <div
          className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl transition-all duration-700 ${
            isLogin
              ? "bg-[var(--color-pokemon-mint)]/30"
              : "bg-[var(--color-pokemon-yellow)]/25"
          }`}
        />
        <div
          className={`absolute top-1/4 -right-20 w-80 h-80 rounded-full blur-3xl transition-all duration-700 ${
            isLogin
              ? "bg-[var(--color-pokemon-light-blue)]/25"
              : "bg-[var(--color-pokeball-red)]/20"
          }`}
        />
        <div
          className={`absolute -bottom-32 left-1/3 w-96 h-96 rounded-full blur-3xl transition-all duration-700 ${
            isLogin
              ? "bg-[var(--color-pokemon-yellow)]/20"
              : "bg-[var(--color-pokemon-mint)]/25"
          }`}
        />
      </div>

      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 items-center justify-center p-8 relative">
        <div className="w-full max-w-2xl h-[600px] relative">
          {/* Login Illustration */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              isLogin
                ? "opacity-100 scale-100 translate-x-0"
                : "opacity-0 scale-95 -translate-x-8 pointer-events-none"
            }`}
          >
            <PokeballIllustration />
          </div>

          {/* Register Illustration */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              !isLogin
                ? "opacity-100 scale-100 translate-x-0"
                : "opacity-0 scale-95 translate-x-8 pointer-events-none"
            }`}
          >
            <StarterSelectionIllustration />
          </div>
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-center">
          <p className={`text-muted-foreground/70 text-sm font-medium tracking-wide transition-all duration-300 ${
            isLogin ? "opacity-100" : "opacity-0"
          }`}>
            {isLogin ? "Catch 'em all. Battle 'em all." : ""}
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 md:p-12">
        <div
          className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-500"
          key={mode}
        >
          {/* Logo and title */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-4">
              {/* Mini Pokeball icon with animation */}
              <div className={`transition-transform duration-500 ${isLogin ? "rotate-0" : "rotate-180"}`}>
                <svg viewBox="0 0 40 40" className="w-10 h-10">
                  <circle cx="20" cy="20" r="18" fill="#EE1515" />
                  <path d="M 20 38 A 18 18 0 0 1 2 20 L 38 20 A 18 18 0 0 1 20 38" fill="white" />
                  <rect x="2" y="18" width="36" height="4" fill="#2D2D2D" />
                  <circle cx="20" cy="20" r="6" fill="#2D2D2D" />
                  <circle cx="20" cy="20" r="4" fill="white" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokemon-blue)] bg-clip-text text-transparent">
                Pokémon Battle Arena
              </h1>
            </div>
            <p className="text-muted-foreground transition-all duration-300">
              {isLogin
                ? "Welcome back, Trainer! Ready to battle?"
                : "Begin your journey as a Pokémon Trainer!"}
            </p>
          </div>

          {/* Auth Card */}
          <Card className="border-0 shadow-xl shadow-black/5 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-semibold text-center">
                {isLogin ? "Trainer Login" : "Trainer Registration"}
              </CardTitle>
              <CardDescription className="text-center">
                {isLogin
                  ? "Enter your credentials to access the arena"
                  : "Create your account to start battling"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Error message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={isLogin ? "Red" : "Choose your trainer name"}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="h-11 bg-white/50 border-gray-200 focus:border-[var(--color-pokeball-red)] focus:ring-[var(--color-pokeball-red)]/20 transition-all"
                    required
                    minLength={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-11 bg-white/50 border-gray-200 focus:border-[var(--color-pokeball-red)] focus:ring-[var(--color-pokeball-red)]/20 transition-all pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password - only show in register mode */}
                <div
                  className={`space-y-2 transition-all duration-300 overflow-hidden ${
                    !isLogin
                      ? "max-h-32 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-11 bg-white/50 border-gray-200 focus:border-[var(--color-pokeball-red)] focus:ring-[var(--color-pokeball-red)]/20 transition-all pr-10"
                      required={!isLogin}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokeball-dark-red)] hover:from-[var(--color-pokeball-dark-red)] hover:to-[var(--color-pokeball-red)] text-white font-semibold shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-red-500/40 hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{isLogin ? "Entering Arena..." : "Creating Account..."}</span>
                    </div>
                  ) : (
                    isLogin ? "Enter the Arena" : "Begin Your Journey"
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground pt-2">
                {isLogin ? "New Trainer?" : "Already a Trainer?"}{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-semibold text-[var(--color-pokemon-blue)] hover:text-[var(--color-pokemon-blue)]/80 transition-colors underline-offset-4 hover:underline"
                >
                  {isLogin ? "Register here" : "Login here"}
                </button>
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/60">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-muted-foreground">Terms</a>
            {" "}and{" "}
            <a href="#" className="underline hover:text-muted-foreground">Privacy Policy</a>
          </p>
        </div>
        </div>
      </main>
  );
}
