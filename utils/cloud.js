// CloudBase access. The cloud function calls getWXContext().OPENID server-side;
// no AppSecret is ever shipped to the mini program.
const ENV = 'cloud1-d1g5c1dfgd99f3986';
let initialized = false;

function available() {
  return typeof wx !== 'undefined' && !!wx.cloud && !!wx.cloud.callFunction;
}

function init() {
  if (initialized || !wx.cloud) return;
  wx.cloud.init({ env: ENV, traceUser: true });
  initialized = true;
}

function call(action, payload) {
  init();
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'api',
      data: { action, payload: payload || {} },
      success(res) {
        const result = res && res.result;
        if (result && result.ok) {
          resolve(result.data);
          return;
        }
        const error = (result && result.error) || { code: 'INTERNAL', message: '服务暂时不可用' };
        const err = new Error(error.message || '服务暂时不可用');
        err.code = error.code;
        reject(err);
      },
      fail(err) {
        const error = new Error((err && err.errMsg) || '网络连接失败');
        error.code = 'NETWORK';
        reject(error);
      }
    });
  });
}

function upload(filePath, prefix) {
  init();
  if (!filePath) return Promise.reject(new Error('没有选择图片'));
  return new Promise((resolve, reject) => {
    const ext = (String(filePath).match(/\.[a-zA-Z0-9]+$/) || ['.jpg'])[0];
    const cloudPath = (prefix || 'uploads') + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success(res) { resolve(res.fileID); },
      fail(err) { reject(new Error((err && err.errMsg) || '图片上传失败')); }
    });
  });
}

module.exports = { ENV, available, init, call, upload };
