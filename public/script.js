const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const leaveRoomBtn = document.querySelector(".leave-room-btn");
const copyBtn = document.querySelector(".copy-content-btn");
const videoBtn = document.querySelector(".videocam-handler");
const audioBtn = document.querySelector(".audio-handler");

//Peerjs is used for assigning user ids and calling
const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
  proxied: true,
});

let myVideoStream;
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = [];
//Get users audio and video
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    //Get user audio and video streams
    myVideoStream = stream;
    myVideoStream.getAudioTracks()[0].enabled = false;
    console.log(myVideoStream,myVideoStream.getAudioTracks());

    addVideoStream(myVideo, stream);

    //Whenever some other user call answer call and add user's video to videogrid
    myPeer.on("call", (call) => {
      //Send our stream to caller
      call.answer(stream);
      const video = document.createElement("video");
      //Get video stream from user
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    //Connect new user
    socket.on("user-connected", (userId) => {
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 2000);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

//Assign user id
myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

//Call the new user
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("error", () => {
    console.log("error in calling");
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  //loadmetadata is executed when ever the video loads completely
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

//Toggle audio btn
audioBtn.addEventListener("click", () => {
  if (audioBtn.id === "audio-off") {
    audioBtn.innerHTML = `<svg class="microphone-icon">
        <use xlink:href="img/sprite.svg#icon-microphone"></use></svg>
        <span>Mute</span>`;
    audioBtn.id = "audio-on";
    myVideoStream.getAudioTracks()[0].enabled = true;
  } else {
    audioBtn.innerHTML = `<svg class="microphone-slash-icon">
      <use xlink:href="img/sprite.svg#icon-microphone-slash"></use></svg>
      <span>Unmute</span>`;
    audioBtn.id = "audio-off";
    myVideoStream.getAudioTracks()[0].enabled = false;
  }
});

//Toggle video button
videoBtn.addEventListener("click", () => {
  if (videoBtn.id === "video-on") {
    videoBtn.id = "video-off";
    videoBtn.innerHTML = `<svg class="videocam_off-icon">
      <use xlink:href="img/sprite.svg#icon-videocam_off"></use></svg>
      <span>Start video</span>`;
    myVideoStream.getVideoTracks()[0].enabled = false;
  } else {
    videoBtn.id = "video-on";
    videoBtn.innerHTML = `<svg class="videocam-icon">
      <use xlink:href="img/sprite.svg#icon-videocam"></use></svg>
      <span>Stop video</span>`;
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
});

leaveRoomBtn.href = window.location.origin;

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(location.href);
});
