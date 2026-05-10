import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.resolve(__dirname, "../../src/ml");
const PYTHON_BIN = path.resolve(process.cwd(), ".pythonlibs/bin/python");

export function runPythonScript<T>(
  scriptName: string,
  input: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);
    const proc = spawn(PYTHON_BIN, [scriptPath], {
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        logger.error({ code, stderr, script: scriptName }, "Python script failed");
        try {
          const parsed = JSON.parse(stdout);
          if (parsed.error) {
            reject(new Error(parsed.error));
            return;
          }
        } catch {
          // ignore parse error, use stderr
        }
        reject(new Error(stderr || `Python script exited with code ${code}`));
        return;
      }
      try {
        const result = JSON.parse(stdout) as T;
        if ((result as Record<string, unknown>).error) {
          reject(new Error((result as Record<string, unknown>).error as string));
          return;
        }
        resolve(result);
      } catch (e) {
        logger.error({ stdout, script: scriptName }, "Failed to parse Python output");
        reject(new Error(`Failed to parse Python output: ${stdout.slice(0, 200)}`));
      }
    });

    proc.on("error", (err) => {
      logger.error({ err, script: scriptName }, "Failed to spawn Python process");
      reject(err);
    });

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}
