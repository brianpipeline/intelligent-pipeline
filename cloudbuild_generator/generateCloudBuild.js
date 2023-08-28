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

function generateFileBasedOffTemplate(
  templateString,
  buildContainer,
  serviceName,
  dockerfilePath
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
    dockerfilePath,
  });
  return contents.replace(/&amp;/g, "&");
}

async function generateCloudBuildYaml(
  brianPipelineFilePath,
  cloudBuildTemplateFilePath
) {
  const {
    "dockerfile.path": dockerfilePath,
    buildContainer,
    envsToDeployTo: envs,
    serviceName,
  } = await readBrianPipelineYaml(brianPipelineFilePath);

  const templateString = await readCloudBuildTemplate(
    cloudBuildTemplateFilePath
  );
  const contents = generateFileBasedOffTemplate(
    templateString,
    buildContainer,
    serviceName,
    dockerfilePath
  );

  fs.writeFile("cloudbuild.yaml", contents);
}

generateCloudBuildYaml(process.argv[2], process.argv[3]);
