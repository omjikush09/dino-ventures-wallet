import { Request, RequestHandler } from "express";
import { z } from "zod";

const requestSchema = z.object({
	body: z.unknown().optional(),
	param: z.unknown().optional(),
	params: z.unknown().optional(),
	query: z.unknown().optional(),
	header: z.unknown().optional(),
});

type CompositeRequestSchema = z.ZodType<z.infer<typeof requestSchema>>;

function setRequestValue<K extends keyof Request>(
	req: Request,
	key: K,
	value: Request[K],
): void {
	Object.defineProperty(req, key, {
		value,
		writable: true,
		configurable: true,
		enumerable: true,
	});
}

/**
 * Validates and normalizes request body/params/query via one composite schema.
 * Schema shape: { body?: ..., param?: ..., query?: ..., header?: ... }.
 */
export function validate(schema: CompositeRequestSchema): RequestHandler {
	return (req, _res, next) => {
		try {
			const parsed = schema.parse({
				body: req.body,
				param: req.params,
				params: req.params,
				query: req.query,
				header: req.headers,
			}) as z.infer<typeof requestSchema>;

			if (Object.prototype.hasOwnProperty.call(parsed, "body")) {
				setRequestValue(req, "body", parsed.body);
			}
			if (Object.prototype.hasOwnProperty.call(parsed, "param")) {
				setRequestValue(req, "params", parsed.param as Request["params"]);
			} else if (Object.prototype.hasOwnProperty.call(parsed, "params")) {
				setRequestValue(req, "params", parsed.params as Request["params"]);
			}
			if (Object.prototype.hasOwnProperty.call(parsed, "query")) {
				setRequestValue(req, "query", parsed.query as Request["query"]);
			}
			next();
		} catch (error) {
			next(error);
		}
	};
}
