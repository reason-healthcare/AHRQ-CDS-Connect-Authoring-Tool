import * as types from 'actions/types';
import reducer, { type ArtifactAction, type ArtifactState } from '../artifacts';
import type { Artifact } from '../../types/artifact';

describe('artifacts reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {} as ArtifactAction)).toEqual({
      artifact: null,
      artifactSaved: true,
      librariesInUse: []
    });
  });

  // ----------------------- UPDATE ARTIFACT ------------------------------- //
  it('should handle updating an artifact', () => {
    const action: ArtifactAction = {
      type: types.UPDATE_ARTIFACT,
      artifact: 'Test artifact' as Artifact,
      librariesInUse: ['MyCQL']
    };
    const newState = { artifact: 'Test artifact' as Artifact, artifactSaved: false, librariesInUse: ['MyCQL'] };
    expect(reducer({} as ArtifactState, action as ArtifactAction)).toEqual(newState);

    const previousState = {
      artifact: 'Old artifact' as Artifact,
      artifactSaved: true,
      librariesInUse: ['MyOldCQL']
    } as ArtifactState;
    expect(reducer(previousState, action as ArtifactAction)).toEqual(newState);
  });

  // ----------------------- SAVE ARTIFACT --------------------------------- //
  it('should handle saving an artifact', () => {
    const action = { type: types.SAVE_ARTIFACT_SUCCESS } as ArtifactAction;
    const newState = { artifactSaved: true };
    expect(reducer({} as ArtifactState, action as ArtifactAction)).toEqual(newState);

    const previousState = { artifactSaved: false } as ArtifactState;
    expect(reducer(previousState, action as ArtifactAction)).toEqual(newState);
  });
});
