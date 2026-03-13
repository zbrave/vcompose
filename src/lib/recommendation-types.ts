import type { PortMapping, VolumeMapping } from '../store/types';

export interface RecommendationDefault {
  image: string;
  ports?: PortMapping[];
  volumes?: VolumeMapping[];
  environment?: Record<string, string>;
}

export interface Recommendation {
  key: string;
  image: string;
  reason: string;
  alreadyExists: boolean;
}

export interface RecommendationGraphEntry {
  recommends: string[];
  reasons: Record<string, string>;
}

export type RecommendationGraph = Record<string, RecommendationGraphEntry>;
