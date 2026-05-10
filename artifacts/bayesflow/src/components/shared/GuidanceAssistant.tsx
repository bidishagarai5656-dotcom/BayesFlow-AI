import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, ChevronRight, CheckCircle2, AlertTriangle, Lightbulb, Zap } from "lucide-react";

interface GuidanceTip {
  type: "step" | "warning" | "tip" | "success";
  text: string;
}

interface StageGuidance {
  headline: string;
  intro: string;
  tips: GuidanceTip[];
  beginnerNote?: string;
}

const STAGE_GUIDANCE: Record<number, StageGuidance> = {
  1: {
    headline: "Select a Dataset",
    intro: "This is where your Machine Learning journey begins. Choose a dataset that the model will learn from.",
    tips: [
      { type: "step", text: "Click any card in 'System Archives' to select a built-in dataset." },
      { type: "step", text: "Or click 'External Uplink' to upload your own CSV file." },
      { type: "tip", text: "Beginners: start with the Iris Dataset — it's small, clean, and perfect for learning." },
      { type: "tip", text: "Your CSV must have column headers in the first row." },
      { type: "warning", text: "After selecting, click 'Next Stage' to load the dataset and continue." },
    ],
    beginnerNote: "A dataset is a table of data — like a spreadsheet. Each row is one observation, and each column is a feature (characteristic). The model learns patterns from these rows.",
  },
  2: {
    headline: "Understand Your Data",
    intro: "Before training, always explore the data. This stage shows you the shape and quality of your dataset.",
    tips: [
      { type: "step", text: "Review the stats table — check column types and missing values." },
      { type: "tip", text: "The bar chart shows how many examples exist per class (target label)." },
      { type: "tip", text: "Balanced classes (equal counts) usually lead to fairer models." },
      { type: "warning", text: "Many missing values? You'll handle those in the next stage (Preprocessing)." },
    ],
    beginnerNote: "This stage is like inspecting your ingredients before cooking. If your data is messy, the model won't learn well — 'garbage in, garbage out'.",
  },
  3: {
    headline: "Clean & Transform Data",
    intro: "Raw data is rarely perfect. Preprocessing makes it clean and ready for the algorithm.",
    tips: [
      { type: "step", text: "Choose a strategy for missing values (Fill Mean is a safe default)." },
      { type: "step", text: "Enable 'Encode Categorical' if your data has text columns." },
      { type: "step", text: "Click 'Initialize Pipeline' to apply the transformations." },
      { type: "tip", text: "StandardScaler (Z-score) works best with Gaussian Naive Bayes." },
      { type: "warning", text: "You must run the pipeline before proceeding to the next stage." },
    ],
    beginnerNote: "Think of preprocessing like washing and chopping vegetables before cooking. Algorithms need numbers — not text — so we encode categories into numbers.",
  },
  4: {
    headline: "Choose Features & Split Data",
    intro: "Tell the model what to predict (target) and what inputs to use (features). Then split into training and test sets.",
    tips: [
      { type: "step", text: "Select the 'Target Variable' — what you want the model to predict." },
      { type: "step", text: "Check the features (input columns) the model should learn from." },
      { type: "step", text: "Use the slider to set the train/test split ratio." },
      { type: "tip", text: "80% train / 20% test is a common starting point." },
      { type: "tip", text: "More training data → better learning; more test data → better evaluation." },
      { type: "warning", text: "Click 'Apply Configuration' to save your choices before moving on." },
    ],
    beginnerNote: "The train set is like your study material, and the test set is the exam. The model studies the training data and is evaluated on the test data — data it's never seen before.",
  },
  5: {
    headline: "Select a Naive Bayes Variant",
    intro: "Three variants of Naive Bayes exist — each works best for a different type of data.",
    tips: [
      { type: "tip", text: "Gaussian NB: best for continuous numbers (measurements, temperatures)." },
      { type: "tip", text: "Multinomial NB: best for word counts and frequency data (text/NLP)." },
      { type: "tip", text: "Bernoulli NB: best for binary (yes/no) features." },
      { type: "success", text: "The 'OPTIMAL' badge shows the system's recommendation based on your data." },
      { type: "step", text: "Click a card to select your model, then click 'Proceed to Training'." },
    ],
    beginnerNote: "Naive Bayes uses probability (Bayes' theorem) to classify data. It's 'naive' because it assumes all features are independent of each other — which is a simplification, but it works surprisingly well!",
  },
  6: {
    headline: "Train the Model",
    intro: "Training is when the model learns statistical patterns from your data.",
    tips: [
      { type: "step", text: "Click 'Initiate Training' to start the learning process." },
      { type: "tip", text: "Watch the logs — they explain what the model is computing." },
      { type: "tip", text: "Higher accuracy on the test set = better generalization." },
      { type: "warning", text: "If test accuracy is much lower than train accuracy, the model may be overfitting." },
      { type: "success", text: "The class probability bars show how balanced the model's priors are." },
    ],
    beginnerNote: "Training a Naive Bayes model means computing the probability of each class (prior) and the probability of each feature given each class (likelihood). This is very fast compared to other ML algorithms!",
  },
  7: {
    headline: "Make Predictions",
    intro: "Now test your model by entering real feature values and seeing what it predicts.",
    tips: [
      { type: "step", text: "Fill in all the input fields with numeric values." },
      { type: "step", text: "Click 'Generate Prediction' to see the result." },
      { type: "tip", text: "Try values close to dataset averages for high-confidence predictions." },
      { type: "tip", text: "The confidence bars show probability for each possible class." },
      { type: "success", text: "All predictions are logged and available in Stage 9 (Analytics)." },
    ],
    beginnerNote: "Prediction applies Bayes' theorem: P(class | features) ∝ P(class) × P(features | class). The class with the highest posterior probability wins!",
  },
  8: {
    headline: "Evaluate Model Performance",
    intro: "Use multiple metrics to understand how well your model generalizes to unseen data.",
    tips: [
      { type: "tip", text: "Accuracy: % of all predictions that were correct." },
      { type: "tip", text: "Precision: of all predicted positive, how many were actually positive." },
      { type: "tip", text: "Recall: of all actual positive, how many did we correctly find." },
      { type: "tip", text: "F1-Score: harmonic mean of precision and recall — best single metric." },
      { type: "tip", text: "Confusion Matrix diagonal = correct predictions; off-diagonal = errors." },
      { type: "warning", text: "A ROC curve closer to the top-left corner means a better model." },
    ],
    beginnerNote: "Accuracy alone can be misleading on imbalanced datasets. F1-Score is more reliable. A confusion matrix reveals exactly which classes the model confuses with each other.",
  },
  9: {
    headline: "Analytics & Export",
    intro: "Review the complete history of predictions and export a full report of your experiment.",
    tips: [
      { type: "step", text: "Review the confidence trend chart — is the model consistently confident?" },
      { type: "step", text: "Check the class distribution pie chart to see what was predicted most." },
      { type: "step", text: "Click 'Export Final Report' to download a JSON summary." },
      { type: "tip", text: "Go back to Stage 7 to make more predictions and enrich the history." },
      { type: "success", text: "Congratulations! You've completed the full Naive Bayes ML workflow." },
    ],
    beginnerNote: "Tracking predictions over time helps you understand model behavior in production. Real ML systems always log predictions for monitoring and debugging.",
  },
};

