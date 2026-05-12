import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mlRouter from "./ml";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mlRouter);

export default router;
