import { promises as fs } from "fs";
import Handlebars from "handlebars";

async function readDockerfileTemplate(dockerfileTemplate) {
  return await fs.readFile(dockerfileTemplate, "utf8");
}

function generateFileBasedOffTemplate(templateString, appName) {
  const template = Handlebars.compile(templateString);
  const contents = template({
    appName,
  });
  return contents.replace(/&amp;/g, "&");
}

async function generateDockerfile(
  projectName,
  projectVersion,
  dockerfileTemplatePath
) {
  const templateString = await readDockerfileTemplate(dockerfileTemplatePath);
  const contents = generateFileBasedOffTemplate(
    templateString,
    `${projectName}-${projectVersion}`
  );

  fs.writeFile("Dockerfile", contents);
}
// It gets the version from the build gradle but the app name from the settings gradle.

generateDockerfile(process.argv[2], process.argv[3], process.argv[4]);
