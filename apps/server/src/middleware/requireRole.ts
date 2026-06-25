import { prisma } from '../lib/prisma.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';
import type { Request, Response, NextFunction } from 'express';

type Role = 'owner' | 'editor' | 'viewer';

/**
 * requireRole — Express middleware factory
 *
 * Verifies that req.user is a member of the document (:id) with AT LEAST
 * the specified minimum role. Must be applied AFTER requireAuth.
 *
 * Role hierarchy: owner > editor > viewer
 *
 * Usage:
 *   router.delete('/:id', requireAuth, requireRole('owner'), asyncHandler(deleteDoc));
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  owner: 2,
};

export function requireRole(minimumRole: Role) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      next(new ForbiddenError());
      return;
    }

    // Check document exists and is not soft-deleted
    const document = await prisma.document.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!document) {
      next(new NotFoundError('Document'));
      return;
    }

    // Check user's membership and role
    const membership = await prisma.documentMember.findUnique({
      where: { userId_documentId: { userId, documentId: id } },
      select: { role: true },
    });

    if (!membership) {
      next(new ForbiddenError('You are not a member of this document'));
      return;
    }

    const userRoleLevel = ROLE_HIERARCHY[membership.role as Role] ?? -1;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userRoleLevel < requiredLevel) {
      next(new ForbiddenError(`This action requires the '${minimumRole}' role`));
      return;
    }

    next();
  };
}
