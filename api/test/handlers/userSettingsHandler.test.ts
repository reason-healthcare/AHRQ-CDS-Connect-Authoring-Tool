import sinon from 'sinon';
import { importChaiExpect } from '../utils.js';
import UserSettingsHandler from '../../src/handlers/userSettingsHandler.js';
import UserSettings from '../../src/models/userSettings.js';

const sandbox = sinon.createSandbox();
const { replace, fake } = sandbox;

interface FakeResponse {
  store: { headers: Record<string, string>; body?: unknown; statusCode?: number };
  sent: { headers: Record<string, string>; body?: unknown; statusCode?: number };
  json(json: unknown): FakeResponse;
  send(body?: unknown): FakeResponse;
  sendStatus(status: number): FakeResponse;
  setHeader(name: string, value: string): FakeResponse;
  status(status: number): FakeResponse;
}

class FakeResponse {
  store: { headers: Record<string, string>; body?: unknown; statusCode?: number };
  sent: { headers: Record<string, string>; body?: unknown; statusCode?: number };

  constructor() {
    this.store = { headers: {} };
    this.sent = {};
  }

  json(json: unknown): FakeResponse {
    return this.send(json);
  }

  send(body?: unknown): FakeResponse {
    if (body != null) {
      this.store.body = body;
    }
    if (this.store.statusCode == null) {
      this.store.statusCode = 200;
    }
    this.sent = Object.assign({}, this.store);
    return this;
  }

  sendStatus(status: number): FakeResponse {
    this.store.statusCode = status;
    return this.send();
  }

  setHeader(name: string, value: string): FakeResponse {
    this.store.headers[name] = value;
    return this;
  }

  status(status: number): FakeResponse {
    this.store.statusCode = status;
    return this;
  }
}

describe('userSettingsHandler', () => {
  let expect: typeof import('chai').expect;

  before(async () => {
    expect = await importChaiExpect();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#get', () => {
    it('should return settings for authenticated users with settings', async () => {
      replace(
        UserSettings,
        'find',
        sandbox
          .stub()
          .withArgs({ user: 'bob' })
          .returns({
            exec: fake.resolves([{ user: 'bob', termsAcceptedDate: '2023-04-05' }])
          })
      );
      const req = { user: { uid: 'bob' } };
      const res = new FakeResponse();
      await UserSettingsHandler.get(req as never, res as never);
      expect(res.sent.statusCode).to.eq(200);
      expect(res.sent.body).to.eql({ termsAcceptedDate: '2023-04-05' });
    });

    it('should return HTTP 500 if there is an error finding', async () => {
      replace(
        UserSettings,
        'find',
        sandbox.stub().withArgs({ user: 'bob' }).returns({
          exec: fake.rejects(new Error('Connection Error'))
        })
      );
      const req = { user: { uid: 'bob' } };
      const res = new FakeResponse();
      await UserSettingsHandler.get(req as never, res as never);
      expect(res.sent.statusCode).to.eq(500);
      expect((res.sent.body as Error).message).to.eq('Connection Error');
    });

    it('should return HTTP 404 for authenticated users without settings', async () => {
      replace(
        UserSettings,
        'find',
        sandbox.stub().withArgs({ user: 'bob' }).returns({
          exec: fake.resolves([])
        })
      );
      const req = { user: { uid: 'bob' } };
      const res = new FakeResponse();
      await UserSettingsHandler.get(req as never, res as never);
      expect(res.sent.statusCode).to.eq(404);
    });

    it('should return HTTP 500 for authenticated users with multiple settings', async () => {
      replace(
        UserSettings,
        'find',
        sandbox.stub().withArgs({ user: 'bob' }).returns({
          exec: fake.resolves([
            { user: 'bob', termsAcceptedDate: '2023-04-05' },
            { user: 'bob', termsAcceptedDate: '2023-06-01' }
          ])
        })
      );
      const req = { user: { uid: 'bob' } };
      const res = new FakeResponse();
      await UserSettingsHandler.get(req as never, res as never);
      expect(res.sent.statusCode).to.eq(500);
    });

    it('should return HTTP 401 for unauthenticated users', async () => {
      const req = {};
      const res = new FakeResponse();
      await UserSettingsHandler.get(req as never, res as never);
      expect(res.sent.statusCode).to.eq(401);
      expect(res.sent.headers['WWW-Authenticate']).to.eql('FormBased');
    });
  });

  describe('#put', () => {
    it('should upsert settings for authenticated users', async () => {
      replace(
        UserSettings,
        'findOneAndUpdate',
        sandbox
          .stub()
          .withArgs({ user: 'bob' }, { $set: { termsAcceptedDate: '2023-04-05' } }, { upsert: true, new: true })
          .returns({
            exec: fake.resolves({ user: 'bob', termsAcceptedDate: '2023-04-05' })
          })
      );
      const req = { user: { uid: 'bob' }, body: { termsAcceptedDate: '2023-04-05' } };
      const res = new FakeResponse();
      await UserSettingsHandler.put(req as never, res as never);
      expect(res.sent.statusCode).to.eq(200);
      expect(res.sent.body).to.eql({ termsAcceptedDate: '2023-04-05' });
    });

    it('should return HTTP 500 if there is an error upserting', async () => {
      replace(
        UserSettings,
        'findOneAndUpdate',
        sandbox
          .stub()
          .withArgs({ user: 'bob' }, { $set: { termsAcceptedDate: '2023-04-05' } }, { upsert: true, new: true })
          .returns({
            exec: fake.rejects(new Error('Connection Error'))
          })
      );
      const req = { user: { uid: 'bob' }, body: { termsAcceptedDate: '2023-04-05' } };
      const res = new FakeResponse();
      await UserSettingsHandler.put(req as never, res as never);
      expect(res.sent.statusCode).to.eq(500);
      expect((res.sent.body as Error).message).to.eq('Connection Error');
    });

    it('should return HTTP 401 for unauthenticated users', async () => {
      const req = {};
      const res = new FakeResponse();
      await UserSettingsHandler.put(req as never, res as never);
      expect(res.sent.statusCode).to.eq(401);
      expect(res.sent.headers['WWW-Authenticate']).to.eql('FormBased');
    });
  });
});

