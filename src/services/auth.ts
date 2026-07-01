// services/auth.ts
import api, { getToken, saveToken, clearStorage } from "./api";
import { AxiosError } from "axios";
import logger from "@/utils/logger";

/** Roles available in the application */
export type UserRole = "user" | "admin" | "support";

/**
 * Represents an authenticated user.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  /** National ID document number */
  id_documento: string;
  status: string;
  role: UserRole;
  verification_status?: string;
  photo?: string;
  bio?: string;
  department?: string;
  city?: string;
}

/**
 * Payload required to register a new user.
 */
export interface RegisterData {
  name: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  id_documento: string;
  status?: string;
}

/**
 * Payload required for the login endpoint.
 */
export interface LoginData {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Shape of the response returned by /auth/login and /auth/register.
 */
export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  expires_in?: number;
  token_type?: string;
  remember?: boolean;
  data?: {
    user?: User;
    verification_required?: boolean;
    verification_token?: string;
    email?: string;
    token?: string;
    [key: string]: unknown;
  };
}

/** Laravel validation error map  */
interface ValidationErrors {
  [field: string]: string[];
}

interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: ValidationErrors;
}

// ── Field-name translations for error messages ───────────────────────────
const FIELD_TRANSLATIONS: Record<string, string> = {
  name: "Nombre",
  email: "Correo electrónico",
  phone: "Teléfono",
  password: "Contraseña",
  address: "Dirección",
  id_documento: "Documento de identidad",
  status: "Estado",
};

class AuthService {
  constructor() {
    // Restore token header at startup
    const token = getToken();
    if (token) this._setAuthHeader(token);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _setAuthHeader(token: string) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  private _removeAuthHeader() {
    delete api.defaults.headers.common["Authorization"];
  }

  private _translateField(field: string): string {
    return FIELD_TRANSLATIONS[field] ?? field;
  }

  // ── Public token API (delegates to api.ts helpers) ───────────────────────

  /**
   * Returns the current auth token from storage, or null.
   */
  getToken(): string | null {
    return getToken();
  }

  /**
   * Persists the token and updates the Axios default header.
   */
  public saveToken(token: string, remember = false): void {
    saveToken(token, remember);
    this._setAuthHeader(token);
  }

  /**
   * Persists the user object in the appropriate storage.
   */
  public saveUser(user: User, remember = false): void {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(user));
  }

  /**
   * Reads the cached user from storage.
   */
  getUser(): User | null {
    const raw =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  /**
   * Clears all auth data from storage and removes the Axios header.
   */
  private _clearAll(): void {
    clearStorage();
    this._removeAuthHeader();
  }

  // ── Auth endpoints ───────────────────────────────────────────────────────

  /**
   * Registers a new user.
   * @throws {Error} With a translated validation message on 422, or a generic message otherwise.
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/register", {
        ...userData,
        email: userData.email.trim().toLowerCase(),
        status: userData.status ?? "active",
      });

      // Case 1: registration OK but verification required
      if (response.data.success && !response.data.token) {
        localStorage.setItem(
          "pending_email",
          userData.email.trim().toLowerCase()
        );
        return {
          ...response.data,
          data: response.data.data ?? {
            verification_required: true,
            email: userData.email.trim().toLowerCase(),
          },
        };
      }

      // Case 2: registration + auto-login (unusual with email verification)
      if (response.data.success && response.data.token && response.data.user) {
        this.saveToken(response.data.token, false);
        this.saveUser(response.data.user, false);
        return response.data;
      }

      throw new Error(response.data.message ?? "Error en el registro");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as ErrorResponse | undefined;

        if (error.response?.status === 422 && data?.errors) {
          const messages = Object.entries(data.errors)
            .map(
              ([field, msgs]) =>
                `${this._translateField(field)}: ${msgs.join(", ")}`
            )
            .join("\n");
          throw new Error(`Errores de validación:\n${messages}`);
        }

        throw new Error(data?.message ?? "Error en el registro");
      }
      throw new Error("Error desconocido en el registro");
    }
  }

  /**
   * Verifies a user's email with an OTP code.
   */
  async verifyEmail(email: string, code: string, token: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/verify-email", {
        email,
        code,
        token,
      });

