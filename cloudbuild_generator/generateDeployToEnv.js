import {
  readBrianPipelineYaml,
  readCloudBuildTemplate,
} from "./commonFunctions.js";
import Handlebars from "handlebars";
import { promises as fs } from "fs";

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
  const { buildContainer, serviceName } = await readBrianPipelineYaml(
    brianPipelineFilePath
  );

  const templateString = await readCloudBuildTemplate(
    cloudBuildTemplateFilePath
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
    originalAppVersion
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
