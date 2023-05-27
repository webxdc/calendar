// debug friend: document.writeln(JSON.stringify(value));
//@ts-check
/** @type {import('./webxdc.d').Webxdc<any>} */
window.webxdc = (() => {
    var updateListener = (_) => {};
    var updatesKey = "__xdcUpdatesKey__";
    window.addEventListener('storage', (event) => {
        if (event.key == null) {
            window.location.reload();
        } else if (event.key === updatesKey) {
            var updates = JSON.parse(event.newValue);
            var update = updates[updates.length-1];
            update.max_serial = updates.length;
            console.log("[Webxdc] " + JSON.stringify(update));
            updateListener(update);
        }
    });

    function getUpdates() {
        var updatesJSON = window.localStorage.getItem(updatesKey);
        return updatesJSON ? JSON.parse(updatesJSON) : [];
    }

    var params = new URLSearchParams(window.location.hash.substr(1));
    /** @type {import('./webxdc.d').Webxdc<any>} */
    const webxdc =  {
        selfAddr: params.get("addr") || "device0@local.host",
        selfName: params.get("name") || "device0",
        setUpdateListener: (cb, serial = 0) => {
            var updates = getUpdates();
            var maxSerial = updates.length;
            updates.forEach((update) => {
                if (update.serial > serial) {
                    update.max_serial = maxSerial;
                    cb(update);
                }
            });
            updateListener = cb;
            return Promise.resolve()
        },
        getAllUpdates: () => {
            console.log('[Webxdc] WARNING: getAllUpdates() is deprecated.');
            return Promise.resolve([]);
        },
        sendUpdate: (update, description) => {
            var updates = getUpdates();
            var serial = updates.length + 1;
            var _update = {payload: update.payload, summary: update.summary, info: update.info, serial: serial};
            updates.push(_update);
            window.localStorage.setItem(updatesKey, JSON.stringify(updates));
            _update.max_serial = serial;
            console.log('[Webxdc] description="' + description + '", ' + JSON.stringify(_update));
            updateListener(_update);
        },
        sendToChat: async (content) => {
            if (!content.file && !content.text) {
              alert("🚨 Error: either file or text need to be set. (or both)");
              return Promise.reject(
                "Error from sendToChat: either file or text need to be set"
              );
            }
            const confirmed = confirm(
              `now the user would select a chat to send this message. (the user can also abort then the sendToChat promise resolves with false):\n${JSON.stringify(
                content
              )}`
            );

            if (confirmed) {
              if (content.file) {
                var element = document.createElement("a");
                const base64Content = await (() =>
                  new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(content.file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error);
                  }))();
                element.setAttribute(
                  "href",
                  "data:" +
                    (content.file.type || "application/octet-stream") +
                    ";base64;" +
                    base64Content
                );
                element.setAttribute("download", content.file.name);
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }
              return Promise.resolve(true);
            } else {
              return Promise.resolve(false);
            }
        },
        importFiles: (filters) => {
            // simon: please don't copy this hacky code for android
            return new Promise((resolve, reject)=>{
                var element = document.createElement("input");
                element.accept = [...filters.extentions, ...filters.mimeTypes].join(',')
                element.multiple = filters.multiple || false
                element.onchange = (ev)=>{
                    console.log("element.files", element.files)
                    const files = [...element.files]
                    document.body.removeChild(element);
                    resolve(files)
                }
                element.style.display="none"
                element.click()
            })
        }
    };
    return webxdc
})();

window.addXdcPeer = () => {
    var loc = window.location;
    // get next peer ID
    var params = new URLSearchParams(loc.hash.substr(1));
    var peerId = Number(params.get("next_peer")) || 1;

    // open a new window
    var peerName = "device" + peerId;
    var url = loc.protocol + "//" + loc.host + loc.pathname + "#name=" + peerName + "&addr=" + peerName + "@local.host";
    window.open(url);

    // update next peer ID
    params.set("next_peer", String(peerId + 1));
    window.location.hash = "#" + params.toString();
}

window.clearXdcStorage = () => {
    window.localStorage.clear();
    window.location.reload();
}

window.alterXdcApp = () => {
    var styleControlPanel = 'position: fixed; bottom:1em; left:1em; background-color: #000; opacity:0.8; padding:.5em; font-size:16px; font-family: sans-serif; color:#fff; z-index: 9999';
    var styleMenuLink = 'color:#fff; text-decoration: none; vertical-align: middle';
    var styleAppIcon = 'height: 1.5em; width: 1.5em; margin-right: 0.5em; border-radius:10%; vertical-align: middle';
    var title = document.getElementsByTagName('title')[0];
    if (typeof title == 'undefined') {
        title = document.createElement('title');
        document.getElementsByTagName('head')[0].append(title);
    }
    title.innerText = window.webxdc.selfAddr;

    if (window.webxdc.selfName === "device0") {
        var div = document.createElement('div');
        div.innerHTML =
            '<div id="webxdc-panel" style="' + styleControlPanel + '">' +
            '<a href="javascript:window.addXdcPeer();" style="' + styleMenuLink + '">Add Peer</a>' +
            '<span style="' + styleMenuLink + '"> | </span>' +
            '<a id="webxdc-panel-clear" href="javascript:window.clearXdcStorage();" style="' + styleMenuLink + '">Clear Storage</a>' +
            '<div>';
        var controlPanel = div.firstChild;

        function loadIcon(name) {
            var tester = new Image();
            tester.onload = () => {
                div.innerHTML = '<img src="' + name + '" style="' + styleAppIcon +'">';
                controlPanel.insertBefore(div.firstChild, controlPanel.firstChild);
            };
            tester.src = name;
        }
        loadIcon("icon.png");
        loadIcon("icon.jpg");

        document.getElementsByTagName('body')[0].append(controlPanel);
    }
}

window.addEventListener("load", window.alterXdcApp);