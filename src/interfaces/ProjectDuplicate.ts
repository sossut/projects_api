/* eslint-disable @typescript-eslint/indent */
import { RowDataPacket } from 'mysql2';

interface ProjectDuplicate {
  id: number;
  duplicateProjectName: string;
  duplicateProjectKey: string; ////lower(trim(name)) + "|" + lower(trim(city)) + "|" + lower(trim(country))
  matchedProjectId?: number;
  matchedFirstPassProjectId?: number; // For tracking the original project in a chain of duplicates
  newProjectData: string; // JSON stringified project data that was identified as duplicate
  reason?: string; // Reason for marking as duplicate (e.g., "name and location match", "AI identified as duplicate", etc.)
  identifiedAt: Date;
  similarityScore?: number; // Optional score indicating how similar the duplicate is to the matched project
  status: 'pending' | 'confirmed' | 'rejected'; // Status of the duplicate record
  resolvedAt?: Date; // When the duplicate was resolved (confirmed or rejected)
  resolvedBy?: number; // userId of the person who resolved the duplicate
}

interface GetProjectDuplicate extends RowDataPacket, ProjectDuplicate {}

type PostProjectDuplicate = Omit<
  ProjectDuplicate,
  'id' | 'identifiedAt' | 'status'
>;

type PutProjectDuplicate = Partial<
  Omit<ProjectDuplicate, 'id' | 'identifiedAt'>
>;

export {
  ProjectDuplicate,
  GetProjectDuplicate,
  PostProjectDuplicate,
  PutProjectDuplicate
};
