import { CQLLibrary } from './CQLLibrary.js';

class CQLLibraryGroup {
  library: CQLLibrary;
  dependencies: CQLLibrary[];

  constructor(library: CQLLibrary, dependencies: CQLLibrary[]) {
    this.library = library;
    this.dependencies = dependencies;
  }

  getDependencyNames(): string[] {
    return this.dependencies.map(d => d.libraryName).filter((name) => name !== undefined);
  }
}

export { CQLLibraryGroup };
