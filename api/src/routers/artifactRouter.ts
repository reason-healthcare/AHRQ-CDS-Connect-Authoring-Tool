import express, { RequestHandler } from 'express';
import artifact from '../handlers/artifactHandler.js';
const ArtifactRouter = express.Router();

// Routes for /authoring/api/artifacts
ArtifactRouter.route('/')
  .get(artifact.allGet as RequestHandler)
  .post(artifact.singlePost as RequestHandler)
  .put(artifact.singlePut as RequestHandler);

// Routes for /authoring/api/artifacts/:artifact
ArtifactRouter.route('/:artifact')
  .get(artifact.singleGet as RequestHandler)
  .delete(artifact.singleDelete as RequestHandler);

// Route for /authoring/api/artifacts/:artifact/duplicate
ArtifactRouter.route('/:artifact/duplicate').post(artifact.duplicate as RequestHandler);

export default ArtifactRouter;
