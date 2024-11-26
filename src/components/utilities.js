const capitalise = term => {
  if (term)
    return term.charAt(0).toUpperCase() + term.slice(1);
  return term;
};

export {
  capitalise,
};
