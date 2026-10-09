import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import AuthLayout from '../layouts/AuthLayout';
import GlassField from '../components/GlassField';
import GlassButton from '../components/GlassButton';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/auth/reset-password/${token}`, { password });
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Conservation Platform"
      title="Set a new password"
      subtitle="Choose a new password for your account."
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <p className="mb-4 rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            {error}
          </p>
        )}

        <GlassField
          id="password"
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />

        <GlassField
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />

        <div className="mt-2 mb-6">
          <GlassButton type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Reset Password'}
          </GlassButton>
        </div>

        <Link to="/login" className="text-sm text-emerald-300 hover:text-emerald-200">
          ← Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
