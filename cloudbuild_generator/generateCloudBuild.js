import fs from "fs";
import YAML from "yaml";

const file = fs.readFileSync(process.argv[2], "utf8");
const {
  "dockerfile.path": dockerfilePath,
  buildContainer,
  envsToDeployTo: envs,
} = YAML.parse(file);

console.log(envs);

console.log(process.argv[2]);
