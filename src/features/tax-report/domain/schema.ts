import { z } from "zod";

// Manual head-amount edits must be finite numbers >= 0 (V21). Inputs arrive
// as strings from <Input type="number">, so coerce before validating.
export const headAmountSchema = z.coerce.number().min(0);

export const taxHeadEditSchema = z.object({
	head_code: z.string(),
	amount: z.coerce.number().min(0),
});

export type TaxHeadEdit = z.infer<typeof taxHeadEditSchema>;
