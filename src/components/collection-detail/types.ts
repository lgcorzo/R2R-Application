import {
  CollectionResponse,
  CommunityResponse,
  DocumentResponse,
  EntityResponse,
  RelationshipResponse,
  User,
} from 'r2r-js/dist/types';

export interface CollectionStats {
  documents: number;
  users: number;
  entities: number;
  relationships: number;
  communities: number;
}

export interface CollectionDetailData {
  collection: CollectionResponse | null;
  documents: DocumentResponse[];
  users: User[];
  entities: EntityResponse[];
  relationships: RelationshipResponse[];
  communities: CommunityResponse[];
}

export interface DeleteItemPayload {
  id: string;
  type: 'document' | 'user' | 'entity' | 'relationship' | 'community';
}

export type TabValue =
  | 'overview'
  | 'documents'
  | 'users'
  | 'entities'
  | 'relationships'
  | 'communities'
  | 'knowledgeGraph'
  | 'explore';
