/* global document, Audio */
const ytsr = require("ytsr");
const ytdl = require("ytdl-core");
const { Base64Encode } = require("base64-stream");
//const { remote } = require("electron");
//const win = remote.getCurrentWindow();
const audio = new Audio();

const cover = document.getElementById("currentCover"),
    title = document.getElementById("currentTitle"),
    artist = document.getElementById("currentArtist"),
    back = document.getElementById("back"),
    pause = document.getElementById("pause"),
    pauseIcon = document.getElementById("pauseIcon"),
    forward = document.getElementById("forward"),
    timeline = document.getElementById("timeline"),
    mute = document.getElementById("mute"),
    muteIcon = document.getElementById("muteIcon"),
    volume = document.getElementById("volume"),
    list = document.getElementById("list"),
    stop = document.getElementById("stop"),
    loop = document.getElementById("loop"),
    searchField = document.getElementById("search");

// window.onbeforeunload = async () => {
//     win.removeAllListeners();
// };

// document.getElementById("min-button").addEventListener("click", async () => {
//     win.minimize();
// });

// document.getElementById("max-button").addEventListener("click", async () => {
//     win.maximize();
// });

// document.getElementById("restore-button").addEventListener("click", async () => {
//     win.unmaximize();
// });

// document.getElementById("close-button").addEventListener("click", async () => {
//     win.destroy();
// });

// let toggleMaxRestoreButtons = async () => {
//     if (win.isMaximized()) {
//         document.body.classList.add("maximized");
//     } else {
//         document.body.classList.remove("maximized");
//     }
// };

// toggleMaxRestoreButtons();
// win.on("maximize", toggleMaxRestoreButtons);
// win.on("unmaximize", toggleMaxRestoreButtons);

let current = null;

let setCurrent = async (otitle, author, img) => {
    let etitle = otitle.slice(0, 60);
    cover.src = img;
    title.innerHTML = etitle != otitle ? etitle + "..." : etitle;
    artist.innerHTML = author;
};

let search = async (name) => {
    try {
        let filters = await ytsr.getFilters(name);
        let filter = filters.get("Type").get("Video");
        return (await ytsr(name, {
            limit: 20,
            nextpageRef: filter.ref
        })).items.filter(s => s.type === "video");
    } catch (e) {
        console.error();
        return [];
    }
};


let play = async song => {
    pause.disabled = false;
    back.disabled = false;
    forward.disabled = false;
    timeline.disabled = false;
    loop.disabled = false;
    stop.disabled = false;
    audio.src = "data:audio/mpeg;base64," + song;
    setTime(0);
    audio.play();
};

let setTime = async time => {
    audio.currentTime = time;
};

let loadSong = async url => {
    return new Promise((resolve, reject) => {
        try {
            let stream = new Base64Encode();
            let cache = "";
            ytdl(url, {
                filter: format => format.container === "mp4"
            }).pipe(stream);
            stream.on("data", async (data) => {
                cache = cache + data.toString();
            });
            stream.on("end", async () => {
                resolve({
                    data: cache,
                    info: await ytdl.getBasicInfo(url)
                });
            });
        } catch(e) {
            reject(e);
        }
    });
};

let loopStatus = false;

loop.onclick = async () => {
    loopStatus = !loopStatus;
    if(loopStatus) {
        loop.style.color = "green";
        loop.classList.add("selected");
    } else {
        loop.style.color = "#cccccc";
        loop.classList.remove("selected");
    }
};

let pauseState = true;

pause.onclick = async () => {
    if(pauseState) {
        pauseState = false;
        audio.play();
        pauseIcon.classList.remove("glyphicon-play");
        pauseIcon.classList.add("glyphicon-pause");
    } else {
        pauseState = true;
        audio.pause();
        pauseIcon.classList.remove("glyphicon-pause");
        pauseIcon.classList.add("glyphicon-play");
    }
};

audio.ontimeupdate = async () => {
    timeline.value = audio.currentTime.toFixed(0);
};

timeline.onchange = async () => {
    setTime(timeline.value);
};

let muteState = null;

mute.onclick = async () => {
    if(muteState == null) {
        muteIcon.classList.remove("glyphicon-volume-up");
        muteIcon.classList.add("glyphicon-volume-off");
        muteIcon.classList.add("disabled");
        muteIcon.style.color = "darkred";
        muteState = audio.volume;
        volume.value = 0;
        audio.volume = 0;
    } else {
        muteIcon.classList.remove("glyphicon-volume-off");
        muteIcon.classList.add("glyphicon-volume-up");
        muteIcon.classList.remove("disabled");
        muteIcon.style.color = "#cccccc";
        audio.volume = muteState;
        volume.value = muteState * 100;
        muteState = null;
    }
};

