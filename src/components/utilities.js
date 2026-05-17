const capitalise = term => {
  if (term)
    return term.charAt(0).toUpperCase() + term.slice(1);
  return term;
};

const normaliseAlertToStringArray = (value) => {
  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normaliseAlertToStringArray(item));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed !== value) {
        return normaliseAlertToStringArray(parsed);
      }
    } catch (_) {
      // Not a JSON string; use the trimmed value as-is.
    }

    return [trimmed];
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }

  return [];
};

export {
  capitalise,
  normaliseAlertToStringArray,
};
