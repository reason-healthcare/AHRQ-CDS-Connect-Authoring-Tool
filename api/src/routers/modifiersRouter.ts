import express, { RequestHandler } from 'express';
import modifiers from '../handlers/modifiersHandler.js';
const ModifiersRouter = express.Router();

// Routes for /authoring/api/modifiers
ModifiersRouter.route('/:artifact').get(modifiers.allGet as RequestHandler);

export default ModifiersRouter;
