import { Router } from "express";
import {
	copyPlan,
	getDayDatabase,
	getLogs,
	getPlans,
	getSummary,
	saveDayDatabase,
	saveLog,
	savePlan,
} from "../controllers/habitController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/plans", getPlans);
router.put("/plans/:weekday", savePlan);
router.post("/plans/copy", copyPlan);
router.get("/logs", getLogs);
router.put("/logs/:date", saveLog);
router.get("/summary", getSummary);
router.get("/database/:date", getDayDatabase);
router.put("/database/:date", saveDayDatabase);

export default router;
