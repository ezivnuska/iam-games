// app/lib/api/with-auth.ts

import { requireAuth, type SessionUser } from '@/app/lib/utils/auth';

export type AuthenticatedHandler<T = any> = (
  request: Request,
  context: T,
  user: SessionUser
) => Promise<Response>;

export function withAuth<T = any>(
  handler: AuthenticatedHandler<T>
): (request: Request, context: T) => Promise<Response> {
  return async (request: Request, context: T): Promise<Response> => {
    try {
      const user = await requireAuth();
      return await handler(request, context, user);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Unauthorized') {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.error('[withAuth] Error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
