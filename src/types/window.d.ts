interface Window {
  find(
    searchString: string,
    caseSensitive?: boolean,
    backwards?: boolean,
    wrapAround?: boolean,
    wholeWord?: boolean,
    searchInFrames?: boolean,
    showDialog?: boolean
  ): boolean;
}

interface FirstMatch {
  element: HTMLSpanElement;
  range: Range;
}