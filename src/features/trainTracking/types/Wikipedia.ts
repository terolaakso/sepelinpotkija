export interface WikipediaApiPage {
  parse: Parse;
}

export interface Parse {
  title: string;
  pageid: number;
  text: Text;
}

export interface Text {
  '*': string;
}
