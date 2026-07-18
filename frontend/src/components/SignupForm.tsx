import { useState } from 'react';
import type { FormEvent } from 'react';
import { signup } from '../api/auth';
import axios from 'axios';

function SignupForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await signup(email, password, fullName || undefined);
      setMessage(`Signup successful! Welcome, ${response.data.full_name ?? response.data.email}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(`Error: ${error.response.data.detail}`);
      } else {
        setMessage('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>

      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full p-2 border rounded mb-3"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded mb-3"
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded mb-3"
        required
      />

      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        Sign Up
      </button>

      {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
    </form>
  );
}

export default SignupForm;