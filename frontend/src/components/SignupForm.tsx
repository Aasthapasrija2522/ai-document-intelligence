import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { signup } from '../api/auth';

const HEX_CHARS = '0123456789abcdef';

function scrambledHex(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
  }
  return result;
}

function SignupForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [cipherPreview, setCipherPreview] = useState<string>('');

  useEffect(() => {
    if (!password) {
      setCipherPreview('');
      return;
    }

    const interval = setInterval(() => {
      setCipherPreview(scrambledHex(password.length * 2));
    }, 90);

    return () => clearInterval(interval);
  }, [password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await signup(email, password, fullName || undefined);
      setMessage(`Account registered. Welcome, ${response.data.full_name ?? response.data.email}.`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(`Error: ${error.response.data.detail}`);
      } else {
        setMessage('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#10151F' }}
    >
      <div className="relative w-full max-w-sm">
        {/* corner brackets — scan-viewport motif */}
        <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: '#C9A24B' }} />
        <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2" style={{ borderColor: '#C9A24B' }} />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2" style={{ borderColor: '#C9A24B' }} />
        <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: '#C9A24B' }} />

        <form
          onSubmit={handleSubmit}
          className="p-8 border"
          style={{ backgroundColor: '#161C29', borderColor: '#2A3346' }}
        >
          <p
            className="text-[11px] tracking-[0.2em] uppercase mb-1"
            style={{ color: '#C9A24B', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Pending Classification — New Credential
          </p>
          <h1
            className="text-3xl mb-6"
            style={{ color: '#ECEEF3', fontFamily: "'Source Serif 4', serif", fontWeight: 600 }}
          >
            Register access
          </h1>

          <label
            className="block text-xs uppercase tracking-wide mb-1"
            style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}
          >
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 mb-4 bg-transparent border outline-none transition-colors"
            style={{ borderColor: '#2A3346', color: '#ECEEF3', fontFamily: "'Inter', sans-serif" }}
            onFocus={(e) => (e.target.style.borderColor = '#C9A24B')}
            onBlur={(e) => (e.target.style.borderColor = '#2A3346')}
          />

          <label
            className="block text-xs uppercase tracking-wide mb-1"
            style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 mb-4 bg-transparent border outline-none transition-colors"
            style={{ borderColor: '#2A3346', color: '#ECEEF3', fontFamily: "'Inter', sans-serif" }}
            onFocus={(e) => (e.target.style.borderColor = '#C9A24B')}
            onBlur={(e) => (e.target.style.borderColor = '#2A3346')}
          />

          <label
            className="block text-xs uppercase tracking-wide mb-1"
            style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-transparent border outline-none transition-colors"
            style={{ borderColor: '#2A3346', color: '#ECEEF3', fontFamily: "'Inter', sans-serif" }}
            onFocus={(e) => (e.target.style.borderColor = '#C9A24B')}
            onBlur={(e) => (e.target.style.borderColor = '#2A3346')}
          />

          {/* live cipher preview — signature element */}
          <div
            className="h-5 mt-2 mb-5 text-xs overflow-hidden whitespace-nowrap"
            style={{ color: '#5FB8B0', fontFamily: "'IBM Plex Mono', monospace" }}
            aria-hidden="true"
          >
            {cipherPreview ? `AES-256 · ${cipherPreview}` : '\u00A0'}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-sm uppercase tracking-wide transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C9A24B', color: '#10151F', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
          >
            Register
          </button>

          {message && (
            <p
              className="mt-4 text-sm"
              style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default SignupForm;