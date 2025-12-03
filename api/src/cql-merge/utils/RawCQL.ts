class RawCQL {
  content: string;
  path: string;

  constructor(content: string, path?: string) {
    this.content = content;
    this.path = path ?? '';
  }
}

export default RawCQL;
