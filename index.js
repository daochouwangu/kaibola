import { dyFetch } from './douyu.js';
import { biliFetch } from './bilibili.js';
import { sleep, notify } from './utils.js';
import { Store, StoreType } from './Store.js';
import { hyFetch } from './huya.js';
function hoc(fetchFunc) {
  return new Promise((resolve) => resolve(fetchFunc()))
}
let store = new Store('all');
let unread = 0;
/**
 * 
 * type Room {
  * showTime 开播时间
  * roomId: 房间号
  * isOpen: 是否开播
  * url, 房间地址
  * roomName: 房间名
  * nickName: 主播名
 * }
 */
async function run(delay = 10000) {
  console.log("Running ")
  let isFirst = true;
  while(true) {
    let data = null;
    await Promise.all([hoc(biliFetch), hoc(dyFetch), hoc(hyFetch)]).then(arr => {
      data = {
        [StoreType.BILI]: arr[0],
        [StoreType.DOUYU]: arr[1],
        [StoreType.HUYA]: arr[2]
      }
    }, (err) => { console.error(err);})
    
    let openRooms = store.updateRooms(data, isFirst);
    if (openRooms.length > 0) {
      for (let room of openRooms) {
        let notifyId = await notify(room);
        store.setNotifyId(notifyId, room);
      }
    }
    unread += openRooms.length;
    renderBadge();
    emitDataUpdateEvent();
    await sleep(delay);
    isFirst = false;
  }
}
/**
 * 渲染小红点
 */
function renderBadge() {
  let str = ""+unread;
  if (unread === 0) str = "";
  if (unread > 9) str = "9+";
  chrome.browserAction.setBadgeText({text: str});
}
/**
 * 通知点击跳转
 */
chrome.notifications.onClicked.addListener((notifyId) => {
  let url = store.getUrlFromNotifyId(notifyId);
  if (url) {
    chrome.tabs.create({url});
  }
})
/**
 * popup打开 会发起一个message 来获取最新的store, 这里监听这个事件
 */
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    // 取消红点
    unread = 0;
    renderBadge();
    sendResponse({type:"update", data: store.data});
  }
);
run();
