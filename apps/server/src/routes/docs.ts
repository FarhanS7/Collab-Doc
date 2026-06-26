import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import * as docs from '../controllers/docs.controller.js';

const router = Router();

// All routes in this file are already behind requireAuth (applied in index.ts)

// Document CRUD
router.post('/', docs.createDocument);                               // C.2
router.get('/', docs.listDocuments);                                 // C.3
router.get('/:id', docs.getDocument);                               // C.4
router.patch('/:id', requireRole('owner'), docs.updateDocument);    // C.5 — owner only
router.delete('/:id', requireRole('owner'), docs.deleteDocument);   // C.6 — owner only

// Member management
router.post('/:id/members', requireRole('owner'), docs.addMember);               // C.7
router.delete('/:id/members/:userId', requireRole('owner'), docs.removeMember); // C.8

const docsRouter: Router = router;
export { docsRouter };
