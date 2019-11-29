let imageCapture
let mediaStream
const model = {
    MediaStream: ['id', 'active'],
    MediaStreamTrack: ['contentHint', 'enabled', 'id', 'kind', 'label', 'muted'],
    PhotoCapabilities: ['fillLightMode', 'imageHeight', 'imageWidth', 'redEyeReduction'],
    MediaSettingsRange: ['max', 'min', 'step'],
    ImageBitmap: ['width', 'height'],
    Blob: ['size']
}
function proplist(obj, label) {
    const type = (obj === null || obj === undefined) ? 'Null' :
        (obj.constructor && obj.constructor.name) || (obj.prototype || obj.prototype.name) || (typeof obj).toLowerCase()
    const keys = (obj === null || obj === undefined) ? [] : (model[type] || Object.keys(obj))
    const title = `<b>${label}</b>&lt;${type.toLowerCase()}&gt;`
    switch (type) {
        case 'Array':
            return (obj.length > 0) ? obj.map((obji,i) => `${proplist(obji, `${label}[${i}]`)}`).join('') : `${title} : []`
        case 'Null':
        case 'Number':
        case 'String':
        case 'Boolean':
        case 'Date':
            return `${title} : ${obj}`
        default:
            return `${title} : <ul>` + keys.map((prop, i) => `<li>${proplist(obj[prop], prop)}</li>`).join('')+'</ul>'
    }
}
function onGUMBC_front() {
    return onGetUserMediaButtonClick('front')
}
function onGUMBC_back() {
    return onGetUserMediaButtonClick('environment')
}
function onGetUserMediaButtonClick(facing) {
    if (imageCapture) {
        imageCapture = null
        document.querySelector('video').srcObject = null
        mediaStream.getVideoTracks().forEach(function (track) {
            track.stop();
        });
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } })
        .then(ms => {
            mediaStream = ms
            let desc = proplist(mediaStream, 'mediastream')
            let tracks = mediaStream.getVideoTracks()
            desc += proplist(tracks, 'tracks')
            document.querySelector('video').srcObject = mediaStream;

            const track = mediaStream.getVideoTracks()[0];
            imageCapture = new ImageCapture(track);

            return imageCapture.getPhotoCapabilities().then(photocap => {
                desc += proplist(photocap,'photocap')
                return imageCapture.getPhotoSettings()
            }).then(settings => {
                desc += proplist(settings,'settings')
                document.querySelector('#videodiv').innerHTML = desc;
            })
        })
        .catch(err => document.querySelector('#videodiv').innerHTML = err.toString());
}

function onGrabFrameButtonClick() {
    imageCapture.grabFrame()
        .then(imageBitmap => {
            const canvas = document.querySelector('#grabFrameCanvas');
            drawCanvas(canvas, imageBitmap);
            document.querySelector('#framediv').innerHTML = proplist(imageBitmap,'bitmap')
        })
        .catch(err => document.querySelector('#framediv').innerHTML = err.toString());
}

function onTakePhotoButtonClick() {
    imageCapture.takePhoto()
        .then(blob => createImageBitmap(blob))
        .then(imageBitmap => {
            const canvas = document.querySelector('#takePhotoCanvas');
            drawCanvas(canvas, imageBitmap);
            document.querySelector('#photodiv').innerHTML = proplist(imageBitmap,'photo')
        })
        .catch(err => document.querySelector('#photodiv').innerHTML = err.toString());
}

/* Utils */

function drawCanvas(canvas, img) {
    canvas.width = getComputedStyle(canvas).width.split('px')[0];
    canvas.height = getComputedStyle(canvas).height.split('px')[0];
    let ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
    let x = (canvas.width - img.width * ratio) / 2;
    let y = (canvas.height - img.height * ratio) / 2;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height,
        x, y, img.width * ratio, img.height * ratio);
}

document.querySelector('video').addEventListener('play', function () {
    document.querySelector('#grabFrameButton').disabled = false;
    document.querySelector('#takePhotoButton').disabled = false;
});
