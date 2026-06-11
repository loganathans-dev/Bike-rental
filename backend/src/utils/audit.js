import AuditLog from '../models/AuditLog.js';

export async function writeAudit({ action, entityType, entityId, user, details = {} }) {
  try {
    await AuditLog.create({
      action,
      entity_type: entityType,
      entity_id: entityId?.toString?.() || String(entityId || ''),
      user_id: user?.id || '',
      user_role: user?.role || '',
      details,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}
