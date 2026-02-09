import { promisePool } from '../../database/db';
import { PostProjectAudit } from '../../interfaces/ProjectAudit';
import { ResultSetHeader } from 'mysql2';

const postProjectAudit = async (audit: PostProjectAudit): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO project_audits (project_id, search_id, field_name, old_value, new_value, change_type, changed_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      audit.projectId,
      audit.searchId ?? null,
      audit.fieldName,
      audit.oldValue,
      audit.newValue,
      audit.changeType,
      audit.changedBy ?? null
    ]
  );
  return headers.insertId;
};

export { postProjectAudit };