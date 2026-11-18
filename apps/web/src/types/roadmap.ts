export type RoadmapType = 'exam' | 'skill';
export interface RoadmapTopic {
  id: string;
  title: string;
  description: string;
  hours: number;
  prerequisites: string[];
  resourceIds: string[];
}
export interface RoadmapStage {
  id: string;
  title: string;
  description: string;
  topics: RoadmapTopic[];
}
export interface Roadmap {
  id?: string;
  type: RoadmapType;
  slug: string;
  title: string;
  overview: string;
  stages: RoadmapStage[];
}
