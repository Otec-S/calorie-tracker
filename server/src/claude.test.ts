import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { formatDietContext, toApiContent, toFriendlyError, trimChatHistory, type DayEntry } from "./claude.js";
import type { ChatMessage } from "./types.js";

function entry(over: Partial<DayEntry> = {}): DayEntry {
  return {
    title: "Овсянка",
    items: "овсянка, молоко",
    portion: "250 г",
    cal_min: 300,
    cal_max: 350,
    protein_g: 10,
    fat_g: 8,
    carbs_g: 50,
    note: "",
    ...over,
  };
}

describe("formatDietContext", () => {
  it("lists days oldest first regardless of key order", () => {
    const context = formatDietContext(
      {
        "2026-07-28": [entry({ title: "Обед" })],
        "2026-07-26": [entry({ title: "Завтрак" })],
        "2026-07-27": [entry({ title: "Ужин" })],
      },
      0,
    );

    expect(context.indexOf("2026-07-26")).toBeLessThan(context.indexOf("2026-07-27"));
    expect(context.indexOf("2026-07-27")).toBeLessThan(context.indexOf("2026-07-28"));
  });

  it("marks a day with no entries explicitly", () => {
    expect(formatDietContext({ "2026-07-28": [] }, 0)).toContain("2026-07-28: ничего не съедено");
  });

  it("collapses a dish's range when both bounds match", () => {
    const context = formatDietContext({ "2026-07-28": [entry({ cal_min: 300, cal_max: 300 })] }, 0);
    // Only the per-dish line collapses; the day total below it stays a range.
    expect(context).toContain("- Овсянка: 300 ккал");
    expect(context).not.toContain("Овсянка: 300–300");
  });

  it("keeps a dish's range when the bounds differ", () => {
    expect(formatDietContext({ "2026-07-28": [entry()] }, 0)).toContain("- Овсянка: 300–350 ккал");
  });

  it("prefixes the entry time when it is known", () => {
    expect(formatDietContext({ "2026-07-28": [entry({ time: "08:15" })] }, 0)).toContain("08:15 — Овсянка");
  });

  it("omits the time prefix when it is missing", () => {
    expect(formatDietContext({ "2026-07-28": [entry()] }, 0)).toContain("- Овсянка");
  });

  it("totals the day across entries", () => {
    const context = formatDietContext(
      { "2026-07-28": [entry(), entry({ cal_min: 100, cal_max: 150 })] },
      0,
    );
    expect(context).toContain("итого ~400–500 ккал");
  });

  it("includes the calorie goal when one is set", () => {
    expect(formatDietContext({ "2026-07-28": [entry()] }, 2300)).toContain(
      "Дневная цель по калориям: 2300 ккал",
    );
  });

  it("omits the goal line when the goal is 0", () => {
    // The route passes 0 when the client sent no usable goal.
    expect(formatDietContext({ "2026-07-28": [entry()] }, 0)).not.toContain("Дневная цель");
  });
});

describe("toApiContent", () => {
  it("passes plain text straight through when nothing is attached", () => {
    expect(toApiContent({ role: "user", content: "Что съесть на ужин?" })).toBe("Что съесть на ужин?");
  });

  it("passes plain text through for an empty attachment list", () => {
    expect(toApiContent({ role: "user", content: "Привет", attachments: [] })).toBe("Привет");
  });

  it("wraps a PDF in a document block", () => {
    const content = toApiContent({
      role: "user",
      content: "Вот анализы",
      attachments: [{ mediaType: "application/pdf", base64: "PDFDATA", name: "labs.pdf" }],
    });

    expect(content).toEqual([
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: "PDFDATA" } },
      { type: "text", text: "Вот анализы" },
    ]);
  });

  it("wraps an image in an image block, preserving its media type", () => {
    const content = toApiContent({
      role: "user",
      content: "Что это?",
      attachments: [{ mediaType: "image/png", base64: "IMGDATA", name: "shot.png" }],
    });

    expect(content).toEqual([
      { type: "image", source: { type: "base64", media_type: "image/png", data: "IMGDATA" } },
      { type: "text", text: "Что это?" },
    ]);
  });

  it("puts attachments ahead of the text and keeps their order", () => {
    const content = toApiContent({
      role: "user",
      content: "Смотри",
      attachments: [
        { mediaType: "image/jpeg", base64: "A", name: "a.jpg" },
        { mediaType: "application/pdf", base64: "B", name: "b.pdf" },
      ],
    }) as Anthropic.ContentBlockParam[];

    expect(content.map((b) => b.type)).toEqual(["image", "document", "text"]);
  });

  it("omits the text block when the user attached a file without a caption", () => {
    const content = toApiContent({
      role: "user",
      content: "",
      attachments: [{ mediaType: "image/jpeg", base64: "A", name: "a.jpg" }],
    }) as Anthropic.ContentBlockParam[];

    expect(content).toHaveLength(1);
    expect(content[0].type).toBe("image");
  });
});