volume.oninput = async () => {
    if(volume.value == 0) {
        muteState = 0.1;
        muteIcon.classList.remove("glyphicon-volume-up");
        muteIcon.classList.add("glyphicon-volume-off");
        muteIcon.classList.add("disabled");
        muteIcon.style.color = "darkred";
    } else {
        muteState = null;
        muteIcon.classList.remove("glyphicon-volume-off");
        muteIcon.classList.add("glyphicon-volume-up");
        muteIcon.classList.remove("disabled");
        muteIcon.style.color = "#cccccc";
    }
    audio.volume = volume.value/100;
};

let queue = [];

let nextSong = async () => {
    if(loopStatus) {
        let temp = current;
        queue.push(temp);
        current = queue.shift();
    } else {
        current = queue.shift() || null;
    }
    if(queue.length == 0 && current == null) {
        setCurrent("", "", "");
        current = null;
        loop.disabled = true;
        stop.disabled = true;
        pauseState = true;
        pause.disabled = true;
        back.disabled = true;
        forward.disabled = true;
        timeline.disabled = true;
        audio.pause();
        audio.src = "";
        pauseIcon.classList.remove("glyphicon-pause");
        pauseIcon.classList.add("glyphicon-play");
        return;
    }
    let song = await loadSong(current);
    pauseState = false;
    setCurrent(song.info.videoDetails.title, song.info.videoDetails.author.name, song.info.videoDetails.author.avatar);
    timeline.max = song.info.videoDetails.lengthSeconds;
    play(song.data);
};

audio.onended = nextSong;

// eslint-disable-next-line no-unused-vars
let addToQueue = async url => {
    queue.push(url);
    if(queue.length == 1 && current == null) {
        current = queue.shift();
        let song = await loadSong(url);
        setCurrent(song.info.videoDetails.title, song.info.videoDetails.author.name, song.info.videoDetails.author.avatar);
        timeline.max = song.info.videoDetails.lengthSeconds;
        pauseIcon.classList.remove("glyphicon-play");
        pauseIcon.classList.add("glyphicon-pause");
        pauseState = false;
        play(song.data);
    }
};

back.onclick = async () => {
    setTime(0);
};

forward.onclick = nextSong;

let searchTimeout;

searchField.onkeydown = async e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        if(searchField.value == "") {
            list.innerHTML = "";
            return;
        }
        let songs = await search(searchField.value);
        list.innerHTML = "";
        songs.forEach(async s => {
            let title = s.title.slice(0,70);
            let div = `
            <div class="videoContainer" onclick="addToQueue('${s.url}')">
                <img class="videoThumbnail" src="${s.thumbnails[0].url}">
                <p class="videoTitle">${title != s.title ? title + "..." : title}</p>
                <p class="videoAuthor">- ${s.author.name}</p>
            </div>
            `;
            list.innerHTML += "\n" + div;
        });
        list.scrollTop = 0;
    }, 500);

    if(e.code == "Enter") {
        clearTimeout(searchTimeout);
        if(searchField.value == "") {
            list.innerHTML = "";
            return;
        }
        let songs = await search(searchField.value);
        list.innerHTML = "";
        songs.forEach(async s => {
            let title = s.title.slice(0,70);
            let div = `
            <div class="videoContainer" onclick="addToQueue('${s.url}')">
                <img class="videoThumbnail" src="${s.thumbnails[0].url}">
                <p class="videoTitle">${title != s.title ? title + "..." : title}</p>
                <p class="videoAuthor">- ${s.author.name}</p>
            </div>
            `;
            list.innerHTML += "\n" + div;
        });
        list.scrollTop = 0;
    }
};

stop.onclick = async () => {
    setCurrent("", "", "");
    current = null;
    queue = [];
    loop.disabled = true;
    stop.disabled = true;
    pauseState = true;
    pause.disabled = true;
    back.disabled = true;
    forward.disabled = true;
    timeline.disabled = true;
    audio.pause();
    audio.src = "";
    pauseIcon.classList.remove("glyphicon-pause");
    pauseIcon.classList.add("glyphicon-play");
};
