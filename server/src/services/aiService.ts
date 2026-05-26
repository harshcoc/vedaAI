import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { env } from '../config/env';
import { QuestionTypeConfig, ISection } from '../types';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// JSON schema for Gemini structured output
const paperSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          instruction: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                questionNumber: { type: SchemaType.INTEGER },
                text: { type: SchemaType.STRING },
                type: { type: SchemaType.STRING },
                difficulty: { type: SchemaType.STRING },
                marks: { type: SchemaType.INTEGER },
                options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['questionNumber', 'text', 'type', 'difficulty', 'marks', 'options'],
            },
          },
        },
        required: ['title', 'instruction', 'questions'],
      },
    },
    metadata: {
      type: SchemaType.OBJECT,
      properties: {
        subject: { type: SchemaType.STRING },
        totalMarks: { type: SchemaType.INTEGER },
        totalQuestions: { type: SchemaType.INTEGER },
        duration: { type: SchemaType.STRING },
      },
      required: ['subject', 'totalMarks', 'totalQuestions', 'duration'],
    },
  },
  required: ['sections', 'metadata'],
};

interface GeneratePaperParams {
  fileContent: string;
  questionTypes: QuestionTypeConfig[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions: string;
}

interface GeneratedPaperResponse {
  sections: ISection[];
  metadata: {
    subject: string;
    totalMarks: number;
    totalQuestions: number;
    duration: string;
  };
}

function buildPrompt(params: GeneratePaperParams): string {
  const { fileContent, questionTypes, totalQuestions, totalMarks, additionalInstructions } = params;

  const questionTypeDetails = questionTypes
    .map((qt) => `- ${qt.type}: ${qt.count} questions, ${qt.marksPerQuestion} marks each`)
    .join('\n');

  return `You are an expert academic assessment creator. Generate a well-structured question paper.

## Study Material
${fileContent.slice(0, 15000)}

## Requirements
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}

### Question Types
${questionTypeDetails}

### Difficulty: ~30% easy, ~50% moderate, ~20% hard

### Structure
- Organize into sections (Section A, B, C...)
- Group questions by type per section
- Number questions sequentially
- MCQ: 4 options. True/False: ["True","False"]. Others: empty options []

${additionalInstructions ? `### Additional Instructions\n${additionalInstructions}` : ''}

### Quality: Clear, unambiguous, covering different topics. Test understanding, not just recall.

You MUST respond with ONLY valid JSON matching this schema:
{
  "sections": [{"title":"...","instruction":"...","questions":[{"questionNumber":1,"text":"...","type":"MCQ","difficulty":"easy","marks":1,"options":["a","b","c","d"]}]}],
  "metadata": {"subject":"...","totalMarks":${totalMarks},"totalQuestions":${totalQuestions},"duration":"2 hours"}
}`;
}

// ─── Gemini Models ───
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'];

// ─── OpenRouter Models (fallback) ───
const OPENROUTER_MODELS = ['google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free'];
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Main entry: tries Gemini, then OpenRouter
 */
export async function generateQuestionPaper(
  params: GeneratePaperParams
): Promise<GeneratedPaperResponse> {
  const prompt = buildPrompt(params);
  console.log('🤖 Prompt length:', prompt.length, 'chars');

  // 1. Try Gemini models
  for (const modelName of GEMINI_MODELS) {
    console.log(`\n🤖 Trying Gemini: ${modelName}`);
    try {
      return await callGemini(modelName, prompt);
    } catch (err: any) {
      const msg = err.message?.substring(0, 150) || '';
      console.warn(`⚠️ ${modelName} failed:`, msg);
      if (msg.includes('API_KEY_INVALID') || msg.includes('expired') || msg.includes('suspended')) {
        break; // Don't retry other Gemini models for auth issues
      }
      if (msg.includes('429') || msg.includes('quota')) {
        await sleep(2000);
      }
    }
  }

  // 2. Fallback to OpenRouter
  if (env.OPENROUTER_API_KEY) {
    console.log('\n🔄 All Gemini models failed. Falling back to OpenRouter...');
    for (const model of OPENROUTER_MODELS) {
      console.log(`\n🤖 Trying OpenRouter: ${model}`);
      try {
        return await callOpenRouter(model, prompt);
      } catch (err: any) {
        console.warn(`⚠️ ${model} failed:`, err.message?.substring(0, 150));
        if (err.message?.includes('429')) {
          await sleep(3000);
        }
      }
    }
  }

  throw new Error('All AI providers failed. Please try again in a minute.');
}

// ─── Gemini Call ───
async function callGemini(modelName: string, prompt: string): Promise<GeneratedPaperResponse> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: paperSchema as any,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log('🤖 Gemini response:', text.length, 'chars');

  const parsed: GeneratedPaperResponse = JSON.parse(text);
  validateAndFix(parsed);

  const totalQ = parsed.sections.reduce((s, sec) => s + sec.questions.length, 0);
  console.log(`✅ Gemini ${modelName}: ${parsed.sections.length} sections, ${totalQ} questions`);
  return parsed;
}

// ─── OpenRouter Call ───
async function callOpenRouter(model: string, prompt: string): Promise<GeneratedPaperResponse> {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.CLIENT_URL,
      'X-Title': 'VedaAI Assessment Creator',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are an expert assessment creator. Respond with ONLY valid JSON, no markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  const data = await response.json() as any;

  if (data.error) {
    throw new Error(`OpenRouter: ${data.error.message || JSON.stringify(data.error)}`);
  }

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('OpenRouter: empty response');
  }

  let content = data.choices[0].message.content.trim();
  console.log('🤖 OpenRouter response:', content.length, 'chars');

  // Strip markdown fences
  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  // Extract JSON
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start !== -1 && end > start) {
    content = content.substring(start, end + 1);
  }

  const parsed: GeneratedPaperResponse = JSON.parse(content);
  validateAndFix(parsed);

  const totalQ = parsed.sections.reduce((s, sec) => s + sec.questions.length, 0);
  console.log(`✅ OpenRouter ${model}: ${parsed.sections.length} sections, ${totalQ} questions`);
  return parsed;
}

// ─── Helpers ───
function validateAndFix(parsed: GeneratedPaperResponse): void {
  if (!parsed.sections?.length) throw new Error('No sections in response');
  if (!parsed.metadata) {
    parsed.metadata = { subject: 'General', totalMarks: 0, totalQuestions: 0, duration: '2 hours' };
  }
  for (const section of parsed.sections) {
    for (const q of section.questions) {
      if (!q.options) q.options = [];
      if (!q.difficulty) q.difficulty = 'moderate';
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