const tipIcon = {
  step: <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />,
  tip: <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />,
  success: <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />,
};

const tipColor = {
  step: "text-foreground",
  warning: "text-orange-300",
  tip: "text-yellow-300",
  success: "text-green-300",
};

interface GuidanceAssistantProps {
  stage: number;
}

export function GuidanceAssistant({ stage }: GuidanceAssistantProps) {
  const [open, setOpen] = useState(false);
  const guidance = STAGE_GUIDANCE[stage];

  if (!guidance) return null;

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
          open
            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
            : "bg-card border border-primary/40 text-primary hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
        }`}
        title="Open AI Guide"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-[340px] max-h-[70vh] overflow-y-auto rounded-xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/90 backdrop-blur-md px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">AI Guide</p>
                <p className="text-sm font-bold text-foreground">{guidance.headline}</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 flex-1">
              <p className="text-sm text-muted-foreground leading-relaxed">{guidance.intro}</p>

              <div className="space-y-2">
                {guidance.tips.map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex gap-2.5 items-start text-sm"
                  >
                    {tipIcon[tip.type]}
                    <span className={tipColor[tip.type]}>{tip.text}</span>
                  </motion.div>
                ))}
              </div>

              {guidance.beginnerNote && (
                <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Beginner Insight
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {guidance.beginnerNote}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center font-mono">
                Stage {stage} of 9 · Rule-based guidance system
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
