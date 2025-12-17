import _ from 'lodash';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';

import * as actions from '../artifacts';
import * as types from '../types';
import { mockArtifact } from 'mocks/artifacts';

describe('artifact actions', () => {
  afterAll(() => nock.restore());

  // ----------------------- UPDATE ARTIFACT ------------------------------- //
  describe('update artifact', () => {
    it('should create an action to update an artifact', () => {
      const artifactToUpdate = mockArtifact;
      const props = { id: 2 } as Partial<typeof mockArtifact>;
      const artifact = { ...mockArtifact, id: 2 };
      const librariesInUse: unknown[] = [];

      const expectedAction = {
        type: types.UPDATE_ARTIFACT,
        artifact,
        librariesInUse
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dispatch = actions.updateArtifact(artifactToUpdate, props) as any;
      dispatch((response: any) => {
        expect(response).toEqual(expectedAction);
      });
    });

    it('should create an action to load an artifact', () => {
      const artifactToUpdate = mockArtifact;
      const artifact = { ...mockArtifact };
      const librariesInUse: unknown[] = [];

      const expectedAction = { type: types.LOAD_ARTIFACT, artifact, librariesInUse };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dispatch = actions.loadArtifact(artifactToUpdate) as any;
      return dispatch((response: any) => {
        expect(response).toEqual(expectedAction);
      });
    });
  });

  // ----------------------- SAVE ARTIFACT --------------------------------- //
  describe('save artifact', () => {
    it('should create an action saying the artifact was saved', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockArtifactWithoutId = _.cloneDeep(mockArtifact) as any;
      mockArtifactWithoutId._id = null;

      nock('http://localhost').post('/authoring/api/artifacts').reply(200, mockArtifactWithoutId);

      const expectedAction = { type: types.SAVE_ARTIFACT_SUCCESS, artifact: mockArtifactWithoutId };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dispatch = actions.artifactSaved(mockArtifactWithoutId) as any;
      dispatch((response: any) => {
        expect(response).toEqual(expectedAction);
      });
    });
  });
});
