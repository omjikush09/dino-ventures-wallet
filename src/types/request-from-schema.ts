import type { Request } from "express";

type QueryObject = Record<string, string | string[] | undefined>;

export type RequestFromSchema<
	S extends { body?: unknown; param?: unknown; query?: unknown },
> = Request<
	NonNullable<S["param"]> extends Record<string, never>
		? Record<string, string>
		: NonNullable<S["param"]>,
	unknown,
	S["body"],
	NonNullable<S["query"]> extends Record<string, never>
		? QueryObject
		: QueryObject & NonNullable<S["query"]>
>;
