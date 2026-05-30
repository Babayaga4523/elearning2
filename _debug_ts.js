const fs = require("fs");
const content = fs.readFileSync("src/actions/course.ts", "utf8");
// Show lines 240-310
const lines = content.split("\n");
for (let i = 239; i < 312; i++) {
  console.log(String(i+1).padStart(3) + ": " + lines[i]);
}
