import {
  readBrianPipelineYaml,
  readCloudBuildTemplate,
  getNameFromSettingsGradle,
} from "./commonFunctions.js";
import Handlebars from "handlebars";
import { promises as fs } from "fs";

function generateFileBasedOffTemplate(
  templateString,
  buildContainer,
  serviceName,
  repoName,
  cloneUrl,
  commitId,
  appName,
  artifactTag,
  envsToDeploy,
  cascade,
  skipDeploymentTests,
  env
) {
  const template = Handlebars.compile(templateString);

  let buildImage = "";
  let buildArgs = "";
  if (buildContainer == "java17") {
    buildImage = "gradle:7.6.1-jdk17";
    buildArgs = "gradle test";
  }

  const transformedEnvsToDeploy = `${JSON.stringify(envsToDeploy)
    .replace(/\[|\]/g, "")
    .replace(/,/g, " ")}`;

  console.log("do we get all the way over here?");
  const contents = template({
    serviceName,
    buildImage,
    buildArgs,
    repoName,
    cloneUrl,
    commitId,
    appName,
    artifactTag,
    envsToDeploy: transformedEnvsToDeploy,
    cascade: `"${cascade}"`,
    skipDeploymentTests: `"${skipDeploymentTests}"`,
    env,
  });
  return contents;
}

async function generateCloudBuildYaml(
  brianPipelineFilePath,
  cloudBuildTemplateFilePath,
  repoName,
  cloneUrl,
  commitId,
  artifactTag,
  envsToDeploy,
  cascade,
  skipDeploymentTests,
  settingsGradlePath
) {
  console.log("do we get in here?");
  const envsArray = envsToDeploy
    .split(" ")
    .map((item) => item.replace(/"/g, ""));
  console.log("do we get over here?");

  const env = envsArray.shift();
  console.log("how about here?");
  console.log(`settings gradle path: ${settingsGradlePath}`);

  const appName = await getNameFromSettingsGradle(settingsGradlePath);
  console.log("or here?");

  const { buildContainer, serviceName } = await readBrianPipelineYaml(
    brianPipelineFilePath
  );
  console.log("made it past pipeline thing");

  const templateString = await readCloudBuildTemplate(
    cloudBuildTemplateFilePath
  );
  console.log("could it be the template?");

  const contents = generateFileBasedOffTemplate(
    templateString,
    buildContainer,
    serviceName,
    repoName,
    cloneUrl,
    commitId,
    appName,
    artifactTag,
    envsArray,
    cascade,
    skipDeploymentTests,
    env
  );

  fs.writeFile("cloudbuild-deploy.yaml", contents);
}

generateCloudBuildYaml(
  process.argv[2],
  process.argv[3],
  process.argv[4],
  process.argv[5],
  process.argv[6],
  process.argv[7],
  process.argv[8],
  process.argv[9],
  process.argv[10],
  process.argv[11]
);
