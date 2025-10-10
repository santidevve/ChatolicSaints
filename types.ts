export interface SaintInfo {
  name: string;
  feastDay: string;
  patronage: string[];
  summary: string;
  biography: string;
  quotes: string[];
  imageUrl?: string;
}

export interface BibleVerse {
  reference: string;
  text: string;
}

export interface ChapterVerse {
  verse: string;
  text: string;
}

export interface BookmarkedVerse {
  reference: string;
  text: string;
  book: string;
  chapter: string;
}

export interface SaintValidation {
  isSaint: boolean;
  reasoning: string;
}

export interface MiracleSource {
  uri: string;
  title: string;
}

export interface EucharisticMiracle {
  summary: string;
  sources: MiracleSource[];
  imageUrl?: string;
}

export interface Chant {
  number: string;
  title: string;
}

export interface ChantDetails {
  title: string;
  lyrics: string;
}

export interface SaintOfTheDay {
  name: string;
  summary: string;
}

export interface GospelReading {
  reference: string;
  text: string;
}
