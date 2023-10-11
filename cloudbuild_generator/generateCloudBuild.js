import { promises as fs } from "fs";
import YAML from "yaml";
import Handlebars from "handlebars";

function getBranchName(branchRef) {
  return /.*[\/](.*)/.exec(branchRef)[1];
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

async function getProjectVersion(branchName, buildGradlePath) {
  const version = await getVersionFromBuildGradle(buildGradlePath);
  if (branchName === "main") {
    return /([^\/]+$)/.exec(version)[1].replace("SNAPSHOT", Date.now());
  }
  if (branchName.includes("release")) {
    return /([^\/]+$)/.exec(version)[1].replace("-SNAPSHOT", "");
  }
  return "";
}

function generateFileBasedOffTemplate(
  templateString,
  buildContainer,
  serviceName,
  appName,
  appVersion,
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
    appVersion,
    branchName,
  });
  return contents.replace(/&amp;/g, "&");
}

async function generateCloudBuildYaml(
  brianPipelineFilePath,
  buildGradlePath,
  settingsGradlePath,
  cloudBuildTemplateFilePath,
  branchRef
) {
  const {
    buildContainer,
    envsToDeployTo: envs,
    serviceName,
  } = await readBrianPipelineYaml(brianPipelineFilePath);

  const branchName = getBranchName(branchRef);

  const projectName = await getNameFromSettingsGradle(settingsGradlePath);
  const projectVersion = await getProjectVersion(branchName, buildGradlePath);

  const templateString = await readCloudBuildTemplate(
    cloudBuildTemplateFilePath
  );
  const contents = generateFileBasedOffTemplate(
    templateString,
    buildContainer,
    serviceName,
    projectName,
    projectVersion,
    branchName
  );

  fs.writeFile("cloudbuild.yaml", contents);
}

generateCloudBuildYaml(
  process.argv[2],
  process.argv[3],
  process.argv[4],
  process.argv[5],
  process.argv[6]
);
