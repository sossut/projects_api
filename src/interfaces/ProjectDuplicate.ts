/* eslint-disable @typescript-eslint/indent */
import { RowDataPacket } from 'mysql2';

interface ProjectDuplicate {
  id?: number;
  projectDuplicateName: string;
  projectDuplicateKey: string; ////lower(trim(name)) + "|" + lower(trim(city)) + "|" + lower(trim(country))
  projectDuplicateData: string; // JSON stringified project data that was identified as duplicate
  matchedProjectId?: number;
  matchedFirstPassProjectId?: number; // For tracking the original project in a chain of duplicates
  reason?: string; // Reason for marking as duplicate (e.g., "name and location match", "AI identified as duplicate", etc.)
  identifiedAt?: Date;
  similarityScore?: number; // Optional score indicating how similar the duplicate is to the matched project
  status?: 'pending' | 'approved' | 'rejected'; // Status of the duplicate record
  resolvedAt?: Date; // When the duplicate was resolved (approved or rejected)
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
