#!/usr/bin/env node

// Native
const { cwd, exit } = require("process");
const fs = require("fs");
const path = require("path");

// Packages
const chalk = require("chalk");
const OSS = require("ali-oss");
const fg = require("fast-glob");
const _ = require("lodash");

// Code
const { configFileName } = require("../constants");

const createNewConfigFile = () => {
  fs.copyFileSync(
    path.join(__dirname, "../fixture/config-template.js"),
    path.join(cwd(), configFileName)
  );
};

(async () => {
  let config = {};
  try {
    const configFilePath = path.join(cwd(), configFileName);
    config = require(configFilePath);
  } catch {
    console.log(chalk.black.bgYellow("当前目录下未找到配置文件"));
    console.log(chalk.black.bgGreen("已为您创建如下配置文件，快去配置吧"));
    console.log("\n 👉 oss-website-uploader.config.js\n");
    createNewConfigFile();
    exit(0);
  }

  const client = new OSS(
    _.pick(config, ["region", "accessKeyId", "accessKeySecret", "bucket"])
  );

  // 获取当前 bucket 中的所有文件
  let continuationToken = null;
  do {
    let result = await client.listV2({
      "continuation-token": continuationToken,
      "max-keys": 1000,
    });
    continuationToken = result.nextContinuationToken;
    console.log(result);
  } while (continuationToken);
})();
