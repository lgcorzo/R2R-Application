import { useRouter } from 'next/router';
import { r2rClient, User } from 'r2r-js';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { AuthenticationError } from '@/lib/CustomErrors';
import { AuthState, Pipeline, UserContextProps } from '@/types';

function isAuthState(obj: any): obj is AuthState {
  const validRoles = ['admin', 'user', null];
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.isAuthenticated === 'boolean' &&
    (typeof obj.email === 'string' || obj.email === null) &&
    (validRoles.includes(obj.userRole) || obj.userRole === null)
  );
}

const UserContext = createContext<UserContextProps>({
  pipeline: null,
  setPipeline: () => {},
  selectedModel: 'null',
  setSelectedModel: () => {},
  isAuthenticated: false,
  login: async () => ({ success: false, userRole: 'user' }),
  loginWithToken: async () => ({ success: false, userRole: 'user' }),
  logout: async () => {},
  unsetCredentials: async () => {},
  register: async () => {},
  authState: {
    isAuthenticated: false,
    email: null,
    userRole: null,
    userId: null,
  },
  getClient: async () => null,
  client: null,
  viewMode: 'admin',
  setViewMode: () => {},
  isSuperUser: () => false,
  createUser: async () => {
    throw new Error('createUser is not implemented in the default context');
  },
  deleteUser: async () => {
    throw new Error('deleteUser is not implemented in the default context');
  },
  updateUser: async () => {
    throw new Error('updateUser is not implemented in the default context');
  },
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [client, setClient] = useState<r2rClient | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin');

  const [pipeline, setPipeline] = useState<Pipeline | null>(() => {
    if (typeof window !== 'undefined') {
      const storedPipeline = localStorage.getItem('pipeline');
      return storedPipeline ? JSON.parse(storedPipeline) : null;
    }
    return null;
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedModel') || '';
    }
    return 'null';
  });

  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      const storedAuthState = localStorage.getItem('authState');
      if (storedAuthState) {
        const parsed = JSON.parse(storedAuthState);
        if (isAuthState(parsed)) {
          return parsed;
        } else {
          console.warn(
            'Invalid authState found in localStorage. Resetting to default.'
          );
        }
      }
    }
    return {
      isAuthenticated: false,
      email: null,
      userRole: null,
      userId: null,
    };
  });

  useEffect(() => {
    setIsReady(true);
  }, []);

  const isSuperUser = useCallback(() => {
    return authState.userRole === 'admin' && viewMode === 'admin';
  }, [authState.userRole, viewMode]);

  const [lastLoginTime, setLastLoginTime] = useState<number | null>(null);

  const login = useCallback(
    async (
      email: string,
      password: string,
      instanceUrl: string
    ): Promise<{ success: boolean; userRole: 'admin' | 'user' }> => {
      // Normalize the instance URL
      let normalizedUrl = instanceUrl.trim();
      // Remove trailing slash if present
      if (normalizedUrl.endsWith('/')) {
        normalizedUrl = normalizedUrl.slice(0, -1);
      }

      console.log('Original instance URL:', instanceUrl);
      console.log('Normalized instance URL:', normalizedUrl);

      const newClient = new r2rClient(normalizedUrl);
      try {
        console.log('Attempting login to:', normalizedUrl);
        console.log('Email:', email);
        console.log('Password provided:', !!password);

        // Log the request payload structure
        const loginPayload = {
          email: email,
          password: password,
        };
        console.log('Login payload:', {
          email: loginPayload.email,
          hasPassword: !!loginPayload.password,
        });

        // Log the actual request that will be sent
        console.log(
          'Calling r2rClient.users.login with payload:',
          loginPayload
        );
        console.log('r2rClient instance URL:', normalizedUrl);

        const tokens = await newClient.users.login(loginPayload);
        console.log('Login successful, tokens received');
        console.log('Tokens structure:', {
          hasResults: !!tokens.results,
          hasAccessToken: !!tokens.results?.accessToken,
          hasRefreshToken: !!tokens.results?.refreshToken,
        });

        // Handle response format from r2r-js
        const accessToken = tokens.results?.accessToken?.token;
        const refreshToken = tokens.results?.refreshToken?.token;

        if (!accessToken || !refreshToken) {
          throw new Error('Invalid token format received from server');
        }

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        newClient.setTokens(accessToken, refreshToken);

        setClient(newClient);

        const userInfo = await newClient.users.me();

        let userRole: 'admin' | 'user' = 'user';
        try {
          await newClient.system.settings();
          userRole = 'admin';
        } catch (error) {
          if (
            error instanceof Error &&
            'status' in error &&
            error.status === 403
          ) {
          } else {
            console.error('Unexpected error when checking user role:', error);
          }
        }

        const newAuthState: AuthState = {
          isAuthenticated: true,
          email,
          userRole,
          userId: userInfo.results.id,
        };
        setAuthState(newAuthState);
        localStorage.setItem('authState', JSON.stringify(newAuthState));

        setLastLoginTime(Date.now());

        const newPipeline: Pipeline = { deploymentUrl: instanceUrl };
        setPipeline(newPipeline);
        localStorage.setItem('pipeline', JSON.stringify(newPipeline));

        return { success: true, userRole };
      } catch (error) {
        console.error('Login failed:', error);
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        console.error(
          'Error keys:',
          error && typeof error === 'object' ? Object.keys(error) : 'N/A'
        );

        // Try to extract full error details
        if (error && typeof error === 'object') {
          try {
            console.error(
              'Full error object:',
              JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
            );
          } catch (e) {
            console.error('Could not stringify error:', e);
            console.error('Error object keys:', Object.keys(error));
          }
          if ('response' in error) {
            const response = (error as any).response;
            console.error('Error response:', response);
            if (response && typeof response === 'object') {
              console.error('Response status:', response.status);
              console.error('Response statusText:', response.statusText);
              console.error('Response data:', response.data);
              try {
                console.error(
                  'Response data (stringified):',
                  JSON.stringify(response.data, null, 2)
                );
              } catch (e) {
                console.error('Could not stringify response data');
              }
            }
          }
          if ('request' in error) {
            const request = (error as any).request;
            console.error('Error request:', request);
            if (request && typeof request === 'object') {
              console.error('Request URL:', request.url);
              console.error('Request method:', request.method);
              console.error('Request headers:', request.headers);
              console.error('Request data:', request.data);
            }
          }
          // Check for axios-style error
          if ('config' in error) {
            const config = (error as any).config;
            console.error('Request config:', {
              url: config?.url,
              method: config?.method,
              baseURL: config?.baseURL,
              data: config?.data,
              headers: config?.headers,
            });
          }
        }

        // Extract error message from different error formats
        let errorMessage = 'Login failed';
        let statusCode: number | undefined;

        if (error instanceof Error) {
          errorMessage = error.message;
          // Check for status code in error object
          if ('status' in error) {
            statusCode = error.status as number;
          } else if ('statusCode' in error) {
            statusCode = (error as any).statusCode;
          } else if ('code' in error) {
            statusCode = (error as any).code;
          }
        } else if (typeof error === 'object' && error !== null) {
          // Handle r2r-js error format
          if ('message' in error) {
            errorMessage = String(error.message);
          } else if ('detail' in error) {
            errorMessage = String(error.detail);
          } else if ('error' in error) {
            errorMessage = String(error.error);
          }
          if ('status' in error) {
            statusCode = (error as any).status;
          } else if ('statusCode' in error) {
            statusCode = (error as any).statusCode;
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        console.error('Extracted error message:', errorMessage);
        console.error('Extracted status code:', statusCode);

        // Create a more descriptive error
        const enhancedError = new Error(errorMessage);
        if (error instanceof Error) {
          Object.assign(enhancedError, error);
        }
        if (statusCode !== undefined) {
          (enhancedError as any).status = statusCode;
        }
        throw enhancedError;
      }
    },
    []
  );

  const loginWithToken = useCallback(
    async (
      token: string,
      instanceUrl: string
    ): Promise<{ success: boolean; userRole: 'admin' | 'user' }> => {
      const newClient = new r2rClient(instanceUrl);
      try {
        const result = await newClient.users.loginWithToken({
          accessToken: token,
        });

        const userInfo = await newClient.users.me();

        localStorage.setItem('accessToken', result.accessToken.token);

        newClient.setTokens(result.accessToken.token, '');
        setClient(newClient);

        let userRole: 'admin' | 'user' = 'user';
        try {
          await newClient.system.settings();
          userRole = 'admin';
        } catch (error) {
          if (
            error instanceof Error &&
            'status' in error &&
            error.status === 403
          ) {
          } else {
            console.error('Unexpected error when checking user role:', error);
          }
        }

        const newAuthState: AuthState = {
          isAuthenticated: true,
          email: '',
          userRole,
          userId: userInfo.results.id,
        };
        setAuthState(newAuthState);
        localStorage.setItem('authState', JSON.stringify(newAuthState));

        setLastLoginTime(Date.now());

        const newPipeline: Pipeline = { deploymentUrl: instanceUrl };
        setPipeline(newPipeline);
        localStorage.setItem('pipeline', JSON.stringify(newPipeline));

        return { success: true, userRole };
      } catch (error) {
        console.error('Login with token failed:', error);
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    if (client && authState.isAuthenticated) {
      try {
        await client.users.logout();
      } catch (error) {
        console.error(`Logout failed:`, error);
      }
    }
    setAuthState({
      isAuthenticated: false,
      email: null,
      userRole: null,
      userId: null,
    });
    localStorage.removeItem('pipeline');
    localStorage.removeItem('authState');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setPipeline(null);
    setClient(null);
  }, [client, authState.isAuthenticated]);

  const unsetCredentials = useCallback(async () => {
    setAuthState({
      isAuthenticated: false,
      email: null,
      userRole: null,
      userId: null,
    });
    localStorage.removeItem('pipeline');
    localStorage.removeItem('authState');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setPipeline(null);
    setClient(null);
  }, [client, authState.isAuthenticated]);

  const register = useCallback(
    async (email: string, password: string, instanceUrl: string) => {
      const newClient = new r2rClient(instanceUrl);
      if (newClient) {
        try {
          await newClient.users.create({
            email: email,
            password: password,
          });
        } catch (error) {
          console.error('Failed to create user:', error);

          //better error handling to display error to user if duplicate email
          const errorStr = JSON.stringify(error).toLowerCase();
          if (
            errorStr.includes('User with this email already exists') ||
            errorStr.includes('email already exists')
          ) {
            throw new Error(
              'An account with this email already exists. You may have previously signed in with this email through Google, GitHub, or another method.'
            );
          }

          // throw original error if not duplicate email
          throw error;
        }
      } else {
        console.error('Client is not initialized');
        throw new Error('Client is not initialized');
      }
    },
    []
  );

  const refreshTokenPeriodically = useCallback(async () => {
    type ActualTokenResponse = {
      results: {
        accessToken: { token: string };
        refreshToken: { token: string };
      };
    };
    if (authState.isAuthenticated && client) {
      if (
        lastLoginTime &&
        Date.now() - lastLoginTime < 5 * 60 * 1000 // 5 minutes
      ) {
        return;
      }
      try {
        const newTokens =
          (await client.users.refreshAccessToken()) as unknown as ActualTokenResponse;

        localStorage.setItem(
          'accessToken',
          newTokens.results.accessToken.token
        );
        localStorage.setItem(
          'refreshToken',
          newTokens.results.refreshToken.token
        );
        client.setTokens(
          newTokens.results.accessToken.token,
          newTokens.results.refreshToken.token
        );
        setLastLoginTime(Date.now());
      } catch (error) {
        console.error('Failed to refresh token:', error);
        if (error instanceof AuthenticationError) {
          try {
            throw new Error('Silent re-authentication not implemented');
          } catch (loginError) {
            console.error('Failed to re-authenticate:', loginError);
            await logout();
          }
        } else {
          await logout();
        }
      }
    }
  }, [authState.isAuthenticated, client, lastLoginTime, logout]);

  const getClient = useCallback(async (): Promise<r2rClient | null> => {
    // If client exists and has tokens, return it
    if (client) {
      return client;
    }

    // If authenticated but client not created, create it
    if (authState.isAuthenticated && pipeline?.deploymentUrl) {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        const newClient = new r2rClient(pipeline.deploymentUrl);
        newClient.setTokens(accessToken, refreshToken);
        setClient(newClient);
        return newClient;
      }
    }

    return null;
  }, [client, authState.isAuthenticated, pipeline]);

  useEffect(() => {
    if (authState.isAuthenticated && pipeline && !client) {
      const newClient = new r2rClient(pipeline.deploymentUrl);
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken && refreshToken) {
        newClient.setTokens(accessToken, refreshToken);
      }
      setClient(newClient);
    }
  }, [authState.isAuthenticated, pipeline, client]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authState') {
        const newAuthState = e.newValue ? JSON.parse(e.newValue) : null;
        if (newAuthState && isAuthState(newAuthState)) {
          setAuthState(newAuthState);
        }
      }
      if (e.key === 'pipeline') {
        const newPipeline = e.newValue ? JSON.parse(e.newValue) : null;
        setPipeline(newPipeline);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (authState.isAuthenticated) {
      const initialDelay = setTimeout(
        () => {
          refreshTokenPeriodically();
          refreshInterval = setInterval(
            refreshTokenPeriodically,
            55 * 60 * 1000 // 55 minutes
          );
        },
        5 * 60 * 1000
      ); // 5 minutes

      return () => {
        clearTimeout(initialDelay);
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }
      };
    }
  }, [authState.isAuthenticated, refreshTokenPeriodically]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedModel', selectedModel);
    }
  }, [selectedModel]);

  const createUser = useCallback(
    async (userData: { email: string; password: string; role: string }) => {
      if (!client) {
        throw new Error('Client not initialized');
      }
      try {
        return await client.users.create(userData);
      } catch (error) {
        console.error('Failed to create user:', error);
        throw error;
      }
    },
    [client]
  );

  const deleteUser = useCallback(
    async (userId: string, password: string) => {
      if (!client) {
        throw new Error('Client not initialized');
      }
      try {
        await client.users.delete({ id: userId, password });
      } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
      }
    },
    [client]
  );

  const updateUser = useCallback(
    async (userId: string, userData: Partial<User>) => {
      if (!client) {
        throw new Error('Client not initialized');
      }
      try {
        const response = await client.users.update({
          id: userId,
          ...userData,
        });
        return response.results;
      } catch (error) {
        console.error('Update user error:', error);
        throw error;
      }
    },
    [client]
  );

  const contextValue = React.useMemo(
    () => ({
      pipeline,
      setPipeline,
      selectedModel,
      setSelectedModel,
      isAuthenticated: authState.isAuthenticated,
      authState,
      login,
      loginWithToken,
      logout,
      unsetCredentials,
      register,
      getClient,
      client,
      viewMode,
      setViewMode,
      isSuperUser,
      createUser,
      deleteUser,
      updateUser,
    }),
    [
      pipeline,
      selectedModel,
      authState,
      client,
      viewMode,
      isSuperUser,
      login,
      loginWithToken,
      logout,
      unsetCredentials,
      register,
      getClient,
      createUser,
      deleteUser,
      updateUser,
    ]
  );

  if (!isReady) {
    return null;
  }

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
