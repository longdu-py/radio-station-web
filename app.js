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
const titleInput = document.getElementById('radioTitle');
const urlInput = document.getElementById('radioUrl');
const addCustomBtn = document.getElementById('addCustomBtn');

// 内置稳定伤感/情感/怀旧电台m3u8源
let allRadio = [
  { name: "中央音乐之声", desc: "流行情歌、全天情感音乐循环", url: "http://ngcdn003.cnr.cn/live/yyzs/index.m3u8" },
  { name: "中央经典音乐广播", desc: "8090怀旧伤感老歌合集", url: "http://ngcdn004.cnr.cn/live/dszs/index.m3u8" },
  { name: "广东音乐之声", desc: "粤语伤感情歌、华语金曲", url: "http://satellitepull.cnr.cn/live/wxgdyyzs/playlist.m3u8" },
  { name: "河南经济广播", desc: "深夜情感夜话、治愈故事", url: "https://stream.hndt.com/live/jingji/playlist.m3u8" },
  { name: "舒缓治愈电台", desc: "纯音乐、失眠安静氛围", url: "http://stream.radioparadise.com/mellow-flacm" },
  { name: "宁静轻音乐频道", desc: "放松独处、深夜独白背景音", url: "http://stream.radioparadise.com/serenity" },
  { name: "欧美灵魂伤感电台", desc: "抒情慢歌、深夜emo氛围", url: "https://ice5.somafm.com/7soul-128-aac" }
];

let customRadio = JSON.parse(localStorage.getItem('customRadio')) || [];
let loveRadio = JSON.parse(localStorage.getItem('loveRadio')) || [];
let sleepTimer = null;
let currentIndex = 0;
let showTab = "all";
let isPlaying = false;
let audioCtx, analyser, dataArray;

function getTotalRadio() {
  return [...allRadio, ...customRadio];
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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

function renderList() {
  radioListBox.innerHTML = "";
  const total = getTotalRadio();
  let renderArr = showTab === "all" ? total : loveRadio;
  renderArr.forEach((radio, idx) => {
    const item = document.createElement("div");
    item.className = `radio-item ${total.indexOf(radio) === currentIndex && showTab === "all" ? "active" : ""}`;
    const text = document.createElement("div");
    text.innerHTML = `<strong>${radio.name}</strong><br><small>${radio.desc}</small>`;
    const tag = document.createElement("span");
    tag.className = "love-tag";
    tag.innerText = loveRadio.some(r=>r.url === radio.url) ? "♥" : "";
    item.appendChild(text);
    item.appendChild(tag);
    item.onclick = () => {
      const realIdx = total.findIndex(r => r.url === radio.url);
      playRadio(realIdx);
    };
    radioListBox.appendChild(item);
  });
}

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
  }).catch(e => {
    alert("该电台源加载失败，更换其他频道或直播链接");
    console.log(e);
  });
  renderList();
  refreshCollectBtn();
  initVisual();
}

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

volumeSlider.oninput = () => audio.volume = volumeSlider.value / 100;
audio.volume = volumeSlider.value / 100;

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

addCustomBtn.onclick = () => {
  const name = titleInput.value.trim();
  const url = urlInput.value.trim();
  if (!name || !url) {
    alert("电台名称与直播链接不能为空");
    return;
  }
  customRadio.push({ name, desc: "自定义情感电台", url });
  localStorage.setItem("customRadio", JSON.stringify(customRadio));
  titleInput.value = "";
  urlInput.value = "";
  renderList();
  alert("自定义电台添加成功");
};

tabBtns.forEach(tab => {
  tab.onclick = () => {
    tabBtns.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    showTab = tab.dataset.type;
    renderList();
  };
});

renderList();
