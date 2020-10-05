'use strict';
const StoreType = {
  BILI: "bili",
  DOUYU: "douyu",
  HUYA: "huya",
}
const set = function(obj, k, v) {
  return Reflect.defineProperty(obj, k, {
    value: v,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
class Store{
  constructor(types) {
    this.notify = {};
    if (types === 'all') {
      types = [];
      for (let name of Object.getOwnPropertyNames(StoreType)) {
        types.push(StoreType[name]);
      }
    }
    if (!types || types.length === 0) {
      console.error("types is empty");
      return;
    }
    this.data = {};
    for (let type of types) {
      set(this.data, type, {});
    }
  }
  getUrlFromNotifyId(notifyId) {
    return this.notify[notifyId];
  }
  setNotifyId(notifyId, room) {
    set(this.notify, notifyId, room.url);
  }
  /**
   * 更新所有的数据
   * @param {[type: rooms] 新rooms数据} roomsObj 
   * @param {是否是第一次, 第一次新room不通知} isFirst 
   * @return {返回所有开播的房间}
   */
  updateRooms(roomsObj, isFirst) {
    let openRooms = [];
    for (let type of Object.getOwnPropertyNames(roomsObj)) {
      let rooms = this.getOpenRooms(type, roomsObj[type], isFirst);
      openRooms = openRooms.concat(rooms)
      this.updateTypeRooms(type, roomsObj[type])
    }
    return openRooms;
  }
  /**
   * @param {更新的数据类型} type
   * @param {新数据} newRooms
   */
  updateTypeRooms(type, newRooms) {
    let obj = this.data[type];
    if (!obj) {
      console.error("error type in updateTypeRooms");
      return false;
    }
    obj = {}
    newRooms.forEach((room) => {
      set(obj, room.nickName, room)
    })
    set(this.data, type, obj);
    return true;
  }
  /**
   * 
   * @param {Map类型 前一次获取的数据, key是房间id} oldRooms 
   * @param {Array类型 这一次获取的数据} newRooms 
   * @return {Array类型 开播的Rooms}
   */
  getOpenRooms(type, newRooms, isFirst) {
    let oldRooms = this.data[type];
    if (!oldRooms) {
      console.error("getOpenRooms error type")
      return [];
    }
    if (isFirst) {
      return [];
    } else {
      return newRooms.filter(room => {
        let oldRoom = oldRooms[room.nickName];
        if (!oldRoom) {
          return room.isOpen;
        }
        return (!oldRoom.isOpen && room.isOpen);
      })
    }
  }
}

export {
  Store,
  StoreType
}
