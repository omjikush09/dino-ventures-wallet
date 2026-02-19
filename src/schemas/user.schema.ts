import { z } from "zod";
import { paginationQuerySchema } from "./pagination.schema";


export const createUserSchema = z.object({
	email: z.string().email("Must be a valid email"),
	name: z.string().min(1, "Name is required"),
	type: z.enum(["USER", "SYSTEM"]).optional(),
	isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const userIdParamsSchema = z.object({
	id: z.uuid(),
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>;

const emptyObjectSchema = z.object({});

export const createUserRequestSchema = z.object({
	body: createUserSchema,
	param: emptyObjectSchema.optional(),
	query: emptyObjectSchema.optional(),
});
export type CreateUserRequestSchema = z.infer<typeof createUserRequestSchema>;

export const listUsersRequestSchema = z.object({
	body: emptyObjectSchema.optional(),
	param: emptyObjectSchema.optional(),
	query: paginationQuerySchema,
});
export type ListUsersRequestSchema = z.infer<typeof listUsersRequestSchema>;

export const getUserByIdRequestSchema = z.object({
	body: emptyObjectSchema.optional(),
	param: userIdParamsSchema,
	query: emptyObjectSchema.optional(),
});
export type GetUserByIdRequestSchema = z.infer<typeof getUserByIdRequestSchema>;
