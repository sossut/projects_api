/* eslint-disable @typescript-eslint/indent */
import { RowDataPacket } from 'mysql2';

interface ProjectAudit {
  id: number;
  projectId: number;
  searchId?: number | null; // Links to Search if from enrichment
  fieldName: string; // "buildingHeightMeters", "developers", etc.
  oldValue: string | null; // JSON stringified old value
  newValue: string | null; // JSON stringified new value
  changeType: 'manual' | 'automated';
  changedBy?: number | null; // userId if manual
  changedAt: Date;
}

interface GetProjectAudit extends RowDataPacket, ProjectAudit {}
type PostProjectAudit = Omit<ProjectAudit, 'id' | 'changedAt'>;
type PutProjectAudit = Partial<
  Omit<
    ProjectAudit,
    'id' | 'projectId' | 'fieldName' | 'changeType' | 'changedAt'
  >
>;

export { ProjectAudit, GetProjectAudit, PostProjectAudit, PutProjectAudit };
