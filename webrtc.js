// 本地流和远端流
let localStream;
let remoteStream;

// 本地和远端连接对象
let localPeerConnection;
let remotePeerConnection;

// 本地视频和远端视频
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const openBtn=document.getElementById('openBtn')
const startBtn=document.getElementById('startBtn')
const closeBtn=document.getElementById('closeBtn')

const constraints = {
    'video': true,
    'audio': true
}

const offerOptions = {
    offerToReceiveVideo: 1
}

function openHandle(){
    openBtn.disabled=true;
    //调用getUserMedia获取音视频流
    navigator.mediaDevices.getUserMedia(constraints)
    .then(getLocalMedia)
    .catch(err=>{
        console.log('getUserMedia wrong!')
    })
}

//获取本地音频轨道
function getLocalMedia(mediaStream){
    localVideo.srcObject=mediaStream
    localStream=mediaStream
    startBtn.disabled=false
}

function startHandle(){
    startHandle.disabled=true
    closeBtn.disabled=false

    //获取本地的音视频轨道
    const videoTracks=localStream.getVideoTracks()
    const audioTracks=localStream.getAudioTracks()

    //判断轨道值
    if (videoTracks.length > 0) {
        console.log(`使用的设备为: ${videoTracks[0].label}.`);
    }
    if (audioTracks.length > 0) {
        console.log(`使用的设备为: ${audioTracks[0].label}.`);
    }

    // 创建 RTCPeerConnection 对象
    localPeerConnection = new RTCPeerConnection(null);
    // 监听返回的 Candidate
    localPeerConnection.addEventListener('icecandidate', handleConnection);
    // 监听 ICE 状态变化
    localPeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange)

    remotePeerConnection = new RTCPeerConnection(null);
    remotePeerConnection.addEventListener('icecandidate', handleConnection);
    remotePeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);
    remotePeerConnection.addEventListener('track', gotRemoteMediaStream);

    // 将音视频流添加到 RTCPeerConnection 对象中
    localStream.getTracks().forEach((track) => {
        localPeerConnection.addTrack(track, localStream)
    })

    // 交换sdp信息
    localPeerConnection.createOffer(offerOptions)
    .then(createdOffer).catch((err) => {
        console.log('createdOffer 错误', err);
    });
}

function createdOffer(description){
    // 本地设置描述并将它发送给远端
    // 将 offer 保存到本地
    localPeerConnection.setLocalDescription(description) 
        .then(() => {
            console.log('local success');
        }).catch((err) => {
            console.log('local wrong', err)
        });
    // 远端将本地给它的描述设置为远端描述
    // 远端将 offer 保存
    remotePeerConnection.setRemoteDescription(description) 
        .then(() => { 
            console.log('remote success');
        }).catch((err) => {
            console.log('remote wrong', err);
        });
    // 远端创建应答 answer
    remotePeerConnection.createAnswer() 
        .then(createdAnswer)
        .catch((err) => {
            console.log('answer wrong', err);
        });
}

function createdAnswer(description){
    remotePeerConnection.setLocalDescription(description)
        .then(() => { 
            console.log('remote success');
        }).catch((err) => {
            console.log('remote wrong', err);
        });
    // 本地将远端的应答描述设置为远端描述
    // 本地保存 answer
    localPeerConnection.setRemoteDescription(description) 
        .then(() => { 
            console.log('local sucess');
        }).catch((err) => {
            console.log('local wrong', err);
        });
}

function handleConnection(event){
    // 获取到触发 icecandidate 事件的 RTCPeerConnection 对象 
    // 获取到具体的Candidate
    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    if (iceCandidate) {
        // 创建 RTCIceCandidate 对象
        const newIceCandidate = new RTCIceCandidate(iceCandidate);
        // 得到对端的 RTCPeerConnection
        const otherPeer = getOtherPeer(peerConnection);

        // 将本地获得的 Candidate 添加到远端的 RTCPeerConnection 对象中
        // 为了简单，这里并没有通过信令服务器来发送 Candidate，直接通过 addIceCandidate 来达到互换 Candidate 信息的目的
        otherPeer.addIceCandidate(newIceCandidate)
            .then(() => {
                handleConnectionSuccess(peerConnection);
            }).catch((error) => {
                handleConnectionFailure(peerConnection, error);
            });
    }
}

//获取远端媒体流
function gotRemoteMediaStream(event) {
    if (remoteVideo.srcObject !== event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
        remoteStream = event.streams[0];
        console.log('remote accpeted')
    }
}

function handleConnectionChange(event){
    const peerConnection = event.target;
    console.log('ICE state change event: ', event);
    console.log(`${getPeerName(peerConnection)} ICE state: ` + `${peerConnection.iceConnectionState}.`);
}

function handleConnectionSuccess(peerConnection) {
    console.log(`${getPeerName(peerConnection)} addIceCandidate 成功`);
}

function handleConnectionFailure(peerConnection, error) {
    console.log(`${getPeerName(peerConnection)} addIceCandidate 错误:\n`+ `${error.toString()}.`);
}

function getPeerName(peerConnection) {
    return (peerConnection === localPeerConnection) ? 'localPeerConnection' : 'remotePeerConnection';
}

function getOtherPeer(peerConnection) {
    return (peerConnection === localPeerConnection) ? remotePeerConnection : localPeerConnection;
}

function closeHandle() {
    // 关闭连接并设置为空
    localPeerConnection.close();
    remotePeerConnection.close();
    localPeerConnection = null;
    remotePeerConnection = null;
    closeBtn.disabled = true;
    startBtn.disabled = false;
}

openBtn.addEventListener('click',openHandle)
startBtn.addEventListener('click',startHandle)
closeBtn.addEventListener('click',closeHandle)



