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
  { email: 'demomaster@pendoah.ai', name: 'Demo Master', role: 'ADMIN' },
  { email: 'user@pendoah.ai', name: 'Knowledge User', role: 'USER' },
  { email: 'team@pendoah.ai', name: 'Team Collaborator', role: 'TEAM' },
  { email: 'admin@pendoah.ai', name: 'Admin User', role: 'ADMIN' },
];
