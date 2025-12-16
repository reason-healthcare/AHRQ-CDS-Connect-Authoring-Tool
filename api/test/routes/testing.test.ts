import request from 'supertest';
import sinon from 'sinon';
import _ from 'lodash';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

import { setupExpressApp, importChaiExpect, Options } from '../utils.js';
import Patient from '../../src/models/patient.js';

const filename = fileURLToPath(import.meta.url);
const dir = dirname(filename);

const patientIncluded = JSON.parse(readFileSync(join(dir, 'fixtures/patient-included.json'), 'utf-8')) as Record<
  string,
  unknown
>;
const patientExcluded = JSON.parse(readFileSync(join(dir, 'fixtures/patient-excluded.json'), 'utf-8')) as Record<
  string,
  unknown
>;

const sandbox = sinon.createSandbox();
const { replace, mock, fake } = sandbox;

describe('Route: /authoring/api/testing', () => {
  let app: express.Application;
  let options: Options;
  let expect: typeof import('chai').expect;

  before(async () => {
    [app, options] = setupExpressApp();
    expect = await importChaiExpect();
  });

  afterEach(() => {
    sandbox.restore();
    options.reset();
  });

  describe('GET', () => {
    it('should return all test patients for authenticated users', done => {
      replace(
        Patient,
        'find',
        mock('find')
          .withArgs({ user: 'bob' })
          .returns({
            exec: fake.resolves([new Patient(patientIncluded), new Patient(patientExcluded)])
          })
      );
      request(app)
        .get('/authoring/api/testing')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).to.have.length(2);
          expect(res.body[0]).to.eql(patientIncluded);
          expect(res.body[1]).to.eql(patientExcluded);
        })
        .end(done);
    });

    it('should return HTTP 500 if there is an error finding test patients', done => {
      replace(
        Patient,
        'find',
        mock('find')
          .withArgs({ user: 'bob' })
          .returns({
            exec: fake.rejects(new Error('Connection Error'))
          })
      );
      request(app).get('/authoring/api/testing').set('Accept', 'application/json').expect(500, done);
    });

    it('should return HTTP 401 for unauthenticated users', done => {
      options.user = null;
      request(app)
        .get('/authoring/api/testing')
        .set('Accept', 'application/json')
        .expect('WWW-Authenticate', 'FormBased')
        .expect(401, done);
    });
  });

  describe('POST', () => {
    it('should create a new test patient for authenticated users', done => {
      replace(
        Patient,
        'create',
        mock('create')
          .withArgs({ user: 'bob', ...patientIncluded })
          .resolves(new Patient({ user: 'bob', ...patientIncluded }))
      );
      request(app)
        .post('/authoring/api/testing')
        .send(patientIncluded)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          expect(res.body).to.eql({ user: 'bob', ...patientIncluded });
        })
        .end(done);
    });

    it('should return HTTP 500 if there is an error creating the test patient', done => {
      replace(
        Patient,
        'create',
        mock('create')
          .withArgs({ user: 'bob', ...patientIncluded })
          .rejects(new Error('Connection Error'))
      );
      request(app)
        .post('/authoring/api/testing')
        .send(patientIncluded)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(500, done);
    });

    it('should return HTTP 401 for unauthenticated users', done => {
      options.user = null;
      request(app)
        .post('/authoring/api/testing')
        .send(patientIncluded)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('WWW-Authenticate', 'FormBased')
        .expect(401, done);
    });
  });

  describe('GET /:patient', () => {
    it('should return a single test patient for authenticated users', done => {
      replace(
        Patient,
        'find',
        mock('find')
          .withArgs({ user: 'bob', _id: '123' })
          .returns({
            exec: fake.resolves([new Patient(patientIncluded)])
          })
      );
      request(app)
        .get('/authoring/api/testing/123')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).to.eql([patientIncluded]);
        })
        .end(done);
    });

    it('should return HTTP 404 if the test patient does not exist', done => {
      replace(
        Patient,
        'find',
        mock('find')
          .withArgs({ user: 'bob', _id: '123' })
          .returns({
            exec: fake.resolves([])
          })
      );
      request(app).get('/authoring/api/testing/123').set('Accept', 'application/json').expect(404, done);
    });

    it('should return HTTP 500 if there is an error finding the test patient', done => {
      replace(
        Patient,
        'find',
        mock('find')
          .withArgs({ user: 'bob', _id: '123' })
          .returns({
            exec: fake.rejects(new Error('Connection Error'))
          })
      );
      request(app).get('/authoring/api/testing/123').set('Accept', 'application/json').expect(500, done);
    });

    it('should return HTTP 401 for unauthenticated users', done => {
      options.user = null;
      request(app)
        .get('/authoring/api/testing/123')
        .set('Accept', 'application/json')
        .expect('WWW-Authenticate', 'FormBased')
        .expect(401, done);
    });
  });

  describe('DELETE /:patient', () => {
    it('should delete a test patient for authenticated users', done => {
      replace(
        Patient,
        'deleteMany',
        mock('deleteMany')
          .withArgs({ user: 'bob', _id: '123' })
          .returns({
            exec: fake.resolves({ n: 1 })
          })
      );
      request(app).delete('/authoring/api/testing/123').expect(200, done);
    });

    it('should return HTTP 404 if the test patient does not exist', done => {
      replace(
        Patient,
        'deleteMany',
        mock('deleteMany')
          .withArgs({ user: 'bob', _id: '123' })
          .returns({
            exec: fake.resolves({ n: 0 })
          })
      );
      request(app).delete('/authoring/api/testing/123').expect(404, done);
    });

    it('should return HTTP 500 if there is an error deleting the test patient', done => {
      replace(
        Patient,
        'deleteMany',
        mock('deleteMany')
          .withArgs({ user: 'bob', _id: '123' })
          .returns({
            exec: fake.rejects(new Error('Connection Error'))
          })
      );
      request(app).delete('/authoring/api/testing/123').expect(500, done);
    });

    it('should return HTTP 401 for unauthenticated users', done => {
      options.user = null;
      request(app)
        .delete('/authoring/api/testing/123')
        .set('Accept', 'application/json')
        .expect('WWW-Authenticate', 'FormBased')
        .expect(401, done);
    });
  });
});
