import request from 'supertest';
import sinon from 'sinon';
import express from 'express';
import { setupExpressApp, importChaiExpect, Options } from '../utils.js';
import config from '../../src/config.js';

describe('Route: /authoring/api/foresee.js', () => {
  let app: express.Application;
  let options: Options;
  let expect: typeof import('chai').expect;
  let sandbox: sinon.SinonSandbox;

  before(async () => {
    [app, options] = setupExpressApp();
    expect = await importChaiExpect();
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
    options.reset();
  });

  describe('GET', () => {
    it('should get the foresee staging embed script when it is configured', done => {
      const getStub = sandbox.stub(config, 'get');
      getStub.callThrough();
      getStub.withArgs('foreSee.active').returns(true);

      request(app)
        .get('/authoring/api/foresee.js')
        .expect('Content-Type', /javascript/)
        .expect(200)
        .expect(res => {
          expect(res.text).to.match(/ForeSee Staging Embed Script/);
        })
        .end(done);
    });

    it('should not get the foresee staging embed script when it is not configured', done => {
      const getStub = sandbox.stub(config, 'get');
      getStub.callThrough();
      getStub.withArgs('foreSee.active').returns(false);

      request(app)
        .get('/authoring/api/foresee.js')
        .expect('Content-Type', /javascript/)
        .expect(200)
        .expect(res => {
          expect(res.text).to.match(/ForeSee not configured/);
        })
        .end(done);
    });
  });
});
