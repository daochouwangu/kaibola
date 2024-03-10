getData().then((data) => {
  renderData(data)
});
function showTime(n) {
  let t = ((Date.now() - n*1000) / 60000).toFixed(0);
  let i = t % 60;
  let s = Math.floor(t / 60);
  return `已播${s}时${i}分`
}
function renderData(data) {
  let container = document.getElementById("app");
  for (let i in data) {
    let subContainer = document.createElement("ul");
    renderDoms(subContainer, i, data[i])
    container.appendChild(subContainer)
  }
}
function renderDoms(container, type, data) {
  let h = document.createElement("h1");
  switch(type){
    case "bili": h.textContent = "哔哩哔哩（仅特殊关注）";break;
    case "huya": h.textContent = "虎牙";break;
    case "douyu": h.textContent = "斗鱼";break;
  }
  container.appendChild(h)
  for (let i in data) {
    let room = data[i];
    if (!room.isOpen) {
      continue;
    }
    let li = document.createElement("li")
    let a = document.createElement("a");
    a.href = room.url;
    a.target = "_blank";
    let img = document.createElement("img");
    img.src = room.snapshot;
    let div = document.createElement("div");
    div.className = "info";
    a.append(img);
    a.append(div);
    let title = document.createElement("p");
    let name = document.createElement("p")
    let openTime = document.createElement("p");
    title.textContent = room.roomName;
    title.className = "title"
    name.textContent = room.nickName;
    name.className = "nickname"
    openTime.textContent = showTime(room.showTime);
    openTime.className = "time"
    div.appendChild(title);
    div.appendChild(name);
    div.append(openTime)
    li.appendChild(a);
    container.appendChild(li)
  }
}
function getData() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({type: "getData"}, function(response) {
      console.log(response)
      resolve(response.data);
    });
  })
}

