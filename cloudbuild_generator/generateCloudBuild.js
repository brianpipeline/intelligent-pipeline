import { promises as fs } from "fs";
import YAML from "yaml";
import Handlebars from "handlebars";

function getBranchName(branchRef) {
  return /heads\/(.*)/.exec(branchRef)[1];
}

async function readBrianPipelineYaml(brianPipelineFilePath) {
  const file = await fs.readFile(brianPipelineFilePath, "utf8");
  return YAML.parse(file);
}

async function readCloudBuildTemplate(cloudBuildTemplateFilePath) {
  return await fs.readFile(cloudBuildTemplateFilePath, "utf8");
}

async function getVersionFromBuildGradle(buildGradlePath) {
  const file = await fs.readFile(buildGradlePath, "utf8");
  return /version = '(.*)'/.exec(file)[1];
}

async function getNameFromSettingsGradle(settingsGradlePath) {
  const file = await fs.readFile(settingsGradlePath, "utf8");
  return /rootProject.name = '(.*)'/.exec(file)[1];
}

function getProjectVersion(branchName, originalAppVersion, buildId) {
  if (branchName === "main") {
    return /([^\/]+$)/.exec(originalAppVersion)[1] + `-${buildId}`;
  }
  if (branchName.includes("release")) {
    return /([^\/]+$)/.exec(originalAppVersion)[1].replace("-SNAPSHOT", "");
  }
  return "";
}

function generateFileBasedOffTemplate(
  templateString,
  buildContainer,
  serviceName,
  appName,
  appVersionWithTimestamp,
  originalAppVersion,
  branchName
) {
  Handlebars.registerHelper("ifIsMainOrRelease", function (arg1, options) {
    return String(arg1) == "main" || String(arg1).includes("release")
      ? options.fn(this)
      : options.inverse(this);
  });

  const template = Handlebars.compile(templateString);

  let buildImage = "";
  let buildArgs = "";
  if (buildContainer == "java17") {
    buildImage = "gradle:7.6.1-jdk17";
    buildArgs = "gradle build && cp -r build ../build";
  }
  const contents = template({
    serviceName,
    buildImage,
    buildArgs,
    appName,
    appVersion: appVersionWithTimestamp,
    originalAppVersion,
    branchName,
  });
  return contents.replace(/&amp;/g, "&");
}

async function generateCloudBuildYaml(
  brianPipelineFilePath,
  buildGradlePath,
  settingsGradlePath,
  cloudBuildTemplateFilePath,
  branchRef,
  buildId
) {
  const {
    buildContainer,
    envsToDeployTo: envs,
    serviceName,
  } = await readBrianPipelineYaml(brianPipelineFilePath);

  const branchName = getBranchName(branchRef);
  const originalAppVersion = await getVersionFromBuildGradle(buildGradlePath);

  const projectName = await getNameFromSettingsGradle(settingsGradlePath);
  const projectVersion = getProjectVersion(
    branchName,
    originalAppVersion,
    buildId
  );

  const templateString = await readCloudBuildTemplate(
    cloudBuildTemplateFilePath
  );
  const contents = generateFileBasedOffTemplate(
    templateString,
    buildContainer,
    serviceName,
    projectName,
    projectVersion,
    originalAppVersion,
    branchName
  );

  fs.writeFile("cloudbuild.yaml", contents);
}

generateCloudBuildYaml(
  process.argv[2],
  process.argv[3],
  process.argv[4],
  process.argv[5],
  process.argv[6],
  process.argv[7]
);
