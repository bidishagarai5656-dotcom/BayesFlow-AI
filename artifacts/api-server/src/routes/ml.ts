import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, predictionsTable } from "@workspace/db";
import { runPythonScript } from "../lib/python.js";
import {
  UploadDatasetBody,
  LoadBuiltinDatasetBody,
  ExploreDatasetParams,
  PreprocessDatasetParams,
  PreprocessDatasetBody,
  ConfigureFeaturesParams,
  ConfigureFeaturesBody,
  GetModelRecommendationParams,
  TrainModelParams,
  TrainModelBody,
  MakePredictionParams,
  MakePredictionBody,
  EvaluateModelParams,
  GetPredictionHistoryParams,
  GetSessionAnalyticsParams,
  ExportReportParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const BUILTIN_META = [
  {
    name: "iris",
    displayName: "Iris Dataset",
    description: "Classic flower classification: sepal/petal measurements to classify 3 iris species",
    rows: 150,
    columns: 5,
    targetColumn: "species",
    tags: ["classification", "multiclass", "numeric"],
  },
  {
    name: "spam",
    displayName: "Spam Detection Dataset",
    description: "Email spam detection based on word frequencies and character patterns",
    rows: 1000,
    columns: 10,
    targetColumn: "label",
    tags: ["classification", "binary", "text", "NLP"],
  },
  {
    name: "student",
    displayName: "Student Performance Dataset",
    description: "Predict student grade (A/B/C/F) from study habits and background features",
    rows: 395,
    columns: 6,
    targetColumn: "grade",
    tags: ["classification", "multiclass", "education"],
  },
  {
    name: "heart",
    displayName: "Heart Disease Dataset",
    description: "Breast cancer classification using clinical measurements (binary outcome)",
    rows: 569,
    columns: 11,
    targetColumn: "target",
    tags: ["classification", "binary", "medical"],
  },
];

router.get("/ml/datasets/builtin", async (_req, res): Promise<void> => {
  res.json(BUILTIN_META);
});

router.post("/ml/datasets/upload", async (req, res): Promise<void> => {
  const parsed = UploadDatasetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const result = await runPythonScript("load_dataset.py", {
      type: "upload",
      csvContent: parsed.data.csvContent,
      filename: parsed.data.filename,
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Dataset upload failed");
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/ml/datasets/load-builtin", async (req, res): Promise<void> => {
  const parsed = LoadBuiltinDatasetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const valid = ["iris", "spam", "student", "heart"];
  if (!valid.includes(parsed.data.datasetName)) {
    res.status(400).json({ error: `Unknown dataset. Must be one of: ${valid.join(", ")}` });
    return;
  }
  try {
    const result = await runPythonScript("load_dataset.py", {
      type: "builtin",
      datasetName: parsed.data.datasetName,
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Builtin dataset load failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/ml/sessions/:sessionId/explore", async (req, res): Promise<void> => {
  const params = ExploreDatasetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const result = await runPythonScript("explore.py", { sessionId: params.data.sessionId });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Dataset exploration failed");
    res.status(404).json({ error: (err as Error).message });
  }
});

router.post("/ml/sessions/:sessionId/preprocess", async (req, res): Promise<void> => {
  const params = PreprocessDatasetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = PreprocessDatasetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const result = await runPythonScript("preprocess.py", {
      sessionId: params.data.sessionId,
      ...body.data,
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Preprocessing failed");
    res.status(404).json({ error: (err as Error).message });
  }
});

router.post("/ml/sessions/:sessionId/configure", async (req, res): Promise<void> => {
  const params = ConfigureFeaturesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = ConfigureFeaturesBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const result = await runPythonScript("configure.py", {
      sessionId: params.data.sessionId,
      ...body.data,
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Feature configuration failed");
    res.status(404).json({ error: (err as Error).message });
  }
});

router.get("/ml/sessions/:sessionId/model-recommendation", async (req, res): Promise<void> => {
  const params = GetModelRecommendationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const result = await runPythonScript("recommend.py", { sessionId: params.data.sessionId });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Model recommendation failed");
    res.status(404).json({ error: (err as Error).message });
  }
});

router.post("/ml/sessions/:sessionId/train", async (req, res): Promise<void> => {
  const params = TrainModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = TrainModelBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const result = await runPythonScript("train.py", {
      sessionId: params.data.sessionId,
      modelType: body.data.modelType,
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Model training failed");
    res.status(404).json({ error: (err as Error).message });
  }
});

router.post("/ml/sessions/:sessionId/predict", async (req, res): Promise<void> => {
  const params = MakePredictionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = MakePredictionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const result = await runPythonScript<{
      sessionId: string;
      predictedClass: string;
      confidence: number;
      classProbabilities: Array<{ className: string; probability: number }>;
      explanation: string[];
    }>("predict.py", {
      sessionId: params.data.sessionId,
      features: body.data.features,
    });

    await db.insert(predictionsTable).values({
      sessionId: params.data.sessionId,
      predictedClass: result.predictedClass,
      confidence: result.confidence,
      inputFeatures: body.data.features as Record<string, unknown>,
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Prediction failed");
    res.status(404).json({ error: (err as Error).message });
  }
});

router.get("/ml/sessions/:sessionId/evaluate", async (req, res): Promise<void> => {
  const params = EvaluateModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const result = await runPythonScript("evaluate.py", { sessionId: params.data.sessionId });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Evaluation failed");
    res.status(404).json({ error: (err as Error).message });
  }
});

router.get("/ml/sessions/:sessionId/history", async (req, res): Promise<void> => {
  const params = GetPredictionHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const records = await db
      .select()
      .from(predictionsTable)
      .where(eq(predictionsTable.sessionId, params.data.sessionId))
      .orderBy(desc(predictionsTable.timestamp));

    const result = records.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      predictedClass: r.predictedClass,
      confidence: r.confidence,
      inputFeatures: r.inputFeatures,
      timestamp: r.timestamp.toISOString(),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Prediction history fetch failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/ml/sessions/:sessionId/analytics", async (req, res): Promise<void> => {
  const params = GetSessionAnalyticsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const records = await db
      .select()
      .from(predictionsTable)
      .where(eq(predictionsTable.sessionId, params.data.sessionId))
      .orderBy(predictionsTable.timestamp);

    if (records.length === 0) {
      res.json({
        totalPredictions: 0,
        avgConfidence: 0,
        classCounts: {},
        confidenceTrend: [],
        topClass: "",
      });
      return;
    }

    const totalPredictions = records.length;
    const avgConfidence = records.reduce((sum, r) => sum + r.confidence, 0) / records.length;

    const classCounts: Record<string, number> = {};
    for (const r of records) {
      classCounts[r.predictedClass] = (classCounts[r.predictedClass] || 0) + 1;
    }

    const topClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

    const confidenceTrend = records.map((r, idx) => ({
      index: idx + 1,
      confidence: r.confidence,
      predictedClass: r.predictedClass,
    }));

    res.json({
      totalPredictions,
      avgConfidence,
      classCounts,
      confidenceTrend,
      topClass,
    });
  } catch (err) {
    req.log.error({ err }, "Analytics fetch failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/ml/sessions/:sessionId/export", async (req, res): Promise<void> => {
  const params = ExportReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const records = await db
      .select()
      .from(predictionsTable)
      .where(eq(predictionsTable.sessionId, params.data.sessionId))
      .orderBy(desc(predictionsTable.timestamp));

    const mapped = records.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      predictedClass: r.predictedClass,
      confidence: r.confidence,
      inputFeatures: r.inputFeatures,
      timestamp: r.timestamp.toISOString(),
    }));

    const avgConf = records.length > 0
      ? records.reduce((s, r) => s + r.confidence, 0) / records.length
      : 0;

    res.json({
      sessionId: params.data.sessionId,
      datasetName: "BayesFlow Session",
      modelType: "naive_bayes",
      accuracy: avgConf,
      totalPredictions: records.length,
      generatedAt: new Date().toISOString(),
      summary: `Session ${params.data.sessionId} — ${records.length} predictions made with avg confidence ${(avgConf * 100).toFixed(1)}%`,
      predictions: mapped,
    });
  } catch (err) {
    req.log.error({ err }, "Export report failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
