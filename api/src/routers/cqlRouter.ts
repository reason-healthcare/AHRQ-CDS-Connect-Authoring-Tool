import express, { RequestHandler } from 'express';
import cqlHandler from '../handlers/cqlHandler.js';

const CQLRouter = express.Router();

// Routes for /authoring/api/cql
CQLRouter.route('/').post(cqlHandler.objToZippedCql as RequestHandler);

CQLRouter.route('/validate').post(cqlHandler.objToELM as RequestHandler);
CQLRouter.route('/viewCql').post(cqlHandler.objToViewableCql as RequestHandler);

export default CQLRouter;

