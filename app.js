const store = require('./utils/store');
const cloud = require('./utils/cloud');

App({
  globalData: {
    version: '0.1.0'
  },
  onLaunch() {
    store.init();
    cloud.init();
  }
});
