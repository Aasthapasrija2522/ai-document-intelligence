import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { login } from '../api/auth';
import { useNavigate } from 'react-router-dom';

type LoginStatus = 'idle' | 'verifying' | 'granted' | 'denied';

const STATUS_TEXT: Record<LoginStatus, string> = {
  idle: 'Awaiting credentials',
  verifying: 'Verifying…',
  granted: 'Access granted',
  denied: 'Access denied',
};

const STATUS_COLOR: Record<LoginStatus, string> = {
  idle: '#8791A8',
  verifying: '#5FB8B0',
  granted: '#C9A24B',
  denied: '#C1523A',
};

function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [errorDetail, setErrorDetail] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorDetail('');
    setStatus('verifying');

    try {
      const response = await login(email, password);

      // Store JWT token
      localStorage.setItem('token', response.data.access_token);

      // Show success state
      setStatus('granted');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (error) {
      setStatus('denied');

      if (axios.isAxiosError(error) && error.response) {
        setErrorDetail(error.response.data.detail);
      } else {
        setErrorDetail('Unable to reach the server.');
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#10151F' }}
    >
      <div className="relative w-full max-w-sm">
        <div
          className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2"
          style={{ borderColor: '#C9A24B' }}
        />
        <div
          className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2"
          style={{ borderColor: '#C9A24B' }}
        />
        <div
          className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2"
          style={{ borderColor: '#C9A24B' }}
        />
        <div
          className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2"
          style={{ borderColor: '#C9A24B' }}
        />

        <form
          onSubmit={handleSubmit}
          className="p-8 border"
          style={{
            backgroundColor: '#161C29',
            borderColor: '#2A3346',
          }}
        >
          <p
            className="text-[11px] tracking-[0.2em] uppercase mb-1"
            style={{
              color: '#C9A24B',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Identity Verification — Session Request
          </p>

          <h1
            className="text-3xl mb-6"
            style={{
              color: '#ECEEF3',
              fontFamily: "'Source Serif 4', serif",
              fontWeight: 600,
            }}
          >
            Resume session
          </h1>

          <label
            className="block text-xs uppercase tracking-wide mb-1"
            style={{
              color: '#8791A8',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 mb-4 bg-transparent border outline-none transition-colors"
            style={{
              borderColor: '#2A3346',
              color: '#ECEEF3',
              fontFamily: "'Inter', sans-serif",
            }}
            onFocus={(e) => (e.target.style.borderColor = '#C9A24B')}
            onBlur={(e) => (e.target.style.borderColor = '#2A3346')}
          />

          <label
            className="block text-xs uppercase tracking-wide mb-1"
            style={{
              color: '#8791A8',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 mb-5 bg-transparent border outline-none transition-colors"
            style={{
              borderColor: '#2A3346',
              color: '#ECEEF3',
              fontFamily: "'Inter', sans-serif",
            }}
            onFocus={(e) => (e.target.style.borderColor = '#C9A24B')}
            onBlur={(e) => (e.target.style.borderColor = '#2A3346')}
          />

          <button
            type="submit"
            className="w-full py-2.5 text-sm uppercase tracking-wide transition-opacity hover:opacity-90"
            style={{
              backgroundColor: '#C9A24B',
              color: '#10151F',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
            }}
          >
            Sign in
          </button>

          <div
            className="flex items-center gap-2 mt-5 text-xs uppercase tracking-wide"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: STATUS_COLOR[status],
                boxShadow:
                  status === 'verifying'
                    ? `0 0 6px ${STATUS_COLOR[status]}`
                    : 'none',
              }}
            />
            <span style={{ color: STATUS_COLOR[status] }}>
              {STATUS_TEXT[status]}
            </span>
          </div>

          {status === 'denied' && errorDetail && (
            <p
              className="mt-2 text-sm"
              style={{
                color: '#8791A8',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {errorDetail}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default LoginForm;