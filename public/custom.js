$(document).ready(function() {
  var video = document.createElement("video");
  var vidOverlay = document.getElementById("vid-overlay-in");
  var vidLine = document.getElementById("vid-overlay-line");
  var canvasElement = document.getElementById("canvas");
  var canvas = canvasElement.getContext("2d");
  var canvasOverlay = document.getElementById("canvas-overlay");
  var loadingMessage = document.getElementById("loading-message");
  var scanQrBtn = document.getElementById("scan-qr-code");
  var tableResult = document.getElementById("result-success-table");
  var greenTickIcon = document.getElementById("green-tick-icon");
  var clockIcon = document.getElementById("clock-icon");
  var timesIcon = document.getElementById("times-icon");
  var resultSuccessValidText = document.getElementById("result-success-valid-text");
  var resultSuccessInvalidText = document.getElementById("result-success-invalid-text");
  var timeout, camera30, camera60, cameraStartTimer;

  var defaultval = window.location.hash.replace("#","");
  toggleResultInfo(false);
  if (defaultval) {
    if (defaultval.match(/C02U:/g)) {
      verifyQRContent(window.location.href);
    } else {
      verifyQRContent(atob(defaultval));
    }
  }

  function toggleResultInfo(isResult) {
    $("#result-success").attr('style', 'display: none !important');
    $("#result-fail").attr('style', 'display: none !important');
    if (isResult) {
      $(".show-on-result").attr('style', '');
      $(".hide-on-result").attr('style', 'display: none !important');
      if (USE_RESULT_TIMEOUT) {
        timeout = setTimeout(() => {
          resetAll()
        }, RESULT_TIMEOUT);
      }
    } else {
      clearTimeout(timeout);
      $(".show-on-result").attr('style', 'display: none !important');
      $(".hide-on-result").attr('style', '');
    }
  }

  function toggleResult(isSuccess) {
    if (isSuccess) {
      $("#result-success").attr('style', '');
      $("#result-fail").attr('style', 'display: none !important');
    } else {
      $("#result-success").attr('style', 'display: none !important');
      $("#result-fail").attr('style', '');
    }
  }

  function drawLine(begin, end, color) {
    canvas.beginPath();
    canvas.moveTo(begin.x, begin.y);
    canvas.lineTo(end.x, end.y);
    canvas.lineWidth = 4;
    canvas.strokeStyle = color;
    canvas.stroke();
  }

  function tick() {
    if (!video.srcObject) {
      return;
    }
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      loadingMessage.hidden = true;
      canvasOverlay.hidden = true;
      canvasElement.hidden = false;
      vidOverlay.hidden = false;
      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
      try {
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code && code.data.trim() !== "") {
          drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
          drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
          drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
          drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
          verifyQRContent(code.data);
          stopVideo();
          return;
        }
      } catch (error) {
        
      }
    }
    requestAnimationFrame(tick);
  }

  function stopVideo() {
    try {
      video.srcObject.getTracks()[0].stop();
    } catch (error) {

    }
    video.srcObject = null;
    // clearTimeout(camera30);
    // clearTimeout(camera60);
  }

  function verifyQRContent(value) {
    var codeType = value.substring(0, 3);
    if ((codeType !== "HC1" && codeType !== "shc" && codeType !== "C02") || value.length <= 200) {
      toggleResultInfo(true);
      populateErrorMsg([NOT_HC1_ERROR_TITLE, ""]);
      toggleResult(false);
      scanQrBtn.disabled = false;
      fetch(EP_NOT_HC1_CODE);
      return;
    }
    var deltaCameraStart = Date.now() - cameraStartTimer; // in milliseconds
    let data = {"code_content": value, "fe_log": `${parseInt(deltaCameraStart / 1000)}`};
    fetch("/v2/validate/", {
      method: 'POST',
      mode: "cors",
      credentials: "same-origin",
      headers: {
        'Authorization': webvaltoken,
        'Content-Type': "application/json",
      },
      body: JSON.stringify(data)
    }).then((res)=>{
      return res.json();
    }).then((jsonRes)=>{
      toggleResultInfo(true);
      if (jsonRes['result'] === 0) {
        if (codeType === "HC1" && 'validated_payload' in jsonRes) {
          var json = JSON.parse(jsonRes['validated_payload'])['hcert']['eu_dgc_v1'];
          const validatedRes = validateRules(json);
          if (validatedRes[0]) {
            populateIcon(json);
            populateResult(shownResult(json));
            toggleResult(true);
          } else {
            populateErrorMsg([validatedRes[1], validatedRes[2]]);
            toggleResult(false);
          }
        } else if (codeType === "shc" && 'validated_payload' in jsonRes) {
          var json = JSON.parse(jsonRes['validated_payload'])
          const validatedRes = validateRulesShc(json);
          if (validatedRes[0]) {
            populateIcon(json);
            var countryCode = jsonRes['code_uid'].split("#")[jsonRes['code_uid'].split("#").length - 1]
            populateResult(shownResultShc(json, countryCode));
            toggleResult(true);
          } else {
            populateErrorMsg([validatedRes[1], validatedRes[2]]);
            toggleResult(false);
          }
        } else if (codeType === "C02" && 'pdc_data' in jsonRes) {
          var json = JSON.parse(jsonRes['pdc_data'])
          const validatedRes = validateRulesC02(json);
          if (validatedRes[0]) {
            populateIcon(json);
            populateResult(shownResultC02(json));
            toggleResult(true);
          } else {
            populateErrorMsg([validatedRes[1], validatedRes[2]]);
            toggleResult(false);
          }
        } else {
          populateErrorMsg();
          toggleResult(false);
        }
      } else {
        populateErrorMsg();
        toggleResult(false);
      }
      scanQrBtn.disabled = false;
    });
  }

  function populateResult(shownResult) {
    tableResult.innerHTML = "";
    Object.keys(shownResult).forEach(function(key) {
      const value = shownResult[key];
      var row = tableResult.insertRow(-1);
      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      $(cell1).text(key);
      $(cell2).text(value);
    })
  }

  function populateErrorMsg(validatedRes=[GENERIC_ERROR_TITLE, GENERIC_ERROR_MSG]) {
    $("#result-fail-title").html(`${validatedRes[0]}`);
    $("#result-fail-msg").html(`${validatedRes[1]}`);
  }

  function populateIcon(json) {
    if ('t' in json) {
      greenTickIcon.hidden = true;
      timesIcon.hidden = false;
      clockIcon.hidden = true;
      resultSuccessValidText.hidden = true;
      resultSuccessInvalidText.hidden = false;
    } else {
      greenTickIcon.hidden = false;
      timesIcon.hidden = true;
      clockIcon.hidden = true;
      resultSuccessValidText.hidden = false;
      resultSuccessInvalidText.hidden = true;
    }
  }

  function resetAll() {
    toggleResultInfo(false);
    scanQrBtn.disabled = false;
    loadingMessage.hidden = true;
    tableResult.innerHTML = "";
    canvasOverlay.hidden = false;
    canvasElement.hidden = true;
    vidOverlay.hidden = true;
    stopVideo();
  }

  function repositionOverlay() {
    var scannerHeight = canvasElement.offsetHeight;
    var scannerWidth = canvasElement.offsetWidth;
    var smallerDimension = Math.min(scannerWidth, scannerHeight);
    if (smallerDimension === 0) {
      requestAnimationFrame(repositionOverlay);
      return;
    }
    var overlaySize = Math.ceil(2 / 3 * smallerDimension);
    // video overlay inside
    vidOverlay.style.width = overlaySize + 'px';
    vidOverlay.style.height = overlaySize + 'px';
    var topOffset = canvasElement.offsetTop + ((scannerHeight - overlaySize) / 2);
    vidOverlay.style.top = topOffset + 'px';
    // video overlay line
    topOffset = (overlaySize - 2) / 2
    vidLine.style.top = topOffset + 'px'
  }

  $("#scan-qr-code").click(function() {
    //fetch(EP_CLICK_SCAN_QR_CODE);
    toggleResultInfo(false);
    scanQrBtn.disabled = true;
    loadingMessage.hidden = false;
    // Use facingMode: environment to attemt to get the front camera on phones
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
      requestAnimationFrame(tick);
      requestAnimationFrame(repositionOverlay);
    }).catch((error) => {
      // There's 2 exception that can be occured
      // DOMException: Permission denied
      // DOMException: Requested device not found
      scanQrBtn.disabled = false;
      loadingMessage.hidden = true;
      alert(CAMERA_PERMISSION_ERROR_TITLE);
      // fetch(EP_CAMERA_PERMISSION_NOT_GIVEN);
      return false;
    });
    fetch(EP_CAMERA_LOADS);
    cameraStartTimer = Date.now();
    //camera30 = setTimeout(() => {
    //  fetch(EP_CAMERA_30);
    //}, 30000);
    //camera60 = setTimeout(() => {
    //  fetch(EP_CAMERA_60);
    //}, 60000);
    return true;
  })

  $("#button-reset").click(function() {
    resetAll();
  })
})
