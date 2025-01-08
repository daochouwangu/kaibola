export interface Room {
    // 开播时间
    showTime: string;
    // 房间号
    roomId: string;
    // 是否开播
    isOpen: boolean;
    // 直播间地址
    url: string;
    // 直播间名称
    roomName: string;
    // 主播昵称
    nickName: string;
    // 主播头像
    snapshot: string;
}