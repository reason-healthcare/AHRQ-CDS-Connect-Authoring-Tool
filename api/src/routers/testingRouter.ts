import express, { RequestHandler } from 'express';
import testing from '../handlers/testingHandler.js';

const TestingRouter = express.Router();

// Routes for /authoring/api/testing
TestingRouter.route('/')
  .get(testing.allGet as RequestHandler)
  .post(testing.singlePost as RequestHandler);

// Routes for /authoring/api/testing/:patient
TestingRouter.route('/:patient')
  .get(testing.singleGet as RequestHandler)
  .delete(testing.singleDelete as RequestHandler);

export default TestingRouter;
