// ANTLR context type - using any since it's from generated JavaScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRawFromContext(ctx: any): string {
  return ctx.start.getInputStream().getText(ctx.start.start, ctx.stop.stop);
}

export { getRawFromContext };
