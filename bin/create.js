#!/usr/bin/env node
import degit from 'degit';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';

const TEMPLATE_REPO = 'AnastasiaAtTerrestrialOrigin/lib-template';

/**
 * Recursively replace placeholders in all text files.
 * @param {string} dir - Directory to process.
 * @param {object} replacements - Key/value pairs for replacements.
 */
async function replacePlaceholders(dir, replacements) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await replacePlaceholders(fullPath, replacements);
    } else {
      let content = await fs.readFile(fullPath, 'utf8');
      for (const [placeholder, value] of Object.entries(replacements)) {
        const regex = new RegExp(`{{\\s*${placeholder}\\s*}}`, 'g');
        content = content.replace(regex, value);
      }
      await fs.writeFile(fullPath, content);
    }
  }
}

async function main() {
  // Prompt for project-specific details
  const answers = await inquirer.prompt([
    {
      name: 'projectName',
      message: 'Project name:',
      default: ''
    },
    {
      name: 'description',
      message: 'Description:',
      default: ''
    },
    {
      name: 'author',
      message: 'Author:',
      default: ''
    },
    {
      name: 'license',
      message: 'License:',
      default: 'MIT'
    },
    {
      name: 'keywords',
      message: 'Keywords:',
      default: 'template, npm, library'
    },
    {
      name: 'repository',
      message: 'Repository:',
      default: ''
    }
  ]);

  // Create default git url, and homepage from git url
  let gitUrl = answers.repository;
  if (gitUrl) {
    const homepage = gitUrl.replace('.git', '#readme');
    const bugs = gitUrl.replace('.git', '#issues');
    answers.homepage = homepage;
    answers.bugs = bugs;
    answers.repository = "git+" + gitUrl;
  }


  // Define the target directory for the new project.
  const targetDir = path.resolve(process.cwd(), answers.projectName);

  // Use degit to clone your template repository from GitHub.
  const emitter = degit(TEMPLATE_REPO, {
    cache: false,
    force: true,
    verbose: true
  });
  console.log(`Cloning template into ${targetDir}...`);
  await emitter.clone(targetDir);

  // Replace placeholders in the copied files:
  const replacements = {
    projectName: answers.projectName
  };
  console.log("Replacing placeholders...");
  await replacePlaceholders(targetDir, replacements);

  console.log(`\nProject ${answers.projectName} has been created successfully!`);
  console.log(`\nTo get started, try:\n  cd ${answers.projectName}\n  npm install\n  npm run dev`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});