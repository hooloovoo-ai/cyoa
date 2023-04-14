export interface Suggestion {
  text: string,
  summary: string
}

export interface AudioInformation {
  url: string,
  duration: number
}

export interface History {
  text: string,
  lines: string[],
  suggestions: Suggestion[],
  revealDuration: number | undefined,
  didReveal: boolean,
  editing: boolean,
  chosenSuggestion: number | undefined,
  audio: AudioInformation | undefined,
  images: string[] | undefined
}

export interface InitialPrompt {
  title: string,
  genre: string,
  text: string
}

export interface Story {
  title: string,
  id: string,
  lastEdited?: number,
  data: History[]
}