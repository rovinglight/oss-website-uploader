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

const stepSuccess = () => console.log(chalk.green("✓ 成功"));

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
  console.log("[1/3] 开始获取 Bucket 中的旧文件列表");
  const allOldFilesInBucket = [];
  let continuationToken = null;
  do {
    let result = await client.listV2({
      "continuation-token": continuationToken,
      "max-keys": 1000,
    });
    continuationToken = result.nextContinuationToken;
    allOldFilesInBucket.push(...result.objects);
  } while (continuationToken);
  stepSuccess();

  // 上传文件
  console.log("[2/3] 上传本地文件");
  const localDirPath = path.normalize(path.join(cwd(), config.dir));
  const allFilesInLocalDir = (await fg(`${localDirPath}/**`)).map(
    (absolutePath) => ({
      absolutePath,
      relativePath: path.relative(localDirPath, absolutePath),
    })
  );
  for (const i in allFilesInLocalDir) {
    const fileToUpload = allFilesInLocalDir[i];
    const extname = path.extname(fileToUpload.relativePath);
    const rulesToApply = config.rules
      .filter((rule) => rule.test.test(extname))
      .map((rule) => _.omit(rule, ["test"]));
    const option = _.merge({}, ...rulesToApply);
    console.log(
      chalk.blue(" -> ") +
        "Uploading " +
        path.basename(fileToUpload.relativePath)
    );
    await client.put(
      fileToUpload.relativePath,
      fileToUpload.absolutePath,
      option
    );
  }
  stepSuccess();

  // 删除 Bucket 中的旧文件
  console.log("[3/3] 删除 Bucket 中的旧文件");
  const filesToDelete = allOldFilesInBucket
    .filter((oldFile) =>
      allFilesInLocalDir.every(
        (localFile) => localFile.relativePath !== oldFile.name
      )
    )
    .map((fileObject) => fileObject.name);
  if (!_.isEmpty(filesToDelete)) {
    await client.deleteMulti(filesToDelete);
  }
  stepSuccess();
})();
