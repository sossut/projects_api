import CustomError from '../classes/CustomError';

const toSnake = (obj: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const snake = k.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
};

const toCamel = (obj: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const camel = k.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
    out[camel] = v;
  }
  return out;
};

const throwIfValidationErrors = (errors: any) => {
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((error: any) => {
        if (error.type === 'field') {
          return `${error.msg}: ${error.path}`;
        }
      })
      .join(', ');

    throw new CustomError(messages, 400);
  }
};

export { toSnake, toCamel, throwIfValidationErrors };
