'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/app-logo';
import { useAuthStore } from '@/store';
import { containsMaliciousInput } from '@/lib/security';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/app-branding';

const safeCredential = (message: string) =>
  z
    .string()
    .max(256, message)
    .refine((value) => !containsMaliciousInput(value), { message });

const loginSchema = z.object({
  email: safeCredential('Invalid email address')
    .max(254, 'Invalid email address')
    .pipe(z.string().email('Invalid email address')),
  password: safeCredential('Password must be at least 6 characters').min(
    6,
    'Password must be at least 6 characters'
  ),
});

type LoginForm = z.infer<typeof loginSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-950/70 px-3 py-2 text-sm font-semibold text-red-100 shadow-[0_0_24px_-4px_rgba(239,68,68,0.55)]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'session_revoked') {
      setError('You were signed out because this account was used on another device.');
    }
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);

      await new Promise<void>(async (resolve, reject) => {
        try {
          await login(data.email, data.password);

          setTimeout(() => {
            const { isAuthenticated } = useAuthStore.getState();
            if (isAuthenticated) {
              router.push('/dashboard');
              resolve();
            } else {
              setError('Login failed - please try again');
              reject(new Error('Authentication failed'));
            }
          }, 100);
        } catch (error) {
          reject(error);
        }
      });
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const inputBase =
    'h-11 border-slate-500/60 bg-black/55 text-white placeholder:text-slate-400 shadow-inner transition-all duration-300 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-0';
  const inputError =
    'border-red-500/80 bg-red-950/40 text-white focus-visible:border-red-400 focus-visible:ring-red-500/45';

  return (
    <div className="login-page-root fixed inset-0 flex w-full items-center justify-center px-3 sm:px-4">
      {/* Static SVG background */}
      <div className="login-page-bg pointer-events-none fixed inset-0" aria-hidden />

      {/* Darker overlay */}
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-br from-black/[0.50] via-black/50 to-black/[0.50]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-black/65"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center justify-center gap-3 sm:gap-4">
        {/* Logo + branding */}
        <div className="flex shrink-0 flex-col items-center text-center">
          <AppLogo
            width={112}
            height={112}
            className="h-24 w-24 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] sm:h-28 sm:w-28"
            priority
          />
          <h1 className="inline-flex items-center gap-4 rounded-full border border-blue-400/25 bg-black/40 px-3 py-1 text-[15px] font-bold uppercase tracking-[0.18em] text-blue-100 sm:text-[20px]">
          <Sparkles className="h-5 w-5 text-blue-400" aria-hidden />
            {APP_NAME}
            <Sparkles className="h-5 w-5 text-blue-400" aria-hidden />
          </h1>
          <p className="mt-1 hidden max-w-xl text-xs leading-snug text-slate-300 sm:block sm:text-xs">
            {APP_DESCRIPTION}
          </p>
        </div>

        {/* Fixed glass card — animation only inside via CSS pseudo-elements */}
        <div
          className={`login-glass-card w-full shrink-0 rounded-2xl px-5 py-5 sm:px-7 sm:py-6 ${error ? 'login-error-shake' : ''}`}
        >
          <div className="relative z-[1] space-y-4 sm:space-y-5">
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Sign In</h2>
              <p className="text-xs text-slate-200 sm:text-sm">
                Enter your credentials
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-white">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@angadiya.com"
                    className={`pl-10 ${inputBase} ${errors.email ? inputError : ''}`}
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                </div>
                <FieldError message={errors.email?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-white">
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
                    aria-hidden
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`pl-10 pr-11 ${inputBase} ${errors.password ? inputError : ''}`}
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" aria-hidden />
                    ) : (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
                <FieldError message={errors.password?.message} />
              </div>

              {error && (
                <div
                  role="alert"
                  className="login-error-shake flex items-start gap-2.5 rounded-xl border border-red-500/60 bg-red-950/85 px-3 py-3 shadow-[0_0_32px_-6px_rgba(239,68,68,0.6)]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/25">
                    <AlertCircle className="h-4 w-4 text-red-300" aria-hidden />
                  </span>
                  <p className="text-sm font-semibold leading-snug text-red-50">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="group relative h-11 w-full overflow-hidden rounded-xl border border-blue-400/35 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(37,99,235,0.65)] transition-all duration-300 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600 disabled:opacity-70 sm:h-12 sm:text-base"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {isLoading ? (
                  <span className="relative flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing In...
                  </span>
                ) : (
                  <span className="relative">Sign In</span>
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="shrink-0 text-center text-[10px] text-white font-semibold sm:text-base rounded-full border border-blue-400/25 bg-black/40 px-4 py-2">
          © 2026 · Romil Hingrajiya · +91 87806 70096
        </p>
      </div>
    </div>
  );
}
