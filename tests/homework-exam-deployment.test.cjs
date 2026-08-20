const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const demoPath = path.join(__dirname, "..", "index.html");
const demo = readFileSync(demoPath, "utf8");

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
