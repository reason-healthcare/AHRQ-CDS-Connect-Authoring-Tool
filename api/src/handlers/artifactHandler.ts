import { Response } from 'express';
import { default as Artifact } from '../models/artifact.js';
import { default as CQLLibrary } from '../models/cqlLibrary.js';
import { AuthenticatedRequest, sendUnauthorized } from './common.js';

export default {
  allGet,
  singleGet,
  singlePost,
  singlePut,
  singleDelete,
  duplicate
};

// Get all artifacts
async function allGet(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    try {
      const artifacts = await Artifact.find({ user: req.user.uid }).exec();
      res.json(artifacts);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

// Get a single artifact
async function singleGet(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    const id = req.params.artifact;
    try {
      const artifact = await Artifact.find({ user: req.user.uid, _id: id }).exec();
      artifact.length === 0 ? res.sendStatus(404) : res.json(artifact);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

// Post a single artifact
async function singlePost(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    const newArtifact = req.body;
    newArtifact.user = req.user.uid;
    try {
      const response = await Artifact.create(newArtifact);
      res.status(201).json(response);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

// Update a single artifact
async function singlePut(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    const id = req.body._id;
    const artifact = req.body;
    try {
      const response = await Artifact.updateOne({ user: req.user.uid, _id: id }, { $set: artifact }).exec();
      // Support both old (n) and new (matchedCount) Mongoose API
      const matched =
        (response as { n?: number; matchedCount?: number }).n ??
        (response as { matchedCount: number }).matchedCount ??
        0;
      matched === 0 ? res.sendStatus(404) : res.sendStatus(200);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

// Delete a single artifact
async function singleDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    const id = req.params.artifact;
    try {
      const response = await Artifact.deleteMany({ user: req.user.uid, _id: id }).exec();
      // Support both old (n) and new (deletedCount) Mongoose API
      const deleted =
        (response as { n?: number; deletedCount?: number }).n ??
        (response as { deletedCount: number }).deletedCount ??
        0;
      if (deleted === 0) {
        res.sendStatus(404);
      } else {
        await CQLLibrary.deleteMany({ user: req.user.uid, linkedArtifactId: id }).exec();
        res.sendStatus(200);
      }
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

function prepareDuplicateArtifact(
  artifact: Record<string, unknown>,
  artifactNames: Array<{ name: string }>
): Record<string, unknown> {
  let artifactCopy: Record<string, unknown>;
  if (artifactNames.find(a => a.name === 'Copy of ' + (artifact.name as string))) {
    let version = 1;
    let currentName: string;

    do {
      version += 1;
      currentName = 'Copy of ' + (artifact.name as string) + ` (${version.toString()})`;
    } while (artifactNames.find(a => a.name === currentName));

    artifactCopy = { ...artifact, name: currentName };
  } else {
    artifactCopy = { ...artifact, name: 'Copy of ' + (artifact.name as string) };
  }

  delete artifactCopy['updatedAt'];
  delete artifactCopy['createdAt'];
  delete artifactCopy['_id'];
  return artifactCopy;
}

async function duplicate(req: AuthenticatedRequest, res: Response, _next: unknown): Promise<void> {
  if (req.user) {
    let artifactNames;
    try {
      artifactNames = await Artifact.find({ user: req.user.uid }).exec();
      const parentID = req.params.artifact;
      const artifact = await Artifact.findById(parentID).exec();
      // Handle both null (real Mongoose) and empty array (test mock)
      if (!artifact || (Array.isArray(artifact) && artifact.length === 0)) {
        res.sendStatus(404);
      } else {
        const artifactNamesArray = artifactNames.map(a => ({ name: a.name || '' }));
        const { documentToPlainObject } = await import('../utils/mongooseHelpers.js');
        const duplicateToInsert = prepareDuplicateArtifact(documentToPlainObject(artifact), artifactNamesArray);

        const duplicateResponse = await Artifact.create(duplicateToInsert);
        const library = await CQLLibrary.find({ linkedArtifactId: parentID }).exec();
        if (library.length !== 0) {
          const promises = library.map(lib => {
            const libObj = documentToPlainObject(lib);
            const newLib: Record<string, unknown> = {
              ...libObj,
              linkedArtifactId: duplicateResponse._id
            };
            delete newLib['createdAt'];
            delete newLib['updatedAt'];
            delete newLib['_id'];
            return CQLLibrary.create(newLib);
          });
          await Promise.all(promises);
        }
        res.status(200).json(duplicateResponse);
      }
    } catch (err) {
      res.status(500).send(err);
      return;
    }
  } else sendUnauthorized(res);
}
