import fs from "fs";
import YAML from "yaml";

const file = fs.readFileSync(
  "/Users/bkurilko/Repos/PipelineStuff/intelligent-pipeline/cloudbuild_generator/brianpipeline.yaml",
  "utf8"
);
const {
  "dockerfile.path": dockerfilePath,
  buildContainer,
  envsToDeployTo: envs,
} = YAML.parse(file);

console.log(envs);
