export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type StoredAuthSession = {
  provider: 'google';
  user: AuthenticatedUser;
  idToken?: string;
  issuedAt: number;
};
