import { promises as fs } from "fs";
import YAML from "yaml";

export async function readBrianPipelineYaml(brianPipelineFilePath) {
  const file = await fs.readFile(brianPipelineFilePath, "utf8");
  return YAML.parse(file);
}

export async function readCloudBuildTemplate(cloudBuildTemplateFilePath) {
  return await fs.readFile(cloudBuildTemplateFilePath, "utf8");
}

export function getBranchName(branchRef) {
  return /heads\/(.*)/.exec(branchRef)[1];
}

export async function getVersionFromBuildGradle(buildGradlePath) {
  const file = await fs.readFile(buildGradlePath, "utf8");
  return /version = '(.*)'/.exec(file)[1];
}

export async function getNameFromSettingsGradle(settingsGradlePath) {
  const file = await fs.readFile(settingsGradlePath, "utf8");
  return /rootProject.name = '(.*)'/.exec(file)[1];
}

export function getProjectVersion(branchName, originalAppVersion, timestamp) {
  if (branchName === "main") {
    return /([^\/]+$)/.exec(originalAppVersion)[1] + `-${timestamp}`;
  }
  if (branchName.includes("release")) {
    return /([^\/]+$)/.exec(originalAppVersion)[1].replace("-SNAPSHOT", "");
  }
  return "";
}
