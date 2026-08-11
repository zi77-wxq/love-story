# 表白故事网站初稿

直接双击 `index.html` 即可预览。

## 替换素材

- 在 `index.html` 中搜索 `【`，把方括号里的占位内容替换成你的故事文字。
- 照片在 `script.js` 顶部的 `photos` 数组中替换。可以使用本地路径，例如 `images/first.jpg`。
- 音乐已接入 `audio/xuyue.flac`。如果之后更换音乐，把新文件放进 `audio` 文件夹并修改 `index.html` 最底部的 `<source>` 路径即可。

二维码和 NFC 本质上都只需要指向网站网址。网站部署到网上后，用该网址生成二维码；NFC 标签则写入同一个网址即可。
