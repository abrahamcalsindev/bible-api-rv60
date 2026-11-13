import HttpError from "~/utils/httpError";

export const requireParam = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new HttpError(400, `Missing route parameter: ${name}`);
  }

  return value;
};
