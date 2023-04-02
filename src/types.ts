export interface Suggestion {
  text: string,
  summary: string
}

export interface History {
  text: string,
  lines: string[],
  suggestions: Suggestion[]
}