export function calculateWER(expected: string, recognized: string) {
  if (!expected || !recognized) {
    return { wer: 0, s: 0, d: 0, i: 0, n: 0 };
  }

  // Normalize texts (lowercase, remove punctuation)
  const normalize = (text: string) => text.toLowerCase().replace(/[.,!?;:]/g, '').trim().split(/\s+/).filter(w => w.length > 0);
  
  const exp = normalize(expected);
  const rec = normalize(recognized);
  const N = exp.length;

  if (N === 0) return { wer: 0, s: 0, d: 0, i: 0, n: 0 };

  const matrix = Array(rec.length + 1).fill(null).map(() => Array(exp.length + 1).fill(0));

  for (let i = 0; i <= rec.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= exp.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= rec.length; i++) {
    for (let j = 1; j <= exp.length; j++) {
      if (rec[i - 1] === exp[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // deletion
          matrix[i - 1][j] + 1      // insertion
        );
      }
    }
  }

  // Backtrace to find exact counts
  let i = rec.length;
  let j = exp.length;
  let s = 0;
  let d = 0;
  let ins = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && rec[i - 1] === exp[j - 1]) {
      i--;
      j--;
    } else if (i > 0 && j > 0 && matrix[i][j] === matrix[i - 1][j - 1] + 1) {
      s++;
      i--;
      j--;
    } else if (j > 0 && matrix[i][j] === matrix[i][j - 1] + 1) {
      d++;
      j--;
    } else if (i > 0 && matrix[i][j] === matrix[i - 1][j] + 1) {
      ins++;
      i--;
    }
  }

  const wer = ((s + d + ins) / N) * 100;

  return {
    wer: parseFloat(wer.toFixed(2)),
    s,
    d,
    i: ins,
    n: N
  };
}
