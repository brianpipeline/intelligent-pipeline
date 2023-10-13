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

function getBranchName(branchRef) {
  return /heads\/(.*)/.exec(branchRef)[1];
}

function generateFileBasedOffTemplate(
  templateString,
  buildContainer,
  serviceName,
  branchName,
  repoName,
  cloneUrl
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
    branchName,
    repoName,
    cloneUrl,
  });
  return contents.replace(/&amp;/g, "&");
}

async function generateCloudBuildYaml(
  brianPipelineFilePath,
  cloudBuildTemplateFilePath,
  branchRef,
  repoName,
  cloneUrl
) {
  const { buildContainer, serviceName } = await readBrianPipelineYaml(
    brianPipelineFilePath
  );

  const branchName = getBranchName(branchRef);

  const templateString = await readCloudBuildTemplate(
    cloudBuildTemplateFilePath
  );

  if (branchName === "main" || branchName.includes("release")) {
    const contents = generateFileBasedOffTemplate(
      templateString,
      buildContainer,
      serviceName,
      branchName,
      repoName,
      cloneUrl
    );

    fs.writeFile("cloudbuild-artifactbuild.yaml", contents);
  } else {
    const contents = generateFileBasedOffTemplate(
      templateString,
      buildContainer,
      serviceName,
      branchName,
      repoName,
      cloneUrl
    );

    fs.writeFile("cloudbuild-artifactbuild.yaml", contents);
  }
}

generateCloudBuildYaml(
  process.argv[2],
  process.argv[3],
  process.argv[4],
  process.argv[5],
  process.argv[6]
);
