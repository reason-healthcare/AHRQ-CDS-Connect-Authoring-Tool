# Dependency Notes

Where possible, dependencies are frequently updated to their latest versions.
In some cases, however, this is not feasible or does not provide sufficient
return on the necessary investment to do a major version upgrade. The following
dependencies are currently fixed to older versions:

- **antlr4**: ANTLR4 versions after 4.8.0 generate code that uses ESM style imports instead of Common JS requires statements. Since the JavaScript runtime must match the version of ANTLR4 used to generate the classes, we cannot upgrade the antlr4 JavaScript runtime module past version 4.8.0.

## Dependency Upgrades

| Dependency | Current Version | Prior Version | Notes |
|------------|----------------|---------------|-------|
| Express.js | 5.1.0 | 4.21.2 | [Express 5.x Migration Guide](https://expressjs.com/en/guide/migrating-5.html) - Modified wildcard routes |
| Helmet | 8.1.0 | 7.1.0 | [Helmet 8.x Migration Guide](https://github.com/helmetjs/helmet/blob/main/CHANGELOG.md) |
| Mocha | 11.7.1 | 10.7.0 | [Mocha 11.x Breaking Changes](https://github.com/mochajs/mocha/blob/master/CHANGELOG.md) |
| Sinon | 21.0.0 | 18.0.0 | [Sinon 21.x Breaking Changes](https://github.com/sinonjs/sinon/blob/master/CHANGELOG.md) |
| Nock | 14.0.9 | 13.5.4 | [Nock 14.x Breaking Changes](https://github.com/nock/nock/blob/main/CHANGELOG.md) |
| migrate-mongo | 12.1.3 | 11.0.0 | [migrate-mongo 12.x Breaking Changes](https://github.com/seppevs/migrate-mongo/blob/master/CHANGELOG.md) |
| slug | 11.0.0 | 9.1.0 | [slug 11.x Breaking Changes](https://github.com/dodo/node-slug/blob/master/CHANGELOG.md) - Fixed ESM import issue by using `require('slug').default`. |
| rewire | 9.0.0 | 7.0.0 | [rewire 9.x Breaking Changes](https://github.com/jhnns/rewire/blob/master/CHANGELOG.md) |

