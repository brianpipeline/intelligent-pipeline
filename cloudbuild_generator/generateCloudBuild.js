import { promises as fs } from "fs";
import YAML from "yaml";
import Handlebars from "handlebars";

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

function generateFileBasedOffTemplate(
  templateString,
  buildContainer,
  serviceName,
  appName,
  appVersion
) {
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
    appVersion
  });
  return contents.replace(/&amp;/g, "&");
}

async function generateCloudBuildYaml(
  brianPipelineFilePath,
  buildGradlePath,
  settingsGradlePath,
  cloudBuildTemplateFilePath
) {
  const {
    buildContainer,
    envsToDeployTo: envs,
    serviceName,
  } = await readBrianPipelineYaml(brianPipelineFilePath);

  const projectName = await getNameFromSettingsGradle(settingsGradlePath);
  const projectVersion = await getVersionFromBuildGradle(buildGradlePath);

  const templateString = await readCloudBuildTemplate(
    cloudBuildTemplateFilePath
  );
  const contents = generateFileBasedOffTemplate(
    templateString,
    buildContainer,
    serviceName,
    projectName,
    projectVersion
  );

  fs.writeFile("cloudbuild.yaml", contents);
}

generateCloudBuildYaml(
  process.argv[2],
  process.argv[3],
  process.argv[4],
  process.argv[5]
);
