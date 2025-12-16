import { InputStream, CommonTokenStream } from 'antlr4';
// ANTLR-generated files remain JavaScript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cqlVisitor from './grammar-1.5/cqlVisitor.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cqlLexer from './grammar-1.5/cqlLexer.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cqlParser from './grammar-1.5/cqlParser.js';
import { CQLLibrary } from './CQLLibrary.js';
import { CQLLibraryGroup } from './CQLLibraryGroup.js';
import RawCQL from '../utils/RawCQL.js';

// ANTLR visitor type - using any since it's from generated JavaScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class CQLImporter extends (cqlVisitor as any) {
  constructor() {
    super();
  }

  import(libraryRawCQL: RawCQL, dependencyRawCQLs: RawCQL[]): CQLLibraryGroup {
    const library = new CQLLibrary(this.parseLibrary(libraryRawCQL.content), libraryRawCQL);
    const dependencies = dependencyRawCQLs.map(rawCQL => {
      return new CQLLibrary(this.parseLibrary(rawCQL.content), rawCQL);
    });
    return new CQLLibraryGroup(library, dependencies);
  }

  // NOTE: Since the ANTLR parser/lexer is JS (not typescript), we need to use some ts-ignore here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parseLibrary(input: string): any {
    const chars = new InputStream(input);
    const lexer = new cqlLexer(chars);
    // @ts-ignore
    lexer.removeErrorListeners();
    // @ts-ignore
    const tokens = new CommonTokenStream(lexer);
    const parser = new cqlParser(tokens);
    // @ts-ignore
    parser.removeErrorListeners();
    // @ts-ignore
    parser.buildParseTrees = true;
    // @ts-ignore
    return parser.library();
  }
}

export { CQLImporter };
