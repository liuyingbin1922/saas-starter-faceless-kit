const SUNO_API_BASE_URL = 'https://api.sunoapi.org/api/v1';

export interface SunoGenerateRequest {
  customMode: boolean;
  prompt?: string;
  style?: string;
  title?: string;
  model?: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5';
  instrumental?: boolean;
  callBackUrl?: string;
  personaId?: string;
  negativeTags?: string;
  vocalGender?: 'm' | 'f';
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface SunoTaskStatusData {
  id: string;
  audio_url?: string;
  image_url?: string;
  title?: string;
  duration?: number;
  lyrics?: string;
  status?: string;
}

export interface SunoTaskStatus {
  code: number;
  msg: string;
  data: {
    callbackType?: string;
    task_id?: string;
    data?: SunoTaskStatusData[];
    status?: string;
    progress?: number;
  };
}

export class SunoClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SUNO_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('SUNO_API_KEY is not set');
    }
  }

  async generateSong(request: SunoGenerateRequest): Promise<SunoGenerateResponse> {
    const response = await fetch(`${SUNO_API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (result.code !== 200) {
      throw new Error(`Suno API error: ${result.msg || 'Unknown error'}`);
    }

    return result;
  }

  async getTaskStatus(taskId: string): Promise<SunoTaskStatus> {
    const response = await fetch(`${SUNO_API_BASE_URL}/generate/record-info?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.code !== 200) {
      throw new Error(`Suno API error: ${result.msg || 'Unknown error'}`);
    }

    return result;
  }
}

