# oss-website-uploader

[![CI](https://github.com/rovinglight/oss-website-uploader/actions/workflows/ci.yml/badge.svg)](https://github.com/rovinglight/oss-website-uploader/actions/workflows/ci.yml)

`oss-website-uploader` 是一个用来更新静态网站至阿里云 OSS 的命令行工具。

如果你时不时会需要将阿里云 OSS 中的某个 Bucket 强制同步成某个本地文件夹的内容，那么这个库也会是一个好的选择。

## 使用方法

这个库不会为你创建 Bucket。所以使用之前需要先确保已有创建好了的 Bucket。创建 Bucket 可以参考[阿里云文档](https://help.aliyun.com/document_detail/31883.html)。

上传过程中会使用到阿里云的访问密钥，即 `accessKeyId` 和 `accessKeySecret`。创建方法参考[阿里云文档](https://help.aliyun.com/document_detail/116401.html)，建议使用 RAM 用户（拥有 OSS 权限）创建，而非主账户。

最简单的使用方法是直接在项目下运行 `npx oss-website-uploader`。当然你也可以通过下述流程安装库至项目中。

首先安装 `oss-website-uploader` 至项目根目录。

```bash
yarn add -D oss-website-uploader
```

在 `package.json` 中添加部署脚本。

```json
// package.json
{
  "script": {
    "deploy-oss": "oss-website-uploader"
  }
}
```

运行部署脚本时会检查目录下是否有配置文件 `oss-website-uploader.config.js`，若没有则会在当前目录下创建一个。

```bash
yarn deploy-oss
```

参照[配置](#配置)环节对 `oss-website-uploader.config.js` 进行配置。配置完成后再次运行部署脚本，库便会解析配置并开始文件上传。

```bash
yarn deploy-oss
```

如果 Bucket 有配置 CDN，那么需要在「传输管理 -> 域名管理」中打开「CDN 缓存自动刷新」，勾选 `PutObject` 以及 `DeleteObject` 两个选项。

## 配置

默认的配置文件长下面这个样子：

```javascript
module.exports = {
  accessKeyId: "",
  accessKeySecret: "",
  bucket: "",
  region: "",
  dir: "dist",
  rules: [
    // 禁止对 HTML 文件的缓存
    {
      test: /\.html$/i,
      headers: {
        "Cache-Control": "no-cache",
      },
    },
    // 设置图片文件的缓存时间为 30 天
    {
      test: /\.(ico|jpe?g|png|gif|svg|webp)$/i,
      headers: {
        "Cache-Control": "max-age=2592000, public",
      },
    },
  ],
};

```

详细配置如下：

- `accessKeyId` - 必填 - 阿里云访问密钥 ID
- `accessKeySecret` - 必填 - 阿里云访问密钥 Secret
- `bucket` - 必填 - Bucket 名称
- `region` - 必填 - bucket 所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou
- `dir` - 必填 - 要上传的本地目录名称
- `rules` - 选填 - 文件的上传配置。被 `test` 字段匹配到的文件上传时都会加上对应 rule 的配置
  - `test` - 必填 - 用来匹配文件名称的正则表达式
  - 其余字段对应 [ali-oss put 方法](https://github.com/ali-sdk/ali-oss#putname-file-options) 的 `options` 字段。

其中 `accessKeyId` 和 `accessKeySecret` 不应当被提交至仓库中。最好使用环境变量或通过 `require`、 [dotenv](https://www.npmjs.com/package/dotenv) 加载被 gitignore 的配置文件来达成目的。

## 这个库做了啥

1. 解析当前目录下的 `oss-website-uploader.config.js` 配置文件，没有配置文件则创建一个。
2. 获取 Bucket 中现存的文件 `oldFiles`。
3. 上传 `dir` 中的文件 `newFiles` 至 Bucket。
4. 删除 Bucket 中的旧文件。删除的文件是 `newFiles` 在 `oldFiles`中的相对补集。
