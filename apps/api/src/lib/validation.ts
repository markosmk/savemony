import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";

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

// biome-ignore lint/suspicious/noExplicitAny: <explanation >
export async function validateBody(c: Context, schema: v.BaseSchema<any, any, any>) {
  const body = await c.req.json();
  const parsed = v.safeParse(schema, body);
  if (!parsed.success)
    throw new HTTPException(400, {
      message: "Datos inválidos",
      cause: simplifyValibotErrors(parsed.issues), //parsed.issues
    });

  return parsed.output;
}
