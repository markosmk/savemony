import type * as v from "valibot";

export function simplifyValibotErrors(errors: v.BaseIssue<unknown>[]) {
  return errors.map((err) => {
    // El path puede ser anidado, tomamos el último key
    const lastPath = err.path?.[err.path.length - 1];
    const key = lastPath?.type === "object" ? lastPath.key : "field";

    return {
      key,
      message: err.message,
    };
  });
}
