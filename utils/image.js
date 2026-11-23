// Local image persistence for custom dishes.
// Saved files live in wx.env.USER_DATA_PATH and survive app restarts.
function extensionOf(filePath) {
  const match = String(filePath || '').match(/\.[a-zA-Z0-9]{2,5}$/);
  return match ? match[0].toLowerCase() : '.jpg';
}

function fileSystem() {
  return wx.getFileSystemManager ? wx.getFileSystemManager() : null;
}

function userRoot() {
  return (wx.env && wx.env.USER_DATA_PATH) || '';
}

function saveTempFile(tempFilePath) {
  return new Promise((resolve, reject) => {
    const fs = fileSystem();
    const root = userRoot();
    if (!fs || !root || !fs.saveFile) {
      resolve(tempFilePath);
      return;
    }
    const filePath = root + '/dish-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + extensionOf(tempFilePath);
    fs.saveFile({
      tempFilePath,
      filePath,
      success: (res) => resolve((res && res.savedFilePath) || filePath),
      fail: () => reject(new Error('图片保存失败，请重试'))
    });
  });
}

function compress(src) {
  return new Promise((resolve) => {
    if (!wx.compressImage) {
      resolve(src);
      return;
    }
    wx.compressImage({
      src,
      quality: 76,
      success: (res) => resolve((res && res.tempFilePath) || src),
      fail: () => resolve(src)
    });
  });
}

function pick() {
  return new Promise((resolve, reject) => {
    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success: (res) => {
          const file = (res.tempFiles || [])[0];
          if (file && file.tempFilePath) resolve(file.tempFilePath);
          else reject(new Error('没有选到图片'));
        },
        fail: (err) => {
          const msg = (err && err.errMsg) || '';
          if (/cancel/i.test(msg)) reject(new Error('已取消选择图片'));
          else if (/privacy|隐私/i.test(msg)) reject(new Error('请先在小程序后台配置相册/摄像头隐私权限'));
          else reject(new Error('打开相册失败，请重试'));
        }
      });
      return;
    }
    if (wx.chooseImage) {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const file = (res.tempFilePaths || [])[0];
          if (file) resolve(file);
          else reject(new Error('没有选到图片'));
        },
        fail: (err) => {
          const msg = (err && err.errMsg) || '';
          if (/cancel/i.test(msg)) reject(new Error('已取消选择图片'));
          else if (/privacy|隐私/i.test(msg)) reject(new Error('请先在小程序后台配置相册/摄像头隐私权限'));
          else reject(new Error('打开相册失败，请重试'));
        }
      });
      return;
    }
    reject(new Error('当前微信版本不支持选择图片'));
  });
}

async function chooseAndSave() {
  const tempFilePath = await pick();
  const compressed = await compress(tempFilePath);
  return saveTempFile(compressed);
}

function remove(filePath) {
  if (!filePath) return;
  const root = userRoot();
  if (!root || filePath.indexOf(root) !== 0) return;
  const fs = fileSystem();
  if (fs && fs.unlink) fs.unlink({ filePath, fail: () => {} });
}

function clearSaved() {
  const root = userRoot();
  const fs = fileSystem();
  if (!root || !fs || !fs.readdir) return;
  fs.readdir({
    dirPath: root,
    success: (res) => {
      (res.files || []).filter((name) => name.indexOf('dish-') === 0).forEach((name) => {
        fs.unlink({ filePath: root + '/' + name, fail: () => {} });
      });
    },
    fail: () => {}
  });
}

module.exports = { chooseAndSave, remove, clearSaved };
