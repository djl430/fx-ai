import { readFileSync, writeFileSync } from "node:fs";

const demoUrl = new URL("../homework-exam-unified-demo.html", import.meta.url);
let demo = readFileSync(demoUrl, "utf8");

const replacements = [
  [
    "file:///Users/dengjingli_1/Documents/GitHub/fx-ai/grading-by-question-demo.html?mode=homework&taskId=cluster-homework",
    "grading-by-question-demo.html?mode=homework&taskId=cluster-homework",
  ],
  [
    "file:///Users/dengjingli_1/Documents/GitHub/fx-ai/grading-by-question-demo.html?mode=exam&taskId=quiz",
    "grading-by-question-demo.html?mode=exam&taskId=quiz",
  ],
  [
    "file:///Users/dengjingli_1/Documents/GitHub/fx-ai/collection-history.html?from=unified",
    "collection-history.html?from=unified",
  ],
  [
    ".breadcrumb strong{color:var(--ink)}",
    ".breadcrumb strong{color:var(--ink)}.breadcrumb-home{display:inline-flex;align-items:center;gap:16px;color:inherit;text-decoration:none}",
  ],
  [
    'c.jsxs("nav",{className:"breadcrumb",children:[c.jsx(rn,{weight:"bold"}),c.jsx("span",{children:"首页"}),',
    'c.jsxs("nav",{className:"breadcrumb",children:[c.jsxs("a",{className:"breadcrumb-home",href:"https://djl430.github.io/fx-homepage-1/",children:[c.jsx(rn,{weight:"bold"}),c.jsx("span",{children:"首页"})]}),',
  ],
];

for (const [before, after] of replacements) {
  if (demo.includes(after)) continue;
  if (!demo.includes(before)) {
    throw new Error(`Expected export marker not found: ${before.slice(0, 80)}`);
  }
  demo = demo.replace(before, after);
}

writeFileSync(demoUrl, demo);
