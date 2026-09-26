import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AuthLayout from '../layouts/AuthLayout';
import GlassField from '../components/GlassField';
import GlassButton from '../components/GlassButton';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const resetSuccess = location.state?.resetSuccess;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Conservation Platform"
      title="Welcome back"
      subtitle="Sign in to continue monitoring conservation efforts."
    >
      <form onSubmit={handleSubmit}>
        {resetSuccess && !error && (
          <p className="mb-4 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-100">
            Your password has been reset. Please sign in.
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            {error}
          </p>
        )}

        <GlassField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <GlassField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <div className="mb-6 flex justify-end">
          <Link to="/forgot-password" className="text-sm text-emerald-300 hover:text-emerald-200">
            Forgot password?
          </Link>
        </div>

        <GlassButton type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </GlassButton>
      </form>
    </AuthLayout>
  );
}

export default Login;
