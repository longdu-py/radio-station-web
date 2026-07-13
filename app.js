// DOM 元素
const audio = document.getElementById('radioAudio');
const playBtn = document.getElementById('playBtn');
const prevRadio = document.getElementById('prevRadio');
const nextRadio = document.getElementById('nextRadio');
const volumeSlider = document.getElementById('volumeSlider');
const sleepSelect = document.getElementById('sleepTime');
const collectBtn = document.getElementById('collectBtn');
const radioName = document.getElementById('radioName');
const radioDesc = document.getElementById('radioDesc');
const radioListBox = document.getElementById('radioList');
const tabBtns = document.querySelectorAll('.tab');
const canvas = document.getElementById('audioCanvas');
const ctx = canvas.getContext('2d');

// 自定义电台输入框
const titleInput = document.getElementById('radioTitle');
const urlInput = document.getElementById('radioUrl');
const addCustomBtn = document.getElementById('addCustomBtn');

// 全局变量
let allRadio = [
  { name: "伤感情歌电台", desc: "全天循环华语悲伤情歌", url: "https://live.xxxx.com/sad.m3u8" },
  { name: "深夜故事广播", desc: "情感故事、治愈夜话", url: "https://live.xxxx.com/story.m3u8" },
  { name: "城市音乐调频", desc: "流行轻音乐", url: "https://live.xxxx.com/music.m3u8" },
  { name: "怀旧老歌频道", desc: "8090经典伤感老歌", url: "https://live.xxxx.com/old.m3u8" },
];
let customRadio = JSON.parse(localStorage.getItem('customRadio')) || [];
let loveRadio = JSON.parse(localStorage.getItem('loveRadio')) || [];
let sleepTimer = null;
let currentIndex = 0;
let showTab = "all";
let isPlaying = false;
let audioCtx, analyser, dataArray;

// 合并官方+自定义电台
function getTotalRadio() {
  return [...allRadio, ...customRadio];
}

// 画布自适应频谱
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 音频可视化频谱
function initVisual() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  const source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 256;
  const bufferLen = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLen);
  drawWave();
}
function drawWave() {
  requestAnimationFrame(drawWave);
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width / dataArray.length;
  for (let i = 0; i < dataArray.length; i++) {
    const h = dataArray[i] * 2;
    const x = i * w;
    const grad = ctx.createLinearGradient(0, canvas.height/2 - h, 0, canvas.height/2 + h);
    grad.addColorStop(0, "#ff5599");
    grad.addColorStop(1, "#6b2b63");
    ctx.fillStyle = grad;
    ctx.fillRect(x, canvas.height/2 - h/2, w - 1, h);
  }
}

// 渲染电台列表
function renderList() {
  radioListBox.innerHTML = "";
  const total = getTotalRadio();
  let renderArr = showTab === "all" ? total : loveRadio;
  renderArr.forEach((radio, idx) => {
    const item = document.createElement("div");
    item.className = `radio-item ${
      total.indexOf(radio) === currentIndex && showTab === "all" ? "active" : ""
    }`;
    const text = document.createElement("div");
    text.innerHTML = `<strong>${radio.name}</strong><br><small>${radio.desc}</small>`;
    const tag = document.createElement("span");
    tag.className = "love-tag";
    tag.innerText = loveRadio.includes(radio) ? "♥" : "";
    item.appendChild(text);
    item.appendChild(tag);
    item.onclick = () => {
      const realIdx = total.findIndex(r => r.url === radio.url);
      playRadio(realIdx);
    };
    radioListBox.appendChild(item);
  });
}

// 更新收藏按钮状态
function refreshCollectBtn() {
  const total = getTotalRadio();
  const curr = total[currentIndex];
  if (!curr) return;
  if (loveRadio.some(r => r.url === curr.url)) {
    collectBtn.innerText = "♥ 已收藏";
    collectBtn.classList.add("love");
  } else {
    collectBtn.innerText = "♥ 收藏电台";
    collectBtn.classList.remove("love");
  }
}

// 播放指定电台
function playRadio(index) {
  const total = getTotalRadio();
  if (!total[index]) return;
  currentIndex = index;
  const station = total[index];
  audio.src = station.url;
  radioName.innerText = station.name;
  radioDesc.innerText = station.desc;
  audio.play().then(() => {
    isPlaying = true;
    playBtn.innerText = "暂停";
  }).catch(e => console.log("播放失败：源链接失效"));
  renderList();
  refreshCollectBtn();
  initVisual();
}

// 播放暂停切换
playBtn.onclick = () => {
  const total = getTotalRadio();
  if (!total[currentIndex] || !audio.src) {
    alert("请先选择一个电台频道！");
    return;
  }
  if (isPlaying) {
    audio.pause();
    playBtn.innerText = "播放";
  } else {
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    audio.play();
    playBtn.innerText = "暂停";
  }
  isPlaying = !isPlaying;
};

// 上一台、下一台
prevRadio.onclick = () => {
  const total = getTotalRadio();
  if (total.length === 0) return;
  currentIndex = currentIndex === 0 ? total.length - 1 : currentIndex - 1;
  playRadio(currentIndex);
};
nextRadio.onclick = () => {
  const total = getTotalRadio();
  if (total.length === 0) return;
  currentIndex = currentIndex === total.length - 1 ? 0 : currentIndex + 1;
  playRadio(currentIndex);
};

// 音量控制
volumeSlider.oninput = () => audio.volume = volumeSlider.value / 100;
audio.volume = volumeSlider.value / 100;

// 定时关闭逻辑
sleepSelect.onchange = () => {
  clearTimeout(sleepTimer);
  const minute = Number(sleepSelect.value);
  if (minute === 0) return;
  const ms = minute * 60 * 1000;
  sleepTimer = setTimeout(() => {
    audio.pause();
    isPlaying = false;
    playBtn.innerText = "播放";
    alert("定时结束，收音机已关闭");
  }, ms);
};

// 收藏/取消收藏
collectBtn.onclick = () => {
  const total = getTotalRadio();
  const curr = total[currentIndex];
  if (!curr) return;
  const find = loveRadio.findIndex(r => r.url === curr.url);
  if (find > -1) loveRadio.splice(find, 1);
  else loveRadio.push(curr);
  localStorage.setItem("loveRadio", JSON.stringify(loveRadio));
  refreshCollectBtn();
  renderList();
};

// 添加自定义电台
addCustomBtn.onclick = () => {
  const name = titleInput.value.trim();
  const url = urlInput.value.trim();
  if (!name || !url) {
    alert("名称和直播链接不能为空！");
    return;
  }
  customRadio.push({ name, desc: "自定义电台", url });
  localStorage.setItem("customRadio", JSON.stringify(customRadio));
  titleInput.value = "";
  urlInput.value = "";
  renderList();
  alert("自定义电台添加成功！");
};

// 切换标签 全部/收藏
tabBtns.forEach(tab => {
  tab.onclick = () => {
    tabBtns.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    showTab = tab.dataset.type;
    renderList();
  };
});

// 页面初始化渲染
renderList();
