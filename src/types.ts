export interface Suggestion {
  text: string,
  summary: string
}

export interface History {
  text: string,
  lines: string[],
  suggestions: Suggestion[],
  narrationDuration: number | undefined,
  narrationURL: string | undefined,
  didReveal: boolean,
}

export interface InitialPrompt {
  title: string,
  genre: string,
  text: string
}