import * as fs from 'fs';
import * as path from 'path';
import { RunnerAdapter, JudgeAdapter, RawProviderOutput } from '../providers/types';

export class ManualCalibrationNamespace {
  private runner: RunnerAdapter;
  private judge: JudgeAdapter;

  constructor(runner: RunnerAdapter, judge: JudgeAdapter) {
    this.runner = runner;
    this.judge = judge;
  }

  private writeCalibrationDump(filename: string, data: any): string {
    const dirPath = path.join(process.cwd(), 'artifacts', 'manual');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return filePath;
  }

  async calibrateRunner(
    draftPrompt: string, 
    questionText: string
  ): Promise<{ filePath: string; output: RawProviderOutput }> {
    const runId = `calib-runner-${Date.now()}`;
    const context = {
      runId,
      workspaceId: 'manual-calibration-workspace',
      probeQuestionId: 'calib-question-id',
      lane: 'manual_calibration' as const,
      mode: 'cb_strict' as const
    };

    const res = await this.runner.executeStrictRun(draftPrompt, questionText, context);
    const filePath = this.writeCalibrationDump(`${runId}.json`, {
      draftPrompt,
      questionText,
      result: res
    });

    return { filePath, output: res.raw };
  }

  async calibrateJudge(
    draftRubric: string, 
    draftExpectedLayer: string, 
    sampleRunnerOutput: string
  ): Promise<{ filePath: string; output: RawProviderOutput }> {
    const runId = `calib-judge-${Date.now()}`;
    const context = {
      runId,
      workspaceId: 'manual-calibration-workspace',
      probeQuestionId: 'calib-question-id',
      lane: 'manual_calibration' as const,
      mode: 'cb_strict' as const
    };

    const res = await this.judge.evaluateRunnerOutput(
      draftRubric,
      draftExpectedLayer,
      sampleRunnerOutput,
      context
    );
    const filePath = this.writeCalibrationDump(`${runId}.json`, {
      draftRubric,
      draftExpectedLayer,
      sampleRunnerOutput,
      result: res
    });

    return { filePath, output: res.raw };
  }
}
