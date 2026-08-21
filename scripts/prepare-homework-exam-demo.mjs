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
    [
      'c.jsx(mn,{className:Z.name,onAction:()=>d(),only:"批改复核"})',
      'c.jsx(mn,{className:Z.name,onAction:()=>{f.reviewDisabled||d()},only:"批改复核"})',
    ],
    'c.jsx(mn,{className:Z.name,disabled:f.reviewDisabled,onAction:()=>{f.reviewDisabled||d()},only:"批改复核"})',
  ],
  [
    [
      'c.jsx(mn,{className:j.name,onAction:(A,C)=>A==="批改复核"?f.type==="考试"?V(Ut):Z(Ot):m(A,C)})',
      'c.jsx(mn,{className:j.name,onAction:(A,C)=>A==="批改复核"?f.reviewDisabled?void 0:f.type==="考试"?V(Ut):Z(Ot):m(A,C)})',
    ],
    'c.jsx(mn,{className:j.name,disabled:f.reviewDisabled,onAction:(A,C)=>A==="批改复核"?f.reviewDisabled?void 0:f.type==="考试"?V(Ut):Z(Ot):m(A,C)})',
  ],
  [
    [
      'c.jsx(mn,{className:y.name,onAction:()=>d(),only:"批改复核"})',
      'c.jsx(mn,{className:y.name,onAction:()=>{f.reviewDisabled||d()},only:"批改复核"})',
    ],
    'c.jsx(mn,{className:y.name,disabled:f.reviewDisabled,onAction:()=>{f.reviewDisabled||d()},only:"批改复核"})',
  ],
  [
    'function mn({className:f,onAction:m,showPractice:p=!0,only:d}){return c.jsx("div",{className:"class-actions",children:Pd.filter(({label:y})=>(!d||y===d)&&(p||y!=="精准练")).map(({label:y})=>c.jsx("button",{"aria-disabled":y!=="批改复核",onClick:Z=>{Z.stopPropagation(),y==="批改复核"&&m(y,f)},children:y},y))})}',
    'function mn({className:f,onAction:m,showPractice:p=!0,only:d,disabled:h=!1}){return c.jsx("div",{className:"class-actions",children:Pd.filter(({label:y})=>(!d||y===d)&&(p||y!=="精准练")).map(({label:y})=>c.jsx("button",{disabled:h&&y==="批改复核","aria-disabled":h&&y==="批改复核"||y!=="批改复核",onClick:Z=>{Z.stopPropagation(),y==="批改复核"&&m(y,f)},children:y},y))})}',
  ],
  [
    'c.jsx(mn,{className:D.name,onAction:(R,w)=>R==="批改复核"?C(w):m(R,w)})',
    'c.jsx(mn,{className:D.name,disabled:f.reviewDisabled,onAction:(R,w)=>R==="批改复核"?C(w):m(R,w)})',
  ],
];

const defaultPublicReplacements = [
  [
    '[tl,B]=i.useState(!0),[cl,al]=i.useState(!1)',
    '[tl,B]=i.useState(!1),[cl,al]=i.useState(!1)',
  ],
];

const landingPageTitleReplacements = [
  [
    'title:"课堂本 第四章 三角形 第12课 三角形单元复习"',
    'title:"总复习 1·数与代数｜正比例与反比例"',
  ],
  [
    'title:"2025–2026 八年级下 数学期末模拟测试（四）"',
    'title:"一次函数随堂检测"',
  ],
];

const classDiagnosisReplacements = [
  [
    'onClick:R=>{R.stopPropagation(),m("学情",D.name)}',
    'onClick:R=>{R.stopPropagation(),(f.id==="h1"&&D.name==="七年级1班"||f.id==="e1"&&D.name==="八年级9班")?window.location.href="https://zingistop.github.io/four-oclock-class-diagnosis/?v=fbdec8b#diagnosis":m("学情",D.name)}',
  ],
];

function applyExactReplacements(source, items, label) {
  for (const [before, after] of items) {
    if (source.includes(after)) continue;
    const candidates = Array.isArray(before) ? before : [before];
    const matchedBefore = candidates.find((candidate) => source.includes(candidate));
    if (!matchedBefore) {
      throw new Error(`Expected ${label} marker not found: ${candidates[0].slice(0, 80)}`);
    }
    source = source.replace(matchedBefore, after);
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
demo = applyExactReplacements(demo, landingPageTitleReplacements, "landing page title");
demo = applyExactReplacements(demo, classDiagnosisReplacements, "class diagnosis");

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
unifiedDemo = applyExactReplacements(
  unifiedDemo,
  landingPageTitleReplacements,
  "unified landing page title",
);
unifiedDemo = applyExactReplacements(
  unifiedDemo,
  classDiagnosisReplacements,
  "unified class diagnosis",
);

writeFileSync(unifiedDemoUrl, unifiedDemo);
