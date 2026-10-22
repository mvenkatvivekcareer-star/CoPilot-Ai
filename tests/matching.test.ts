// Unit test suite for deterministic match score formula and normalization
function calculateDeterministicMatchScore(
  requiredSkills: string[],
  preferredSkills: string[],
  evidencedSkills: string[],
  partialSkills: string[] = []
): { score: number; requiredPct: number; preferredPct: number; experiencePct: number } {
  const totalRequired = Math.max(requiredSkills.length, 1);
  const totalPreferred = Math.max(preferredSkills.length, 1);

  const evidencedSet = new Set(evidencedSkills.map(s => s.toLowerCase().trim()));
  const partialSet = new Set(partialSkills.map(s => s.toLowerCase().trim()));

  let reqPoints = 0;
  requiredSkills.forEach(s => {
    const sLow = s.toLowerCase().trim();
    if (evidencedSet.has(sLow)) reqPoints += 1;
    else if (partialSet.has(sLow)) reqPoints += 0.5;
  });
  const requiredPct = (reqPoints / totalRequired) * 100;

  let prefPoints = 0;
  preferredSkills.forEach(s => {
    const sLow = s.toLowerCase().trim();
    if (evidencedSet.has(sLow)) prefPoints += 1;
    else if (partialSet.has(sLow)) prefPoints += 0.5;
  });
  const preferredPct = preferredSkills.length > 0 ? (prefPoints / totalPreferred) * 100 : 80;

  const experiencePct = Math.min(100, Math.round((requiredPct * 0.7) + (preferredPct * 0.3) + 10));

  const finalScore = Math.min(100, Math.max(0, Math.round(
    (requiredPct * 0.55) +
    (preferredPct * 0.20) +
    (experiencePct * 0.25)
  )));

  return { score: finalScore, requiredPct, preferredPct, experiencePct };
}

function normalizeSkillName(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const synonyms: Record<string, string> = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'react.js': 'React',
    'reactjs': 'React',
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
  };
  return synonyms[trimmed] || raw.trim();
}

function runTests() {
  console.log('Running CareerPilot AI Unit Tests...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Full match should yield 100% or near 100%
  const test1 = calculateDeterministicMatchScore(
    ['TypeScript', 'React', 'Node.js'],
    ['PostgreSQL', 'Docker'],
    ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker']
  );
  if (test1.score >= 95 && test1.score <= 100) {
    console.log('✓ Test 1: Full requirement match gives 100% score.');
    passed++;
  } else {
    console.error(`✗ Test 1 failed: Expected ~100%, got ${test1.score}`);
    failed++;
  }

  // Test 2: Partial match respects deterministic formula
  const test2 = calculateDeterministicMatchScore(
    ['TypeScript', 'React', 'Node.js', 'Kubernetes'],
    ['PostgreSQL'],
    ['TypeScript', 'React'],
    ['Node.js']
  );
  // req: (2 + 0.5) / 4 = 62.5%
  // pref: 0%
  // exp: (62.5 * 0.7 + 0 + 10) = 54%
  // score: (62.5 * 0.55) + (0 * 0.2) + (54 * 0.25) = 34.375 + 13.5 = 48%
  if (test2.score >= 40 && test2.score <= 55) {
    console.log(`✓ Test 2: Partial match respects weights (got ${test2.score}%).`);
    passed++;
  } else {
    console.error(`✗ Test 2 failed: Expected 40-55%, got ${test2.score}`);
    failed++;
  }

  // Test 3: Zero evidence results in low, non-negative score
  const test3 = calculateDeterministicMatchScore(
    ['Rust', 'Embedded C', 'FPGA'],
    ['Verilog'],
    []
  );
  if (test3.score >= 0 && test3.score <= 10) {
    console.log(`✓ Test 3: Zero evidence properly clamped (got ${test3.score}%).`);
    passed++;
  } else {
    console.error(`✗ Test 3 failed: Expected 0-10%, got ${test3.score}`);
    failed++;
  }

  // Test 4: Skill Normalization
  const n1 = normalizeSkillName('reactjs');
  const n2 = normalizeSkillName('postgres');
  const n3 = normalizeSkillName('ts');
  if (n1 === 'React' && n2 === 'PostgreSQL' && n3 === 'TypeScript') {
    console.log('✓ Test 4: Skill name normalization maps aliases accurately.');
    passed++;
  } else {
    console.error(`✗ Test 4 failed: Normalization mismatch`);
    failed++;
  }

  console.log(`\nTests Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
