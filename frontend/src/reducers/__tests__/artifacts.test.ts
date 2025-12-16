import * as types from 'actions/types';
import reducer, { type ArtifactState, type ArtifactAction } from '../artifacts';
import type { Artifact, LibraryInUse } from '../../types/artifact';

interface Action {
  type: string;
  artifact?: Artifact | string;
  librariesInUse?: LibraryInUse[] | string[];
  [key: string]: unknown;
}

const defaultState: ArtifactState = {
  artifact: null,
  artifactSaved: true,
  librariesInUse: []
};

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
    const action: Action = {
      type: types.UPDATE_ARTIFACT,
      artifact: 'Test artifact' as Artifact,
      librariesInUse: [{ name: 'MyCQL' }]
    };
    const newState: ArtifactState = {
      artifact: 'Test artifact' as Artifact,
      artifactSaved: false,
      librariesInUse: [{ name: 'MyCQL' }]
    };
    expect(reducer(undefined, action as ArtifactAction)).toEqual(newState);

    const previousState: ArtifactState = {
      artifact: 'Old artifact' as Artifact,
      artifactSaved: true,
      librariesInUse: [{ name: 'MyOldCQL' }]
    };
    expect(reducer(previousState, action as ArtifactAction)).toEqual(newState);
  });

  // ----------------------- SAVE ARTIFACT --------------------------------- //
  it('should handle saving an artifact', () => {
    const action: Action = { type: types.SAVE_ARTIFACT_SUCCESS };
    const newState: ArtifactState = { ...defaultState, artifactSaved: true };
    expect(reducer(undefined, action as ArtifactAction)).toEqual(newState);

    const previousState: ArtifactState = { ...defaultState, artifactSaved: false };
    expect(reducer(previousState, action as ArtifactAction)).toEqual(newState);
  });
});
