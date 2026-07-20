import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/context/UserContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const { login, register } = useUserContext();
  const router = useRouter();

  const handleLoginClick = () => {
    router.push('/');
  };

  useEffect(() => {
    const url = process.env.R2R_DEPLOYMENT_URL || 'http://localhost:7272';
    setDeploymentUrl(url);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPasswordsMatch()) {
      setPasswordsMatch(false);
      return;
    }
    try {
      await register(email, password, deploymentUrl);
      await login(email, password, deploymentUrl);
      router.push('/');
    } catch (error) {
      console.error('Registration or login failed:', error);
      alert(
        'Registration or login failed. Ensure that your server is running at the specified URL or check your credentials and try again.'
      );
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const checkPasswordsMatch = () => {
    return password === confirmedPassword;
  };

  const handlePasswordBlur = () => {
    setPasswordsMatch(checkPasswordsMatch());
  };

  return (
    <Layout includeFooter={false}>
      <div className="flex flex-col justify-center items-center min-h-screen p-8 gap-16">
        <form
          onSubmit={handleSubmit}
          className="glass-card shadow-2xl px-8 pt-8 pb-8 mb-4 w-full max-w-md flex flex-col"
        >
          <div className="mb-4">
            <label
              className="block text-foreground text-sm font-semibold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <label
                className="block text-foreground text-sm font-semibold mb-2 flex-grow"
                htmlFor="password"
              >
                Password
              </label>
              {!passwordsMatch && (
                <span className="text-red-400 text-sm font-bold mb-2">
                  Passwords do not match
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                className={`pr-10 ${passwordsMatch ? '' : 'border-red-400'}`}
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label
              className="block text-foreground text-sm font-semibold mb-2"
              htmlFor="confirm-password"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirm-password"
                name="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmedPassword}
                onChange={(e) => setConfirmedPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                className={`pr-10 ${passwordsMatch ? '' : 'border-red-400'}`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button className="w-full">Sign up with Email</Button>
          </div>
        </form>

        <div className="text-muted-foreground text-sm font-semibold mb-2">
          <p>
            Already have an account?{' '}
            <span
              onClick={handleLoginClick}
              className="text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors"
            >
              Log in
            </span>
            .
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
