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
  assert.match(
    unifiedDemo,
    /function mn\(\{className:f,onAction:m,showPractice:p=!0,only:d,disabled:h=!1\}\)/,
  );
  assert.match(
    unifiedDemo,
    /disabled:h&&y==="批改复核","aria-disabled":h&&y==="批改复核"\|\|y!=="批改复核"/,
  );
  assert.equal(
    unifiedDemo.match(/disabled:f\.reviewDisabled/g)?.length,
    4,
  );
});

test("unified demo defaults new homework and exam publishing to off", () => {
  assert.match(
    unifiedDemo,
    /\[tl,B\]=i\.useState\(!1\),\[cl,al\]=i\.useState\(!1\)/,
  );
  assert.doesNotMatch(
    unifiedDemo,
    /\[tl,B\]=i\.useState\(!0\),\[cl,al\]=i\.useState\(!1\)/,
  );
});

test("unified demo card titles match their grading landing pages", () => {
  assert.match(
    unifiedDemo,
    /id:"h1"[^}]*title:"总复习 1·数与代数｜正比例与反比例"/,
  );
  assert.match(
    unifiedDemo,
    /id:"e1"[^}]*title:"一次函数随堂检测"/,
  );
  assert.doesNotMatch(
    unifiedDemo,
    /课堂本 第四章 三角形 第12课 三角形单元复习|2025–2026 八年级下 数学期末模拟测试（四）/,
  );
});

test("selected homework and exam class cards open the external diagnosis page", () => {
  for (const html of [demo, unifiedDemo]) {
    assert.match(
      html,
      /\(f\.id==="h1"&&D\.name==="七年级1班"\|\|f\.id==="e1"&&D\.name==="八年级9班"\)\?window\.location\.href="https:\/\/zingistop\.github\.io\/four-oclock-class-diagnosis\/\?v=fbdec8b#diagnosis":m\("学情",D\.name\)/,
    );
  }
});
