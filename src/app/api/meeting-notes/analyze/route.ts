import OpenAI from "openai";

import {
  buildMeetingNotesPrompt,
  MEETING_NOTES_MAX_LENGTH,
  MEETING_NOTES_RESPONSE_SCHEMA,
} from "@/lib/meeting-notes/build-prompt";
import {
  isOpenAIConfigured,
  normalizeAnalyzeResponse,
} from "@/lib/meeting-notes/normalize-response";
import type {
  MeetingNotesAnalyzeRequest,
  MeetingNotesAnalyzeResponse,
} from "@/types/meeting-notes";

export async function POST(request: Request): Promise<Response> {
  if (!isOpenAIConfigured()) {
    return Response.json(
      { error: "OPENAI_API_KEY が設定されていません。管理者に環境変数の設定を依頼してください。" },
      { status: 503 },
    );
  }

  let body: MeetingNotesAnalyzeRequest;

  try {
    body = (await request.json()) as MeetingNotesAnalyzeRequest;
  } catch {
    return Response.json({ error: "リクエスト形式が正しくありません。" }, { status: 400 });
  }

  const notesText = body.notesText?.trim() ?? "";

  if (!notesText) {
    return Response.json({ error: "議事録テキストを入力してください。" }, { status: 400 });
  }

  if (notesText.length > MEETING_NOTES_MAX_LENGTH) {
    return Response.json(
      { error: `議事録は ${MEETING_NOTES_MAX_LENGTH.toLocaleString()} 文字以内にしてください。` },
      { status: 400 },
    );
  }

  const wbsContext = Array.isArray(body.wbsContext) ? body.wbsContext : [];
  const { system, user } = buildMeetingNotesPrompt({
    notesText,
    meetingTitle: body.meetingTitle?.trim(),
    meetingDate: body.meetingDate?.trim(),
    wbsContext,
  });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meeting_notes_wbs_proposals",
          strict: true,
          schema: MEETING_NOTES_RESPONSE_SCHEMA,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return Response.json({ error: "AI から応答を取得できませんでした。" }, { status: 502 });
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      return Response.json({ error: "AI 応答の解析に失敗しました。" }, { status: 502 });
    }

    const normalized = normalizeAnalyzeResponse(parsed);
    const response: MeetingNotesAnalyzeResponse = {
      summary: normalized.summary,
      proposals: normalized.proposals,
      taskProposals: normalized.taskProposals,
    };

    return Response.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 解析中にエラーが発生しました。";

    return Response.json({ error: message }, { status: 502 });
  }
}
