import { getRawFromContext } from '../utils/getRawFromContext.js';
import RawCQL from '../utils/RawCQL.js';

// ANTLR context types - using any since they're from generated JavaScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANTLRContext = any;

class CQLLibrary {
  context: ANTLRContext;
  raw: RawCQL;
  includeNames: Map<string, string>;
  rawExpressions: Map<string, string>;
  rawFunctions: Map<string, string>;
  rawCodesystems: Map<string, string>;
  rawCodes: Map<string, string>;
  rawConcepts: Map<string, string>;
  libraryName: string | undefined;
  statements: ANTLRContext[];

  constructor(context: ANTLRContext, raw: RawCQL) {
    this.context = context;
    this.raw = raw;
    this.includeNames = new Map();
    this.rawExpressions = new Map();
    this.rawFunctions = new Map();
    this.rawCodesystems = new Map();
    this.rawCodes = new Map();
    this.rawConcepts = new Map();

    this.libraryName = context.libraryDefinition()?.qualifiedIdentifier()?.identifier()?.start.text.replace(/"/g, '');

    context
      .definition()
      .map((d: ANTLRContext) => d.includeDefinition())
      .filter((i: ANTLRContext) => i) // Filter out null/undefined results
      .forEach((i: ANTLRContext) => {
        const localIdentifier = i.localIdentifier()?.start.text.replace(/"/g, '');
        // const localIdentifier = i.localIdentifier() || i.localIdentifier()?.start.text.replace(/"/g, '');
        const identifier = i.qualifiedIdentifier()?.identifier()?.start.text.replace(/"/g, '');
        this.includeNames.set(identifier, localIdentifier);
      });

    this.statements = context.statement();
    this.statements
      .map((s: ANTLRContext) => s.expressionDefinition())
      .filter((s: ANTLRContext) => s)
      .forEach((s: ANTLRContext) => this.rawExpressions.set(s.identifier().start.text, getRawFromContext(s)));

    this.statements
      .map((s: ANTLRContext) => s.functionDefinition())
      .filter((s: ANTLRContext) => s)
      .forEach((s: ANTLRContext) => {
        // In grammar-1.5, function name is in children[2] which is IdentifierOrFunctionIdentifierContext
        const funcName = s.children[2]?.identifier()?.start?.text?.replace(/"/g, '');
        if (funcName) {
          this.rawFunctions.set(funcName, getRawFromContext(s));
        }
      });

    context
      .definition()
      .map((d: ANTLRContext) => d.codesystemDefinition())
      .filter((c: ANTLRContext) => c)
      .forEach((c: ANTLRContext) => this.rawCodesystems.set(c.identifier().start.text, getRawFromContext(c)));

    context
      .definition()
      .map((d: ANTLRContext) => d.codeDefinition())
      .filter((c: ANTLRContext) => c)
      .forEach((c: ANTLRContext) => this.rawCodes.set(c.identifier().start.text, getRawFromContext(c)));

    context
      .definition()
      .map((d: ANTLRContext) => d.conceptDefinition())
      .filter((c: ANTLRContext) => c)
      .forEach((c: ANTLRContext) => this.rawConcepts.set(c.identifier().start.text, getRawFromContext(c)));
  }
}

export { CQLLibrary };
