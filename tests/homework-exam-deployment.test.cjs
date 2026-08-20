const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const demoPath = path.join(__dirname, "..", "index.html");
const demo = readFileSync(demoPath, "utf8");
const unifiedDemoPath = path.join(__dirname, "..", "homework-exam-unified-demo.html");
const unifiedDemo = readFileSync(unifiedDemoPath, "utf8");

test("deployed AI grading homepage uses deployable links", () => {
  assert.doesNotMatch(demo, /file:\/\/\/Users\//);
  assert.match(
    demo,
    /href:"https:\/\/djl430\.github\.io\/fx-homepage-1\/"/,
  );
  assert.match(demo, /className:"breadcrumb-home"/);
  assert.match(
    demo,
    /grading-by-question-demo\.html\?mode=homework&taskId=cluster-homework/,
  );
  assert.match(
    demo,
    /grading-by-question-demo\.html\?mode=exam&taskId=quiz/,
  );
  assert.match(demo, /collection-history\.html\?from=unified/);
});

test("unified demo homepage breadcrumb remains clickable after returning from review", () => {
  assert.match(
    unifiedDemo,
    /className:"breadcrumb-home",href:e3,"aria-label":"返回首页",children:\[c\.jsx\(rn,\{weight:"bold"\}\),c\.jsx\("span",\{children:"首页"\}\)\]/,
  );
  assert.match(
    unifiedDemo,
    /e3="https:\/\/djl430\.github\.io\/fx-homepage-1\/"/,
  );
});

test("unified demo keeps pending counts and archived review actions non-navigable", () => {
  assert.match(
    unifiedDemo,
    /c\.jsx\("span",\{className:"pending-count",children:D\.pending\}\)/,
  );
  assert.doesNotMatch(
    unifiedDemo,
    /c\.jsx\("button",\{type:"button",className:"pending-count"/,
  );
  for (const taskId of ["h2", "e2", "r1", "p1"]) {
    assert.match(
      unifiedDemo,
      new RegExp(`id:"${taskId}"[^}]*reviewDisabled:!0`),
    );
  }
  assert.match(unifiedDemo, /C=D=>\{if\(f\.reviewDisabled\)return;/);
  assert.match(unifiedDemo, /onAction:\(\)=>\{f\.reviewDisabled\|\|d\(\)\}/);
});
