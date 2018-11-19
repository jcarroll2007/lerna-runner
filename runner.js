#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const chalk = require('chalk')
const globby = require('globby')
const shell = require('shelljs')

const cwd = process.cwd()
const pkgJson = require(path.join(cwd, 'package.json'))

// Ask the user which package they would like to run the script in.
async function promptPackage() {
  const { workspaces } = pkgJson
  const globOpts = {
    cwd,
    strict: true,
    absolute: true
  }

  // All package paths
  const packages = workspaces.reduce((pkgs, pattern) =>
      pkgs.concat(globby.sync(path.join(pattern, 'package.json'), globOpts)),
      []
    )
    .map(f => path.dirname(path.normalize(f)))

  // All package names
  const packageMap = {}
  packages.forEach((pkgPath) => {
    const { name } = JSON.parse(
      fs.readFileSync(path.resolve(pkgPath, 'package.json'))
    )
    packageMap[name] = pkgPath
  })

  const questions = [{
    type: "list",
    name: "pkg",
    message: "Which package would you like to run a script in?",
    choices: Object.keys(packageMap)
  }]
  const { pkg } = await inquirer.prompt(questions)
  return {
    name: pkg,
    path: packageMap[pkg]
  }
}

// Ask the user which script they would like to run.
async function promptScript(packagePath) {
  const { scripts } = JSON.parse(
    fs.readFileSync(path.resolve(packagePath, 'package.json'))
  )
  const question = {
    type: "list",
    name: "script",
    message: "Which script would you like to run?",
    choices: Object.keys(scripts)
  }
  const { script } = await inquirer.prompt([question])
  return {
    script: script,
    command: scripts[script]
  }
}

const run = async () => {
  console.log(
    chalk.yellow(
      'Monorepo Runner - run any script on any package quickly.'
    )
  )

  let { name, path } = await promptPackage()
  const { script, command } = await promptScript(path)

  console.log(
    chalk.yellow('-----------------------------\n'),
    chalk.yellow('Running script'),
    chalk.red(script),
    chalk.yellow('for'),
    chalk.red(name),
    chalk.yellow('\n-----------------------------')
  )


  shell.cd(path)
  shell.exec(command)
}

run()
