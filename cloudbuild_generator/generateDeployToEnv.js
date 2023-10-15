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
  const envsArray = envsToDeploy
    .split(" ")
    .map((item) => item.replace(/"/g, ""));

  const env = envsArray.shift();

  const appName = await getNameFromSettingsGradle(settingsGradlePath);

  const { buildContainer, serviceName } = await readBrianPipelineYaml(
    brianPipelineFilePath
  );

  const templateString = await readCloudBuildTemplate(
    cloudBuildTemplateFilePath
  );

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
