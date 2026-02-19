import prisma from "../lib/prisma";
import { AppError, UserNotFoundError } from "../lib/errors";
import type { CreateUserInput } from "../schemas/user.schema";

export async function createUser(input: CreateUserInput) {
	const existing = await prisma.user.findUnique({
		where: { email: input.email },
		select: { id: true },
	});

	if (existing) {
		throw new AppError(
			`User with email '${input.email}' already exists`,
			409,
			"USER_EMAIL_EXISTS",
		);
	}

	return prisma.user.create({
		data: {
			email: input.email,
			name: input.name,
			type: input.type ?? "USER",
			isActive: input.isActive ?? true,
		},
	});
}

export async function getUsers() {
	return prisma.user.findMany({
		orderBy: { createdAt: "desc" },
		take: 20,
		skip: 0,
	});
}

export async function getUsersPaginated(limit: number, offset: number) {
	const [users, total] = await Promise.all([
		prisma.user.findMany({
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: offset,
		}),
		prisma.user.count(),
	]);

	return {
		users,
		pagination: {
			total,
			limit,
			offset,
			hasMore: offset + limit < total,
		},
	};
}

export async function getUserById(id: string) {
	const user = await prisma.user.findUnique({ where: { id } });
	if (!user) throw new UserNotFoundError(id);
	return user;
}
