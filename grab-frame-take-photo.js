var imageCapture;
const model  = {
    MediaStream : ['id','active','ended'],
    MediaStreamTrack : ['contentHint','enabled','id','kind','label','muted'],
    PhotoCapabilities : ['fillLightMode','imageHeight','imageWidth','redEyeReduction'],
    MediaSettingsRange : ['max','min','step'],
    ImageBitmap : ['width','height'],
    Blob : []
}
function proplist(obj,i) {
    const label = (obj.constructor && obj.constructor.name) || obj.prototype.name
    const keys = model[label]
    return `<ul><u>${label}${(i===undefined) ? '' : '['+i+']'}</u>` + 
        keys.map(prop => {
            if (Array.isArray(obj[prop])) return obj[prop].map((obji,i) => proplist(obji,i)).join('')
            if (typeof obj[prop] === 'object') return proplist(obj[prop])
            return `<li>${prop} : ${typeof obj[prop] === 'object'? proplist(obj[prop]) :  obj[prop]}</li>`
        }).join('')+
        '</ul>'
}

function onGetUserMediaButtonClick() {
  navigator.mediaDevices.getUserMedia({video: true})
  .then(mediaStream => {
    let desc = proplist(mediaStream,'MediaStream')
    let tracks = mediaStream.getVideoTracks()
    desc+=tracks.map((track,i)  => proplist(track,i)).join('')
    document.querySelector('video').srcObject = mediaStream;

    const track = mediaStream.getVideoTracks()[0];
    imageCapture = new ImageCapture(track);
    
    imageCapture.getPhotoCapabilities().then(photocap => {
        desc+= proplist(photocap)    
        document.querySelector('#videodiv').innerHTML = desc;
    })
  })
  .catch(console.error);
}

function onGrabFrameButtonClick() {
  imageCapture.grabFrame()
  .then(imageBitmap => {
    const canvas = document.querySelector('#grabFrameCanvas');
    drawCanvas(canvas, imageBitmap);
    document.querySelector('#framediv').innerHTML = proplist(imageBitmap)
  })
  .catch(console.error);
}

function onTakePhotoButtonClick() {
  imageCapture.takePhoto()
  .then(blob => createImageBitmap(blob))
  .then(imageBitmap => {
    const canvas = document.querySelector('#takePhotoCanvas');
    drawCanvas(canvas, imageBitmap);
    document.querySelector('#photodiv').innerHTML = proplist(imageBitmap)
  })
  .catch(console.error);
}

/* Utils */

function drawCanvas(canvas, img) {
  canvas.width = getComputedStyle(canvas).width.split('px')[0];
  canvas.height = getComputedStyle(canvas).height.split('px')[0];
  let ratio  = Math.min(canvas.width / img.width, canvas.height / img.height);
  let x = (canvas.width - img.width * ratio) / 2;
  let y = (canvas.height - img.height * ratio) / 2;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height,
      x, y, img.width * ratio, img.height * ratio);
}

document.querySelector('video').addEventListener('play', function() {
  document.querySelector('#grabFrameButton').disabled = false;
  document.querySelector('#takePhotoButton').disabled = false;
});
