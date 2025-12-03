import { Request, Response } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    [key: string]: unknown;
  };
}

function sendUnauthorized(res: Response): Response {
  // A 401 should always be accompanied by a WWW-Authenticate header. There is no standard value
  // for form-based authentication, but it seems that many people have converged on "FormBased".
  res.setHeader('WWW-Authenticate', 'FormBased');
  return res.sendStatus(401);
}

export { sendUnauthorized };
