import { Router } from "express";
import { validate } from "../middleware/validate";
import {
	createUserRequestSchema,
	listUsersRequestSchema,
	getUserByIdRequestSchema,
} from "../schemas/user.schema";
import * as userController from "../controllers/user.controller";

const router: Router = Router();

router.post("/", validate(createUserRequestSchema), userController.createUser);
router.get("/", validate(listUsersRequestSchema), userController.getUsers);
router.get("/:id", validate(getUserByIdRequestSchema), userController.getUserById);

export default router;
