import express, { RequestHandler } from 'express';
import settings from '../handlers/userSettingsHandler.js';

const UserSettingsRouter = express.Router();

// Routes for /authoring/api/settings
UserSettingsRouter.route('/')
  .get(settings.get as RequestHandler)
  .put(settings.put as RequestHandler);

export default UserSettingsRouter;
