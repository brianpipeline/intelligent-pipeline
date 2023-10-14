import {
  readBrianPipelineYaml,
  readCloudBuildTemplate,
  getBranchName,
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
  commitId
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
    branchName,
    repoName,
    cloneUrl,
    commitId,
  });
  return contents;
}

async function generateCloudBuildYaml(
  brianPipelineFilePath,
  cloudBuildTemplateFilePath,
  branchRef,
  repoName,
  cloneUrl,
  commitId
) {
  const { buildContainer, serviceName } = await readBrianPipelineYaml(
    brianPipelineFilePath
  );

  const branchName = getBranchName(branchRef);

  const templateString = await readCloudBuildTemplate(
    cloudBuildTemplateFilePath
  );

  const contents = generateFileBasedOffTemplate(
    templateString,
    buildContainer,
    serviceName,
    branchName,
    repoName,
    cloneUrl,
    commitId
  );

  fs.writeFile("cloudbuild-artifactbuild.yaml", contents);
}

generateCloudBuildYaml(
  process.argv[2],
  process.argv[3],
  process.argv[4],
  process.argv[5],
  process.argv[6],
  process.argv[7]
);
