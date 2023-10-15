import {
  readBrianPipelineYaml,
  readCloudBuildTemplate,
  getVersionFromBuildGradle,
  getNameFromSettingsGradle,
  getEnvsToDeploy,
} from "./commonFunctions.js";
import Handlebars from "handlebars";
import { promises as fs } from "fs";

function generateFileBasedOffTemplate(
  templateString,
  buildContainer,
  serviceName,
  branchName,
  repoName,
  cloneUrl,
  commitId,
  appName,
  originalAppVersion,
  envsToDeploy
) {
  const template = Handlebars.compile(templateString);

  let buildImage = "";
  let buildArgs = "";
  if (buildContainer == "java17") {
    buildImage = "gradle:7.6.1-jdk17";
    buildArgs = "gradle assemble && cp -r build ../build";
  }
  const contents = template({
    serviceName,
    buildImage,
    buildArgs,
    branchName,
    repoName,
    cloneUrl,
    commitId,
    appName,
    originalAppVersion,
    envsToDeploy: `'${JSON.stringify(envsToDeploy)}'`,
  });
  return contents;
}

async function generateCloudBuildYaml(
  brianPipelineFilePath,
  cloudBuildTemplateFilePath,
  branchName,
  repoName,
  cloneUrl,
  commitId,
  buildGradlePath,
  settingsGradlePath
) {
  const {
    buildContainer,
    serviceName,
    envsToDeployToOnMain,
    envsToDeployToOnRelease,
  } = await readBrianPipelineYaml(brianPipelineFilePath);

  const templateString = await readCloudBuildTemplate(
    cloudBuildTemplateFilePath
  );

  const envsToDeploy = getEnvsToDeploy(
    branchName,
    envsToDeployToOnMain,
    envsToDeployToOnRelease
  );

  const originalAppVersion = await getVersionFromBuildGradle(buildGradlePath);
  const appName = await getNameFromSettingsGradle(settingsGradlePath);

  const contents = generateFileBasedOffTemplate(
    templateString,
    buildContainer,
    serviceName,
    branchName,
    repoName,
    cloneUrl,
    commitId,
    appName,
    originalAppVersion,
    envsToDeploy
  );

  fs.writeFile("cloudbuild-artifactpush.yaml", contents);
}

generateCloudBuildYaml(
  process.argv[2],
  process.argv[3],
  process.argv[4],
  process.argv[5],
  process.argv[6],
  process.argv[7],
  process.argv[8],
  process.argv[9]
);
