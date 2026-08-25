import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/database';

// ─── requireAuth ─────────────────────────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = (req.session as any).userId;

  if (!userId) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  next();
}

// ─── requireRole ─────────────────────────────────────────────────────────────
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req.session as any).userId;
    const userRole = (req.session as any).userRole as UserRole;

    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }

    if (!roles.includes(userRole)) {
      res.status(403).json({ error: 'Sem permissão para acessar este recurso.' });
      return;
    }

    next();
  };
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
export const requireAdmin = requireRole('administrador');

// ─── requireAdminOrGestor ────────────────────────────────────────────────────
export const requireAdminOrGestor = requireRole('administrador', 'gestor');

// ─── canCreateOrders ─────────────────────────────────────────────────────────
export const canCreateOrders = requireRole('administrador', 'gestor', 'vendedor');

// ─── canManageShipping ────────────────────────────────────────────────────────
export const canManageShipping = requireRole('administrador', 'gestor', 'logistica');

// ─── canManageBilling ─────────────────────────────────────────────────────────
export const canManageBilling = requireRole('administrador', 'gestor', 'cobrador');

// ─── Permission matrix ───────────────────────────────────────────────────────
export const PERMISSIONS: Record<UserRole, string[]> = {
  administrador: ['*'],
  gestor: [
    'orders:read', 'orders:write', 'orders:update_status',
    'clients:read', 'clients:write',
    'team:read', 'team:write',
    'dashboard:read',
    'traffic:read', 'traffic:write',
    'reports:read',
  ],
  vendedor: [
    'orders:read_own', 'orders:create',
    'clients:read_own', 'clients:write',
    'dashboard:read_limited',
  ],
  logistica: [
    'orders:read', 'orders:confirm', 'orders:update_status',
    'shipping:read', 'shipping:write',
    'labels:print',
    'tracking:read',
  ],
  cobrador: [
    'orders:read_delivered',
    'billing:read', 'billing:write',
    'payments:read', 'payments:write',
    'agreements:read', 'agreements:write',
  ],
  visualizador: [
    'orders:read',
    'clients:read',
    'dashboard:read',
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = PERMISSIONS[role] || [];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;

  // Check wildcard patterns
  const [resource] = permission.split(':');
  return perms.includes(`${resource}:*`);
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req.session as any).userId;
    const userRole = (req.session as any).userRole as UserRole;

    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }

    if (!hasPermission(userRole, permission)) {
      res.status(403).json({ error: 'Sem permissão para realizar esta ação.' });
      return;
    }

    next();
  };
}