      if (response.data.success) {
        // Backend returns token/user inside 'data' property
        const innerData = response.data.data;
        const authToken = (innerData?.token as string | undefined) ?? response.data.token;
        const user = (innerData?.user as User | undefined) ?? response.data.user;

        if (authToken) {
          this.saveToken(authToken, false);
        }
        if (user) {
          this.saveUser(user, false);
        }

        return response.data;
      }

      throw new Error(response.data.message ?? "Error en la verificación");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as ErrorResponse | undefined;
        throw new Error(data?.message ?? "Error en la verificación");
      }
      throw error;
    }
  }

  /**
   * Resends the verification code to the user's email.
   */
  async resendCode(email: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/resend-code", {
      email,
    });
    return response.data;
  }

  /**
   * Checks if a verification token is still valid.
   */
  async checkToken(token: string): Promise<boolean> {
    try {
      const response = await api.post<AuthResponse>("/auth/check-token", {
        token,
      });
      return response.data.success;
    } catch {
      return false;
    }
  }

  /**
   * Authenticates an existing user.
   * @throws {Error} With a localized message on failure.
   */
  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/login", {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        remember: credentials.remember ?? false,
      });

      if (response.data.success && response.data.token) {
        const remember = credentials.remember ?? false;
        this.saveToken(response.data.token, remember);

        const user = response.data.user ?? (await this.getMe());
        this.saveUser(user, remember);
        return { ...response.data, user };
      }

      throw new Error(response.data.message ?? "Error en el login");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as ErrorResponse | undefined;
        const status = error.response?.status;

        if (status === 401) {
          throw new Error(data?.message ?? "Correo o contraseña incorrectos");
        }
        if (status === 403) {
          throw new Error(data?.message ?? "Tu cuenta está inactiva");
        }
        throw new Error(data?.message ?? "Error en el login");
      }
      throw new Error("Error de conexión. Verifica tu internet");
    }
  }

  /**
   * Fetches the currently authenticated user from the API.
   */
  async getMe(): Promise<User> {
    try {
      const response = await api.get<{ success: boolean; user: User }>(
        "/auth/me"
      );

      if (response.data.success && response.data.user) {
        return response.data.user;
      }

      throw new Error("No se pudo obtener la información del usuario");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) this._clearAll();
        const data = error.response?.data as ErrorResponse | undefined;
        throw new Error(data?.message ?? "Error al obtener usuario");
      }
      throw error;
    }
  }

  /**
   * Logs the user out: calls the API, then clears local state.
   */
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (error: unknown) {
      logger.warn("Logout server call failed:", error);
    } finally {
      this._clearAll();
    }
  }

  /**
   * Manually refreshes the JWT token.
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await api.post<{ success: boolean; token: string }>(
        "/auth/refresh"
      );

      if (response.data.success && response.data.token) {
        const isRemembered = !!localStorage.getItem("auth_token");
        this.saveToken(response.data.token, isRemembered);
        return response.data.token;
      }

      throw new Error("No se pudo refrescar el token");
    } catch (error: unknown) {
      logger.error("Token refresh failed:", error);
      await this.logout();
      throw new Error("Sesión expirada");
    }
  }

  // ── Role helpers ────────────────────────────────────────────────────────

  /** Returns true if the user has a valid auth token. */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Returns true if the cached user has a specific role. */
  hasRole(role: UserRole): boolean {
    return this.getUser()?.role === role;
  }

  /** Returns true if the cached user has any of the provided roles. */
  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }

  /** Returns true if the user is an admin. */
  isAdmin(): boolean {
    return this.hasRole("admin");
  }

  /** Returns true if the user is admin or support. */
  hasAdminAccess(): boolean {
    return this.hasAnyRole(["admin", "support"]);
  }
}

export const authService = new AuthService();