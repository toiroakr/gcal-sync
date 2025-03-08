import fs from "node:fs";

fs.readdirSync("src").forEach((file) => {
  fs.writeFileSync(`.dist/${file}`, fs.readFileSync(`src/${file}`).toString().replace(/ENV\.([-\w]+)/mg, (_, $1) => {
    return `"${process.env[$1] ?? ""}"`;
  }));
});

console.log("Build complete\n\n");
