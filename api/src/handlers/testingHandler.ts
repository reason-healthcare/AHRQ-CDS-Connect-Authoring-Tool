import { Response } from 'express';
import Patient from '../models/patient.js';
import { AuthenticatedRequest, sendUnauthorized } from './common.js';

export default {
  allGet,
  singleGet,
  singlePost,
  singleDelete
};

// Get all patients
async function allGet(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    try {
      const patients = await Patient.find({ user: req.user.uid }).exec();
      res.json(patients);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

// Get a single patient
async function singleGet(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    const id = req.params.patient;
    try {
      const patient = await Patient.find({ user: req.user.uid, _id: id }).exec();
      patient.length === 0 ? res.sendStatus(404) : res.json(patient);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

// Post a single patient
async function singlePost(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    const newPatient = req.body;
    newPatient.user = req.user.uid;
    try {
      const response = await Patient.create(newPatient);
      res.status(201).json(response);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

// Delete a single patient
async function singleDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    const id = req.params.patient;
    try {
      const response = await Patient.deleteMany({ user: req.user.uid, _id: id }).exec();
      // Support both old (n) and new (deletedCount) Mongoose API
      const deleted =
        (response as { n?: number; deletedCount?: number }).n ??
        (response as { deletedCount: number }).deletedCount ??
        0;
      deleted === 0 ? res.sendStatus(404) : res.sendStatus(200);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}
