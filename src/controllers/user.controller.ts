import { Response } from "express";
import * as userService from "../services/user.service";
import type { RequestFromSchema } from "../types/request-from-schema";
import type {
	CreateUserRequestSchema,
	ListUsersRequestSchema,
	GetUserByIdRequestSchema,
} from "../schemas/user.schema";

export async function createUser(
	req: RequestFromSchema<CreateUserRequestSchema>,
	res: Response,
): Promise<void> {
	const user = await userService.createUser(req.body);
	res.status(201).json({ success: true, data: user });
}

export async function getUsers(
	req: RequestFromSchema<ListUsersRequestSchema>,
	res: Response,
): Promise<void> {
	const { limit, offset } = req.query;
	const result = await userService.getUsersPaginated(limit, offset);
	res.json({ success: true, data: result.users, pagination: result.pagination });
}

export async function getUserById(
	req: RequestFromSchema<GetUserByIdRequestSchema>,
	res: Response,
): Promise<void> {
	const user = await userService.getUserById(req.params.id);
	res.json({ success: true, data: user });
}
