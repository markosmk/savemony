import * as v from "valibot";

export const updateCellStatusSchema = v.object({
  status: v.picklist(["pending", "completed", "locked"]),
  note: v.optional(v.string()),
});

export const toggleCellSchema = v.object({
  action: v.picklist(["complete", "uncomplete"]),
});
