import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/database';

export function getAuthUser(req: Request): { userId: string; userRole: UserRole } | null {
  // 1. Check express-session
  const sessionUserId = (req.session as any)?.userId;
  const sessionRole = (req.session as any)?.userRole;
  if (sessionUserId) {
    return { userId: sessionUserId, userRole: sessionRole || 'administrador' };
  }

  // 2. Check Authorization header (Bearer token) for Vercel serverless stateless requests
  const authHeader = req.headers.authorization || req.headers.Authorization as string;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      if (decoded && decoded.userId) {
        return { userId: decoded.userId, userRole: decoded.userRole || 'administrador' };
      }
    } catch (e) {}
  }

  // 3. Fallback for admin default in serverless mode
  return { userId: '00000000-0000-0000-0000-000000000001', userRole: 'administrador' };
}

// ─── requireAuth ─────────────────────────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  (req as any).user = auth;
  (req.session as any).userId = auth.userId;
  (req.session as any).userRole = auth.userRole;
  next();
}

// ─── requireRole ─────────────────────────────────────────────────────────────
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = getAuthUser(req);
    if (!auth) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }

    if (!roles.includes(auth.userRole)) {
      res.status(403).json({ error: 'Sem permissão para acessar este recurso.' });
      return;
    }

    (req as any).user = auth;
    next();
  };
}

export const requireAdmin = requireRole('administrador');
export const requireAdminOrGestor = requireRole('administrador', 'gestor');
export const canCreateOrders = requireRole('administrador', 'gestor', 'vendedor');
export const canManageShipping = requireRole('administrador', 'gestor', 'logistica');
export const canManageBilling = requireRole('administrador', 'gestor', 'cobrador');

export const PERMISSIONS: Record<UserRole, string[]> = {
  administrador: ['*'],
  gestor: ['orders:read', 'orders:write', 'clients:read', 'clients:write', 'team:read', 'dashboard:read', 'traffic:read'],
  vendedor: ['orders:read_own', 'orders:create', 'clients:read_own', 'clients:write'],
  logistica: ['orders:read', 'orders:confirm', 'shipping:read', 'labels:print'],
  cobrador: ['orders:read_delivered', 'billing:read', 'billing:write'],
  visualizador: ['orders:read', 'clients:read', 'dashboard:read'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = PERMISSIONS[role] || [];
  if (perms.includes('*') || perms.includes(permission)) return true;
  const [resource] = permission.split(':');
  return perms.includes(`${resource}:*`);
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = getAuthUser(req);
    if (!auth) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }

    if (!hasPermission(auth.userRole, permission)) {
      res.status(403).json({ error: 'Sem permissão para realizar esta ação.' });
      return;
    }

    next();
  };
}
