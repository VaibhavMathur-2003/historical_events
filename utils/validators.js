function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function validateLine(fields) {
  const errors = [];

  if (fields.length !== 7) {
    errors.push("Incorrect number of fields");
  }

  const [id, name, start, end, parentId, res_value, desc] = fields;

  if (!isValidUUID(id)) {
    errors.push("Invalid event_id format (must be UUID)");
  }

  if (!name || name.trim().length === 0) {
    errors.push("Event name cannot be empty");
  }

  if (isNaN(Date.parse(start))) {
    errors.push("Invalid start_date format");
  }

  if (isNaN(Date.parse(end))) {
    errors.push("Invalid end_date format");
  }

  if (!isNaN(Date.parse(start)) && !isNaN(Date.parse(end))) {
    if (new Date(end) <= new Date(start)) {
      errors.push("end_date must be after start_date");
    }
  }

  if (parentId !== "NULL" && !isValidUUID(parentId)) {
    errors.push("Invalid parent_id format (must be UUID or NULL)");
  }

  if (res_value && isNaN(parseInt(res_value))) {
    errors.push("research_value must be a number");
  }

  return errors.length > 0 ? errors.join(";      ") : null;
}

module.exports = { validateLine };
