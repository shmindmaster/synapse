export type UserRole = 'ADMIN' | 'USER' | 'TEAM' | 'DEVELOPER' | 'INTEGRATOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
}

// Demo users configuration
export const DEMO_USERS: Array<{ email: string; name: string; role: UserRole }> = [
  { email: 'demomaster@pendoah.com', name: 'Demo Master', role: 'ADMIN' },
  { email: 'user@synapse.demo', name: 'Knowledge User', role: 'USER' },
  { email: 'team@synapse.demo', name: 'Team Collaborator', role: 'TEAM' },
  { email: 'admin@synapse.demo', name: 'Admin User', role: 'ADMIN' },
];
