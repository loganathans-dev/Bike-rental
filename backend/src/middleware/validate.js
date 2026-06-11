export function validateBody(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      if (value === undefined || value === null || value === '') continue;
      if (rule.type === 'number' && Number.isNaN(Number(value))) {
        errors.push(`${field} must be a number`);
      }
      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
      }
      if (rule.min != null && Number(value) < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`);
      }
      if (rule.max != null && Number(value) > rule.max) {
        errors.push(`${field} must be at most ${rule.max}`);
      }
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
      }
    }
    if (errors.length) {
      return res.status(400).json({ error: errors.join('; ') });
    }
    next();
  };
}
