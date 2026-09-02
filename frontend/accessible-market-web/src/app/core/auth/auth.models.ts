export interface CurrentUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly emailConfirmed: boolean;
  readonly roles: readonly string[];
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly accessTokenExpiresAtUtc: string;
  readonly tokenType: 'Bearer';
  readonly user: CurrentUser;
}

export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly fullName: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface ApiProblem {
  readonly title?: string;
  readonly detail?: string;
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}
