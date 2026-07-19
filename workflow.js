export const meta = {
  name: "cpp-bug-audit",
  description: "A comprehensive audit of C++ codebase for bugs and issues using multiple verification patterns",
  phases: ["Find", "Verify", "Synthesize"]
}

const BUGS_SCHEMA = {
  type: "object",
  properties: {
    bugs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          desc: {type: "string"},
          severity: {type: "string", enum: ["low", "medium", "high", "critical"]},
          location: {type: "string"}
        },
        required: ["desc", "severity", "location"]
      }
    }
  },
  required: ["bugs"]
}

const VERDICT = {
  type: "object",
  properties: {
    real: {type: "boolean"},
    reason: {type: "string"}
  },
  required: ["real"]
}

const FINDERS = [
  {prompt: "Find memory leaks in this C++ codebase.", phase: "Find"},
  {prompt: "Look for undefined behavior in the C++ codebase.", phase: "Find"},
  {prompt: "Identify potential race conditions in C++ code.", phase: "Find"},
  {prompt: "Search for buffer overflows or underflows in C++ code.", phase: "Find"},
  {prompt: "Find any potential null pointer dereferences in C++ code.", phase: "Find"}
]

// Loop-until-dry pattern with adversarial verification
const bugs = []
const seen = new Set()
let dry = 0

while (dry < 2 && budget.remaining() > 50_000) {
  const found = (await parallel(FINDERS.map(f => () =>
    agent(f.prompt, {phase: 'Find', schema: BUGS_SCHEMA}))))
    .filter(Boolean)
    .flatMap(r => r.bugs)

  const fresh = found.filter(b => !seen.has(b.desc))
  if (!fresh.length) {
    dry++
    continue
  }

  dry = 0
  fresh.forEach(b => seen.add(b.desc))

  // Adversarial verification - spawn 3 independent skeptics per finding
  const judged = await parallel(fresh.map(b => () => {
    return parallel(Array.from({length: 3}, (_, i) => () =>
      agent(`Judge "${b.desc}" via the ${['correctness','security','repro'][i]} lens — real?`, {phase: 'Verify', schema: VERDICT}))
    ).then(votes => {
      const survivors = votes.filter(Boolean).filter(v => v.real).length
      return { b, real: survivors >= 2 }
    })
  }))

  bugs.push(...judged.filter(v => v.real).map(v => v.b))
  log(`${bugs.length} confirmed bugs found, ${Math.round(budget.remaining()/1000)}k remaining`)
}

return { bugs }