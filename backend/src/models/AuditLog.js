import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, default: '' },
    user_id: { type: String, default: '' },
    user_role: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'audit_logs',
  }
);

export default mongoose.model('AuditLog', auditLogSchema);
