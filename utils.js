async function sleep(delay) {
  return new Promise((reslove) => setTimeout(reslove, delay));
}
function notify(room) {
  if (!room) return;
  /**
   * 创建通知: create(notifyid, option, callback);
   * option: {
   * type @basic @image @list @progress
   * iconUrl data URL, a blob URL, or a URL relative to a resource 
   * title
   * message
   * }
   */
  console.log(room)
  return new Promise((resolve) => {
    chrome.notifications.create(undefined,{
      type: "basic",
      iconUrl: "icon.png",
      title: "开播通知",
      message:`${room.nickName}开播了`,
    },(id)=>{
      resolve(id);
      // let oldRoom = map.get(room.nickName);
      // if (!oldRoom) return;
      // oldRoom.notifyId = id;
    })
  });
}
function map2obj(map) {
  let obj = {};
    for (let [k,v] of map.entries()){
    Reflect.defineProperty(obj,k,{value: v});
  }
  return obj;
}
export {
  sleep,
  notify
}
