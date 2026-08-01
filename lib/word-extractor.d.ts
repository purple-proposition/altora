declare module 'word-extractor' {
  export default class WordExtractor {
    extract(input: Buffer | string): Promise<{
      getBody(): string;
      getFootnotes(): string;
      getHeaders(): string;
      getFooters(): string;
      getEndnotes(): string;
      getAnnotations(): string;
      getTextboxes(): string;
    }>;
  }
}
