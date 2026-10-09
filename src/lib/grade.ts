export type Grade = { score: number; checks: { name: string; passed: boolean; feedback: string }[] };

export function gradeHook(value: string): Grade {
  const hook = value.trim().replace(/\r\n/g, "\n");
  const lines = hook.split("\n").filter(Boolean);
  const words = hook.match(/[\p{L}\p{N}']+/gu) ?? [];
  const checks = [
    { name: "Two lines", passed: lines.length === 2, feedback: "Use exactly two non-empty lines." },
    { name: "Short opening", passed: words.length >= 8 && words.length <= 35, feedback: "Aim for 8 to 35 words across both lines." },
    { name: "Clear subject", passed: /\b(you|your|i|we|founder|team|buyer|customer|client|company|business|sales|linkedin)\b/i.test(hook), feedback: "Name who the post is about." },
    { name: "Specific detail", passed: /\d|\b(because|when|before|after|instead|without|but|how|why)\b/i.test(hook), feedback: "Add a concrete detail or a clear contrast." },
    { name: "Easy to read", passed: lines.every(line => line.length <= 110) && !/[A-Z]{5,}/.test(hook), feedback: "Keep each line under 111 characters and avoid all-caps phrases." }
  ];
  return { score: checks.filter(x => x.passed).length * 20, checks };
}