describe("trimChatHistory", () => {
  function turn(i: number, withAttachment = false): ChatMessage {
    return {
      role: i % 2 === 0 ? "user" : "assistant",
      content: `turn ${i}`,
      ...(withAttachment
        ? { attachments: [{ mediaType: "image/jpeg", base64: `img${i}`, name: `${i}.jpg` }] }
        : {}),
    };
  }

  it("keeps everything when there are 20 or fewer turns", () => {
    const messages = Array.from({ length: 20 }, (_, i) => turn(i));
    expect(trimChatHistory(messages)).toEqual(messages);
  });

  it("keeps only the last 20 turns when there are more", () => {
    const messages = Array.from({ length: 25 }, (_, i) => turn(i));
    const trimmed = trimChatHistory(messages);
    expect(trimmed).toHaveLength(20);
    expect(trimmed[0].content).toBe("turn 5");
    expect(trimmed[19].content).toBe("turn 24");
  });

  it("strips attachments from all but the last 3 turns", () => {
    const messages = Array.from({ length: 10 }, (_, i) => turn(i, true));
    const trimmed = trimChatHistory(messages);
    expect(trimmed.slice(0, 7).every((m) => m.attachments === undefined)).toBe(true);
    expect(trimmed.slice(7).every((m) => m.attachments?.length === 1)).toBe(true);
  });

  it("does not mutate the original messages", () => {
    const messages = Array.from({ length: 5 }, (_, i) => turn(i, true));
    const original = JSON.parse(JSON.stringify(messages));
    trimChatHistory(messages);
    expect(messages).toEqual(original);
  });

  it("leaves messages without attachments untouched", () => {
    const messages = Array.from({ length: 5 }, (_, i) => turn(i));
    expect(trimChatHistory(messages)).toEqual(messages);
  });
});

describe("toFriendlyError", () => {
  it("explains an overloaded service by status", () => {
    const err = toFriendlyError(new Anthropic.APIError(529, undefined, "raw wire json", undefined));
    expect(err.message).toBe("Сервис анализа сейчас перегружен, попробуй через минуту");
  });

  it("explains an overloaded service by error type", () => {
    const err = toFriendlyError(
      new Anthropic.APIError(500, undefined, "raw wire json", undefined, "overloaded_error"),
    );
    expect(err.message).toBe("Сервис анализа сейчас перегружен, попробуй через минуту");
  });

  it("explains rate limiting by status", () => {
    const err = toFriendlyError(new Anthropic.APIError(429, undefined, "raw wire json", undefined));
    expect(err.message).toBe("Слишком много запросов к сервису анализа, подожди немного");
  });

  it("explains rate limiting by error type", () => {
    const err = toFriendlyError(
      new Anthropic.APIError(500, undefined, "raw wire json", undefined, "rate_limit_error"),
    );
    expect(err.message).toBe("Слишком много запросов к сервису анализа, подожди немного");
  });

  it("gives a generic message for any other API error", () => {
    const err = toFriendlyError(new Anthropic.APIError(401, undefined, "raw wire json", undefined));
    expect(err.message).toBe("Не получилось связаться с сервисом анализа, попробуй ещё раз");
  });

  it("never leaks the SDK's raw wire message", () => {
    const raw = '529 {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}';
    expect(toFriendlyError(new Anthropic.APIError(529, undefined, raw, undefined)).message).not.toContain(
      "{",
    );
  });

  it("passes a plain Error through untouched", () => {
    const original = new Error("Пустой ответ от модели");
    expect(toFriendlyError(original)).toBe(original);
  });

  it("wraps a non-Error throw", () => {
    expect(toFriendlyError("boom").message).toBe("boom");
  });
});
