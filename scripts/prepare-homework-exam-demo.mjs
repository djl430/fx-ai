import { readFileSync, writeFileSync } from "node:fs";

const demoUrl = new URL("../index.html", import.meta.url);
let demo = readFileSync(demoUrl, "utf8");

const replacements = [
  [
    "file:///Users/dengjingli_1/Documents/GitHub/fx-ai/grading-by-question-demo.html?mode=homework&taskId=cluster-homework",
    "grading-by-question-demo.html?mode=homework&taskId=cluster-homework",
    true,
  ],
  [
    "file:///Users/dengjingli_1/Documents/GitHub/fx-ai/grading-by-question-demo.html?mode=exam&taskId=quiz",
    "grading-by-question-demo.html?mode=exam&taskId=quiz",
    true,
  ],
  [
    "file:///Users/dengjingli_1/Documents/GitHub/fx-ai/collection-history.html?from=unified",
    "collection-history.html?from=unified",
    true,
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

const nonNavigableReviewReplacements = [
  ['{id:"h2",type:', '{id:"h2",reviewDisabled:!0,type:'],
  ['{id:"e2",type:', '{id:"e2",reviewDisabled:!0,type:'],
  ['{id:"r1",type:', '{id:"r1",reviewDisabled:!0,type:'],
  ['{id:"p1",type:', '{id:"p1",reviewDisabled:!0,type:'],
  [
    'c.jsx("button",{type:"button",className:"pending-count","aria-label":`${D.name}待确认 ${D.pending}`,onClick:R=>{R.stopPropagation(),y(f.id,D.name)},children:D.pending})',
    'c.jsx("span",{className:"pending-count",children:D.pending})',
  ],
  ['C=D=>{if(f.id==="h1"', 'C=D=>{if(f.reviewDisabled)return;if(f.id==="h1"'],
  [
    'c.jsx(mn,{className:Z.name,onAction:()=>d(),only:"批改复核"})',
    'c.jsx(mn,{className:Z.name,onAction:()=>{f.reviewDisabled||d()},only:"批改复核"})',
  ],
  [
    'onAction:(A,C)=>A==="批改复核"?f.type==="考试"?V(Ut):Z(Ot):m(A,C)',
    'onAction:(A,C)=>A==="批改复核"?f.reviewDisabled?void 0:f.type==="考试"?V(Ut):Z(Ot):m(A,C)',
  ],
  [
    'c.jsx(mn,{className:y.name,onAction:()=>d(),only:"批改复核"})',
    'c.jsx(mn,{className:y.name,onAction:()=>{f.reviewDisabled||d()},only:"批改复核"})',
  ],
];

const defaultPublicReplacements = [
  [
    '[tl,B]=i.useState(!0),[cl,al]=i.useState(!1)',
    '[tl,B]=i.useState(!1),[cl,al]=i.useState(!1)',
  ],
];

function applyExactReplacements(source, items, label) {
  for (const [before, after] of items) {
    if (source.includes(after)) continue;
    if (!source.includes(before)) {
      throw new Error(`Expected ${label} marker not found: ${before.slice(0, 80)}`);
    }
    source = source.replace(before, after);
  }
  return source;
}

for (const [before, after, replaceEveryOccurrence = false] of replacements) {
  if (replaceEveryOccurrence && demo.includes(before)) {
    demo = demo.replaceAll(before, after);
    continue;
  }
  if (demo.includes(after)) continue;
  if (!demo.includes(before)) {
    throw new Error(`Expected export marker not found: ${before.slice(0, 80)}`);
  }
  demo = demo.replace(before, after);
}

demo = applyExactReplacements(demo, nonNavigableReviewReplacements, "interaction");
demo = applyExactReplacements(demo, defaultPublicReplacements, "default public");

writeFileSync(demoUrl, demo);

const unifiedDemoUrl = new URL("../homework-exam-unified-demo.html", import.meta.url);
let unifiedDemo = readFileSync(unifiedDemoUrl, "utf8");
const unifiedBreadcrumbBefore = 'c.jsxs("nav",{className:"breadcrumb",children:[c.jsx(rn,{weight:"bold"}),c.jsx("span",{children:"首页"}),';
const unifiedBreadcrumbAfter = 'c.jsxs("nav",{className:"breadcrumb",children:[c.jsxs("a",{className:"breadcrumb-home",href:e3,"aria-label":"返回首页",children:[c.jsx(rn,{weight:"bold"}),c.jsx("span",{children:"首页"})]}),';

if (!unifiedDemo.includes(unifiedBreadcrumbAfter)) {
  if (!unifiedDemo.includes(unifiedBreadcrumbBefore)) {
    throw new Error("Expected unified demo homepage breadcrumb marker not found");
  }
  unifiedDemo = unifiedDemo.replace(unifiedBreadcrumbBefore, unifiedBreadcrumbAfter);
}

unifiedDemo = applyExactReplacements(
  unifiedDemo,
  nonNavigableReviewReplacements,
  "unified interaction",
);
unifiedDemo = applyExactReplacements(
  unifiedDemo,
  defaultPublicReplacements,
  "unified default public",
);

writeFileSync(unifiedDemoUrl, unifiedDemo);
