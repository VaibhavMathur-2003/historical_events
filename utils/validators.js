function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function validateLine(fields) {
  if (fields.length !== 7) return "Incorrect number of fields";

  const [id, name, start, end, parentId, res_value, desc] = fields;

  if (!isValidUUID(id)) return "Invalid event_id format (must be UUID)";
  if (!name || name.trim().length === 0) return "Event name cannot be empty";
  if (isNaN(Date.parse((start)))) return "Invalid start_date format";
  if (isNaN(Date.parse((end)))) return "Invalid end_date format";

  if (new Date(end) <= new Date(start))
    return "end_date must be after start_date";

  if (parentId !== "NULL" && !isValidUUID(parentId))
    return "Invalid parent_id format (must be UUID or NULL)";

  if (res_value && isNaN(parseInt(res_value)))
    return "research_value must be a number";

  return null;
}

module.exports = { validateLine };
