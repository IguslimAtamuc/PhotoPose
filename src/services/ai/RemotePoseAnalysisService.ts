import { ApiError, type ApiClient } from '@/services/api/ApiClient';
import { AnalysisError, type PoseAnalysisInput, type PoseAnalysisOutput, type PoseAnalysisService } from './PoseAnalysisService';

/**
 * AI HOOK — remote analysis through YOUR backend.
 *
 * Use this to connect OpenAI, Gemini, Claude, Google Vision or a custom
 * model. Never call those APIs directly from the app (API keys would leak);
 * instead implement `POST /analysis` on your server:
 *
 *   multipart/form-data
 *     image:     JPEG photo
 *     pose:      JSON { id, title, framing, figures, instructions }
 *     mirrored:  "true" | "false"
 *     advanced:  "true" | "false"
 *   → 200 JSON PoseAnalysisOutput
 *     { score, similarity, bodyFeedback[], compositionFeedback[], recommendations[], provider }
 *
 * The server can send the photo + reference description to a vision LLM with
 * a structured-output schema matching PoseAnalysisOutput.
 */
export class RemotePoseAnalysisService implements PoseAnalysisService {
  readonly id = 'remote';
  constructor(private api: ApiClient, private path = '/analysis') {}

  async analyze(input: PoseAnalysisInput, signal?: AbortSignal): Promise<PoseAnalysisOutput> {
    const form = new FormData();
    form.append('image', input.image, 'photo.jpg');
    const { id, title, framing, figures, instructions } = input.pose;
    form.append('pose', JSON.stringify({ id, title, framing, figures, instructions }));
    form.append('mirrored', String(input.mirrored));
    form.append('advanced', String(input.advanced));
    try {
      return await this.api.request<PoseAnalysisOutput>(this.path, { method: 'POST', body: form, signal });
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'network' || e.code === 'timeout')) {
        throw new AnalysisError('network', 'Network unavailable. Check your connection and try again.');
      }
      throw new AnalysisError('unknown', 'The analysis service is unavailable right now.');
    }
  }
}
