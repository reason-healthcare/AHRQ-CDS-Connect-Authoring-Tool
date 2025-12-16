import { Request, Response } from 'express';
import FHIRClient from '../vsac/FHIRClient.js';
import auth from 'basic-auth';
import { sendUnauthorized } from './common.js';

function login(req: Request, res: Response): void {
  const user = auth(req);
  if (user == null) {
    sendUnauthorized(res);
    return;
  }

  // Since NLM uses basic auth, try to get one value set with username/password. Success means correct credentials.
  FHIRClient.getOneValueSet(user.name, user.pass)
    .then(() => {
      res.sendStatus(200);
    })
    .catch(error => {
      // If credentials are correct but VS is not found, can still be considered logged in.
      if (error.response?.status === 404) {
        res.sendStatus(200);
      } else {
        res.sendStatus(error.response?.status ?? 500);
      }
    });
}

function getValueSet(req: Request, res: Response): void {
  const user = auth(req);
  if (user == null) {
    sendUnauthorized(res);
    return;
  }
  const id = req.params.id;
  FHIRClient.getValueSet(id, user.name, user.pass)
    .then(t => {
      res.json(t);
    })
    .catch(t => {
      res.sendStatus(t.response?.status ?? 500);
    });
}

function searchForValueSets(req: Request, res: Response): void {
  const user = auth(req);
  if (user == null) {
    sendUnauthorized(res);
    return;
  }
  const keyword = req.query.keyword as string;
  FHIRClient.searchForValueSets(keyword, user.name, user.pass)
    .then(t => {
      res.json(t);
    })
    .catch(t => {
      res.sendStatus(t.response?.status ?? 500);
    });
}

function getCode(req: Request, res: Response): void {
  const user = auth(req);
  if (user == null) {
    sendUnauthorized(res);
    return;
  }
  const code = req.query.code as string;
  const system = req.query.system as string;
  FHIRClient.getCode(code, system, user.name, user.pass)
    .then(t => {
      res.json(t);
    })
    .catch(t => {
      res.sendStatus(t.response?.status ?? 500);
    });
}

export default {
  login,
  getValueSet,
  searchForValueSets,
  getCode
};
