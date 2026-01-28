/**
 * Auth-related interfaces for type safety
 */

/**
 * Payload structure for JWT tokens used in password recovery
 */
export interface TokenPayload {
  userId: string;
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}

/**
 * Role structure with associated functionalities
 */
export interface RoleWithFunctionalities {
  Functionalities: FunctionalityWithModule[];
}

/**
 * Functionality with its associated module
 */
export interface FunctionalityWithModule {
  module: {
    name: string;
  };
  [key: string]: unknown;
}

/**
 * Grouped functionalities by module for dashboard display
 */
export interface GroupedFunctionality {
  module: string;
  accesses: FunctionalityWithModule[];
}

/**
 * Login/Registration response structure with tokens and user info
 */
export interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  churchId?: string;
  roles?: GroupedFunctionality[];
  workfront?: unknown;
}
