import request from 'supertest';
import passport from 'passport';
import sinon from 'sinon';
import express from 'express';

import { setupExpressApp, importChaiExpect, Options } from '../utils.js';

describe('Route: /authoring/api/auth/login', () => {
  let app: express.Application;
  let options: Options;
  let fakeLogout: sinon.SinonSpy;
  let expect: typeof import('chai').expect;

  before(async () => {
    expect = await importChaiExpect();
  });

  beforeEach(() => {
    fakeLogout = sinon.fake.yields();
    [app, options] = setupExpressApp((app: express.Application) => {
      app.use(async (req, _res, next) => {
        (req as unknown as { logout?: sinon.SinonSpy }).logout = fakeLogout;
        next();
      });
    });
    options.user = null;
  });

  afterEach(() => {
    sinon.restore();
    options.reset();
  });

  describe('POST', () => {
    it('should login users w/ correct credentials', done => {
      const mockAuthInvoker = (req: unknown, _res: unknown, cb: (err?: unknown) => void) => {
        (req as { user?: { uid: string } }).user = { uid: 'bob' };
        cb();
      };
      const mockAuthenticate = sinon.fake.returns(mockAuthInvoker);
      sinon.replace(passport, 'authenticate', mockAuthenticate);
      request(app)
        .post('/authoring/api/auth/login')
        .send({ username: 'bob', password: 'lemoncurd' })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).to.include({ uid: 'bob' });
        })
        .end(done);
    });

    it('should logout an existing user before logging in', done => {
      const mockAuthInvoker = (req: unknown, _res: unknown, cb: (err?: unknown) => void) => {
        (req as { user?: { uid: string } }).user = { uid: 'bob' };
        cb();
      };
      const mockAuthenticate = sinon.fake.returns(mockAuthInvoker);
      sinon.replace(passport, 'authenticate', mockAuthenticate);
      options.user = { uid: 'leroy' };
      request(app)
        .post('/authoring/api/auth/login')
        .send({ username: 'bob', password: 'lemoncurd' })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          sinon.assert.calledOnce(fakeLogout);
          expect(res.body).to.include({ uid: 'bob' });
        })
        .end(done);
    });

    it('should return HTTP 401 for incorrect credentials', done => {
      const mockAuthInvoker = (_req: unknown, _res: unknown, cb: (err?: unknown) => void) => {
        cb('wrong!');
      };
      const mockAuthenticate = sinon.fake.returns(mockAuthInvoker);
      sinon.replace(passport, 'authenticate', mockAuthenticate);
      request(app)
        .post('/authoring/api/auth/login')
        .send({ username: 'bob', password: 'limecurd' })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('WWW-Authenticate', 'FormBased')
        .expect(401, done);
    });

    it('should return HTTP 401 for incorrect credentials after logging out existing user', done => {
      const mockAuthInvoker = (_req: unknown, _res: unknown, cb: (err?: unknown) => void) => {
        cb('wrong!');
      };
      const mockAuthenticate = sinon.fake.returns(mockAuthInvoker);
      sinon.replace(passport, 'authenticate', mockAuthenticate);
      options.user = 'leroy' as unknown as { uid: string };
      request(app)
        .post('/authoring/api/auth/login')
        .send({ username: 'bob', password: 'limecurd' })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('WWW-Authenticate', 'FormBased')
        .expect(401)
        .expect(() => {
          sinon.assert.calledOnce(fakeLogout);
        })
        .end(done);
    });
  });
});

describe('Route: /authoring/api/auth/logout', () => {
  let app: express.Application;
  let options: Options;
  let fakeLogout: sinon.SinonSpy;

  beforeEach(() => {
    fakeLogout = sinon.fake.yields();
    [app, options] = setupExpressApp((app: express.Application) => {
      app.use(async (req, _res, next) => {
        (req as unknown as { logout?: sinon.SinonSpy }).logout = fakeLogout;
        next();
      });
    });
  });

  afterEach(() => {
    sinon.restore();
    options.reset();
  });

  describe('GET', () => {
    it('should logout users', done => {
      request(app)
        .get('/authoring/api/auth/logout')
        .expect(200)
        .expect(() => {
          sinon.assert.calledOnce(fakeLogout);
        })
        .end(done);
    });
  });
});

describe('Route: /authoring/api/auth/user', () => {
  let app: express.Application;
  let options: Options;
  let expect: typeof import('chai').expect;

  before(async () => {
    [app, options] = setupExpressApp();
    expect = await importChaiExpect();
  });

  afterEach(() => {
    sinon.restore();
    options.reset();
  });

  describe('GET', () => {
    it('should get the current user', done => {
      request(app)
        .get('/authoring/api/auth/user')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).to.include({ uid: 'bob' });
        })
        .end(done);
    });

    it('should return HTTP 401 if the user is not logged in', done => {
      options.user = null;
      request(app)
        .get('/authoring/api/auth/user')
        .set('Accept', 'application/json')
        .expect('WWW-Authenticate', 'FormBased')
        .expect(401, done);
    });
  });
});
