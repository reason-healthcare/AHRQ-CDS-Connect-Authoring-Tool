import { CQLExporter } from './CQLExporter.js';
import { CQLLibraryGroup } from '../import/CQLLibraryGroup.js';

function exportCQL(libraryGroup: CQLLibraryGroup): string {
  const exporter = new CQLExporter();
  return exporter.export(libraryGroup);
}

export default exportCQL;
