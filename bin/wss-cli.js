#!/usr/bin/env node

const program = require('commander')
const prompts = require('prompts')
const path = require('path')
const fs = require('fs')
const pkg = require('../package.json')
const { DrawStructure } = require('../src')
const utils = require('../src/utils')

const currDir = process.cwd()

  program
  .version(pkg.version)
  .usage('<command> [options]')
  .option('-v, --version', 'latest version')

  program
  .command('start')
  .option('-c, --config [file...]', '指定配置文件')
  .description('start create a skeleton screen')
  .action(function(env, options) {
    const config = options?.config ?? 'wss.config.js';
    new DrawStructure(getDpsconfig(config)).start();
  });

  program.parse(process.argv);
  if (program.args.length < 1) program.help()

function getDpsconfig(config) {
  const dpsConfFile = path.resolve(currDir, config)
  if(!fs.existsSync(dpsConfFile)) {
    return utils.log.error(`config file not found`, 1)
  }
  return require(dpsConfFile);
}
