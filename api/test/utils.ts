import express from 'express';
import routes from '../src/routes.js';

export class Options {
  user!: { uid: string } | null;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.user = { uid: 'bob' };
  }
}

function setupExpressApp(...configurers: Array<(app: express.Application) => void>): [express.Application, Options] {
  const options = new Options();
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(async (req, _res, next) => {
    if (options.user) {
      (req as { user?: { uid: string } }).user = options.user;
    }
    next();
  });
  for (const configurer of configurers) {
    configurer(app);
  }
  routes(app);
  return [app, options];
}

async function importChaiExpect(): Promise<typeof import('chai').expect> {
  // Chai dynamic import. See: https://github.com/chaijs/chai/issues/1561#issuecomment-1933171936
  const chai = await import('chai');
  const chaiExclude = await import('chai-exclude');
  chai.use(chaiExclude.default);
  return chai.expect;
}

export { setupExpressApp, importChaiExpect };
