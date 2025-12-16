import { CQLImporter } from './CQLImporter.js';
import RawCQL from '../utils/RawCQL.js';
import { CQLLibraryGroup } from './CQLLibraryGroup.js';

function importCQL(libraryRawCQL: RawCQL, dependencyRawCQLs: RawCQL[]): CQLLibraryGroup {
  const importer = new CQLImporter();

  return importer.import(libraryRawCQL, dependencyRawCQLs);
}

export default importCQL;
