import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import AuthLayout from '../layouts/AuthLayout';
import GlassField from '../components/GlassField';
import GlassButton from '../components/GlassButton';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Conservation Platform"
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
    >
      {message ? (
        <>
          <p className="mb-6 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </p>
          <Link to="/login" className="text-sm text-emerald-300 hover:text-emerald-200">
            ← Back to sign in
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
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

          <div className="mt-2 mb-6">
            <GlassButton type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </GlassButton>
          </div>

          <Link to="/login" className="text-sm text-emerald-300 hover:text-emerald-200">
            ← Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
