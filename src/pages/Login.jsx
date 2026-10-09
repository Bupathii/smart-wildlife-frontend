import { useState } from 'react';

import {
  ArrowRight,
  BarChart3,
  BellRing,
  Eye,
  EyeOff,
  FlaskConical,
  HeartHandshake,
  Leaf,
  LockKeyhole,
  Mail,
  MapPinned,
  ShieldCheck,
  Sparkles,
  UserCog,
  UsersRound,
} from 'lucide-react';

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import apiClient from '../api/client';

import {
  isMobileOnlyRole,
  isWebRole,
} from '../config/roleAccess';

const DEMO_USERS = [
  {
    label: 'System Admin',
    description: 'Users & system configuration',
    email: 'admin.demo@wildlife.lk',
    password: 'Admin@123',
    icon: UserCog,
  },
  {
    label: 'Park Manager',
    description: 'Park operations & monitoring',
    email: 'manager.demo@wildlife.lk',
    password: 'Manager@123',
    icon: ShieldCheck,
  },
  {
    label: 'Ranger Supervisor',
    description: 'Patrol & ranger supervision',
    email: 'supervisor.demo@wildlife.lk',
    password: 'Supervisor@123',
    icon: UsersRound,
  },
  {
    label: 'Researcher',
    description: 'Analytics & conservation data',
    email: 'researcher.demo@wildlife.lk',
    password: 'Researcher@123',
    icon: FlaskConical,
  },
  {
    label: 'Community Liaison',
    description: 'Conflicts & risk responses',
    email: 'liaison.demo@wildlife.lk',
    password: 'Liaison@123',
    icon: HeartHandshake,
  },
];

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [demoLoading, setDemoLoading] =
    useState('');

  const [error, setError] =
    useState('');

  const resetSuccess =
    location.state?.resetSuccess;

  async function performLogin(
    loginEmail,
    loginPassword
  ) {
    const { data } = await apiClient.post(
      '/auth/login',
      {
        email: loginEmail,
        password: loginPassword,
      }
    );

    const token =
      data.token ||
      data.accessToken;

    const loggedUser = data.user;

    if (!token || !loggedUser) {
      throw new Error(
        'Invalid response received from the server.'
      );
    }

    if (
      isMobileOnlyRole(loggedUser.role)
    ) {
      throw new Error(
        `${loggedUser.role.replaceAll(
          '_',
          ' '
        )} accounts use the mobile application.`
      );
    }

    if (!isWebRole(loggedUser.role)) {
      throw new Error(
        'This account does not have access to the web dashboard.'
      );
    }

    localStorage.setItem(
      'token',
      token
    );

    localStorage.setItem(
      'user',
      JSON.stringify(loggedUser)
    );

    navigate('/dashboard', {
      replace: true,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !email.trim() ||
      !password.trim()
    ) {
      setError(
        'Please enter your email address and password.'
      );
      return;
    }

    setError('');
    setLoading(true);

    try {
      await performLogin(
        email.trim().toLowerCase(),
        password
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to sign in. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(
    demo
  ) {
    setError('');
    setDemoLoading(demo.email);

    setEmail(demo.email);
    setPassword(demo.password);

    try {
      await performLogin(
        demo.email,
        demo.password
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to access this demo account.'
      );
    } finally {
      setDemoLoading('');
    }
  }

  const anyLoading =
    loading ||
    Boolean(demoLoading);

  return (
    <main className="min-h-dvh bg-[#f4f8fb]">

      <div className="grid min-h-dvh lg:grid-cols-[0.95fr_1.05fr] xl:grid-cols-[1fr_1fr]">

        {/* =========================
            LEFT BRANDING SECTION
        ========================== */}

        <section className="relative hidden overflow-hidden lg:flex">

          {/* Main gradient */}

          <div className="absolute inset-0 bg-gradient-to-br from-[#071d3a] via-[#073b4c] to-[#075941]" />

          {/* Soft blue glow */}

          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-[110px]" />

          {/* Green glow */}

          <div className="absolute -bottom-48 -right-40 h-[560px] w-[560px] rounded-full bg-emerald-400/20 blur-[120px]" />

          {/* Cyan glow */}

          <div className="absolute left-[40%] top-[35%] h-80 w-80 rounded-full bg-cyan-400/10 blur-[100px]" />

          {/* Grid pattern */}

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
          />

          <div className="relative z-10 flex min-h-full w-full flex-col justify-between px-10 py-10 xl:px-16 xl:py-14 2xl:px-20">

            {/* Brand */}

            <div className="flex items-center gap-3.5">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-300 shadow-xl shadow-black/10 backdrop-blur-xl">
                <Leaf
                  size={25}
                  strokeWidth={2}
                />
              </div>

              <div>
                <p className="text-[15px] font-bold tracking-wide text-white">
                  Wildlife Conservation
                </p>

                <p className="mt-0.5 text-xs text-cyan-100/55">
                  Smart Operations Platform
                </p>
              </div>
            </div>

            {/* Main hero */}

            <div className="max-w-[620px] py-12">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-300/[0.07] px-4 py-2 backdrop-blur-xl">

                <Sparkles
                  size={14}
                  className="text-cyan-300"
                />

                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100/80">
                  Conservation Intelligence
                </span>
              </div>

              <h1 className="max-w-xl text-[40px] font-bold leading-[1.1] tracking-[-0.035em] text-white xl:text-[52px] 2xl:text-[58px]">

                Protect wildlife with

                <span className="block bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                  connected intelligence.
                </span>
              </h1>

              <p className="mt-6 max-w-[540px] text-[15px] leading-7 text-slate-200/75 xl:text-base">

                Monitor ranger operations, respond to
                wildlife risks, analyse conservation
                information and coordinate field
                activities through one secure platform.

              </p>

              {/* Feature cards */}

              <div className="mt-10 grid max-w-[570px] grid-cols-3 gap-3">

                <FeatureCard
                  icon={MapPinned}
                  title="Monitor"
                  description="Patrol operations"
                  color="blue"
                />

                <FeatureCard
                  icon={BellRing}
                  title="Respond"
                  description="Risk alerts"
                  color="cyan"
                />

                <FeatureCard
                  icon={BarChart3}
                  title="Analyse"
                  description="Conservation data"
                  color="green"
                />

              </div>
            </div>

            {/* Bottom info */}

            <div>

              <div className="h-px w-full bg-gradient-to-r from-cyan-300/25 via-white/10 to-transparent" />

              <div className="mt-5 flex items-center justify-between gap-5">

                <p className="max-w-sm text-xs leading-5 text-slate-300/45">
                  Smart Wildlife Conservation and
                  Anti-Poaching Monitoring System
                </p>

                <div className="flex items-center gap-2 text-xs text-emerald-200/50">
                  <ShieldCheck size={14} />
                  Secure Operations
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* =========================
            RIGHT LOGIN SECTION
        ========================== */}

        <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-10 md:px-10 lg:px-10 xl:px-14">

          {/* Mobile background decoration */}

          <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl lg:hidden" />

          <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl lg:hidden" />

          <div className="relative z-10 w-full max-w-[610px]">

            {/* Mobile brand */}

            <div className="mb-7 flex items-center gap-3 lg:hidden">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 via-teal-700 to-emerald-700 text-white shadow-lg shadow-blue-900/15">

                <Leaf size={24} />

              </div>

              <div>
                <p className="font-bold text-slate-900">
                  Wildlife Conservation
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Operations Dashboard
                </p>
              </div>

            </div>

            {/* Login card */}

            <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:p-7 md:p-8 xl:p-9">

              {/* Header */}

              <div className="mb-7">

                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-emerald-50 px-3 py-1.5">

                  <ShieldCheck
                    size={14}
                    className="text-teal-700"
                  />

                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-800">
                    Authorized Access
                  </span>

                </div>

                <h2 className="text-2xl font-bold tracking-[-0.025em] text-slate-900 sm:text-3xl">
                  Welcome back
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Sign in to access the Wildlife
                  Conservation Operations Dashboard.
                </p>

              </div>

              {/* Success */}

              {resetSuccess &&
                !error && (
                  <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">

                    Password reset successful.
                    You can now sign in.

                  </div>
                )}

              {/* Error */}

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">

                  {error}

                </div>
              )}

              {/* Login Form */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* Email */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-[13px] font-semibold text-slate-700"
                  >
                    Email address
                  </label>

                  <div className="group relative">

                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600"
                    />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      placeholder="name@wildlife.lk"
                      autoComplete="email"
                      disabled={anyLoading}
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />

                  </div>
                </div>

                {/* Password */}

                <div>

                  <div className="mb-2 flex items-center justify-between gap-3">

                    <label
                      htmlFor="password"
                      className="text-[13px] font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-teal-700 transition-colors hover:text-blue-700"
                    >
                      Forgot password?
                    </Link>

                  </div>

                  <div className="group relative">

                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600"
                    />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={anyLoading}
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >

                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}

                    </button>

                  </div>

                </div>

                {/* Login Button */}

                <button
                  type="submit"
                  disabled={anyLoading}
                  className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-teal-700 to-emerald-700 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-900/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/15 focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <LoadingSpinner />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to dashboard

                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}

                </button>

              </form>

              {/* Demo separator */}

              <div className="my-7 flex items-center gap-3">

                <div className="h-px flex-1 bg-slate-200" />

                <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Demo Accounts
                </span>

                <div className="h-px flex-1 bg-slate-200" />

              </div>

              {/* Demo heading */}

              <div className="mb-4">

                <p className="text-sm font-semibold text-slate-800">
                  Quick role access
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Select a role to preview its dashboard access.
                </p>

              </div>

              {/* Demo Cards */}

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">

                {DEMO_USERS.map(
                  (demo) => {

                    const Icon =
                      demo.icon;

                    const active =
                      demoLoading ===
                      demo.email;

                    return (
                      <button
                        key={demo.email}
                        type="button"
                        disabled={anyLoading}
                        onClick={() =>
                          handleDemoLogin(
                            demo
                          )
                        }
                        className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/70 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:bg-gradient-to-br hover:from-blue-50/70 hover:to-emerald-50/70 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-emerald-100 text-teal-700 ring-1 ring-teal-100 transition group-hover:from-blue-100 group-hover:to-emerald-200">

                          <Icon
                            size={18}
                            strokeWidth={2}
                          />

                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-[13px] font-semibold text-slate-800">
                            {demo.label}
                          </p>

                          <p className="mt-0.5 truncate text-[10px] leading-4 text-slate-400">
                            {demo.description}
                          </p>

                        </div>

                        {active ? (
                          <LoadingSpinner dark />
                        ) : (
                          <ArrowRight
                            size={15}
                            className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600"
                          />
                        )}

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* Footer */}

            <div className="mt-6 flex flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-2">

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck size={13} />
                Authorized personnel only
              </div>

              <span className="hidden text-slate-300 sm:inline">
                •
              </span>

              <p className="text-xs text-slate-400">
                Wildlife Conservation System
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}) {
  const styles = {
    blue: {
      box: 'bg-blue-400/10 border-blue-200/10',
      icon: 'text-blue-300',
    },
    cyan: {
      box: 'bg-cyan-400/10 border-cyan-200/10',
      icon: 'text-cyan-300',
    },
    green: {
      box: 'bg-emerald-400/10 border-emerald-200/10',
      icon: 'text-emerald-300',
    },
  };

  const selected =
    styles[color] ||
    styles.green;

  return (
    <div
      className={`rounded-2xl border p-4 backdrop-blur-sm ${selected.box}`}
    >

      <Icon
        size={19}
        className={selected.icon}
      />

      <p className="mt-3 text-sm font-semibold text-white">
        {title}
      </p>

      <p className="mt-1 text-[11px] leading-4 text-slate-300/55">
        {description}
      </p>

    </div>
  );
}

function LoadingSpinner({
  dark = false,
}) {
  return (
    <span
      className={`h-4 w-4 animate-spin rounded-full border-2 ${
        dark
          ? 'border-teal-600 border-t-transparent'
          : 'border-white/40 border-t-white'
      }`}
    />
  );
}

export default Login;