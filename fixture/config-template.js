module.exports = {
  accessKeyId: "",
  accessKeySecret: "",
  bucket: "", // bucket 名称
  region: "", // bucket 所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
  dir: "dist", // 上传的本地目录名称
  rules: [
    // 禁止对 HTML 文件的缓存
    {
      test: /\.html$/i,
      headers: {
        "Cache-Control": "no-cache",
      },
    },
    // 设置图片文件的缓存时间为 30 天，建议图片打包时带上哈希值
    {
      test: /\.(ico|jpe?g|png|gif|svg|webp)$/i,
      headers: {
        "Cache-Control": "max-age=2592000, public",
      },
    },
  ],
};
