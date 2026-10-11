/** Parcours rédigés pour Cursor Cameroun. Le cours reste sur cursor.com/learn. */
export const LEARN_COURSE_URL = "https://cursor.com/learn";

export const learnPaths = [
  { id: "model", step: "01" },
  { id: "diff", step: "02" },
  { id: "recover", step: "03" },
  { id: "cafe", step: "04" },
] as const;

export type LearnPathId = (typeof learnPaths)[number]["id"];
