/**
 * Payload structure for JWT tokens used in password recovery
 */
export interface TokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * Action with its enabled state
 */
export interface ActionResponse {
  name: string;
  enabled: boolean;
}

/**
 * Functionality with its associated module and permission details
 */
export interface FunctionalityWithModule {
  route?: string;
  name?: string;
  icon?: string;
  module: {
    _id?: string;
    name: string;
    active: boolean;
    icon?: string;
    route?: string;
    description?: string;
  };
  scope?: string;
  actions?: ActionResponse[];
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
 * Role permission with populated functionality and module
 */
export interface PopulatedPermission {
  scope: string;
  actions: ActionResponse[];
  functionalityId: {
    _id: string;
    name: string;
    route: string;
    icon: string;
    module: {
      _id?: string;
      name: string;
      active: boolean;
      icon?: string;
      route?: string;
      description?: string;
    };
  };
}

/**
 * Login/Registration response structure with tokens and user info
 */
export interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  email?: string;
  churchId?: string;
  roles?: GroupedFunctionality[];
  workfront?: string | null;
  zoneId?: string | null;
}
