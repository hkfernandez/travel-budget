 if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("../../serviceWorker.js").then(reg => {
            console.log("We found your service worker activation file and have registered your service worker!", reg);
          });
        });
      }