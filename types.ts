
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
}
