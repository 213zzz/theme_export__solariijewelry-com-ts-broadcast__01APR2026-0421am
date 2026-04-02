(function () {
  var GSAP_URL = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js";
  var ST_URL = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js";
  var DESKTOP_MQ = "(min-width: 900px)";
  var instances = new Map();
  var gsapLoadPromise = null;

  function loadScriptOnce(url, markerAttr) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector("script[" + markerAttr + "]")) {
        resolve();
        return;
      }

      var existedBySrc = Array.prototype.some.call(document.scripts, function (s) {
        return (s.src || "").indexOf(url) !== -1;
      });

      if (existedBySrc) {
        resolve();
        return;
      }

      var script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.setAttribute(markerAttr, "true");
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureGsap() {
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      return Promise.resolve();
    }

    if (gsapLoadPromise) return gsapLoadPromise;

    gsapLoadPromise = loadScriptOnce(GSAP_URL, "data-maya-gsap")
      .then(function () {
        return loadScriptOnce(ST_URL, "data-maya-scrolltrigger");
      })
      .then(function () {
        if (window.gsap && window.ScrollTrigger) {
          window.gsap.registerPlugin(window.ScrollTrigger);
        }
      })
      .catch(function (err) {
        gsapLoadPromise = null;
        throw err;
      });

    return gsapLoadPromise;
  }

  function MayaSeasonsInstance(root) {
    this.root = root;
    this.sectionId = root.getAttribute("data-section-id") || "";
    this.pinEl = root.querySelector(".maya-seasons__pin");
    this.track = root.querySelector(".maya-seasons__track");
    this.viewport = root.querySelector(".maya-seasons__viewport");
    this.introPanel = root.querySelector(".maya-seasons__intro");
    this.firstCard = root.querySelector(".maya-seasons__cardPanel");
    this.bar = root.querySelector(".maya-seasons__rule > span");

    this.trackTween = null;
    this.resizeTimer = null;
    this.destroyed = false;

    this.onResize = this.onResize.bind(this);
  }

  MayaSeasonsInstance.prototype.isDesktop = function () {
    return window.matchMedia(DESKTOP_MQ).matches;
  };

  MayaSeasonsInstance.prototype.killTweens = function () {
    if (this.trackTween) {
      this.trackTween.kill();
      this.trackTween = null;
    }
  };

  MayaSeasonsInstance.prototype.resetInlineStyles = function () {
    if (window.gsap) {
      window.gsap.set(this.track, { clearProps: "transform" });
      if (this.introPanel) {
        window.gsap.set(this.introPanel, { clearProps: "opacity,transform,top" });
      }
    } else {
      if (this.track) this.track.style.transform = "";
      if (this.introPanel) {
        this.introPanel.style.opacity = "";
        this.introPanel.style.transform = "";
        this.introPanel.style.top = "";
      }
    }

    if (this.introPanel) {
      this.introPanel.classList.add("is-visible");
    }
  };

  MayaSeasonsInstance.prototype.measure = function () {
    var extra = 0;
    var maxX = 0;
    var hideStart = 80;
    var pinWidth = this.pinEl ? this.pinEl.offsetWidth : window.innerWidth;

    if (this.bar && window.innerWidth > this.bar.parentElement.offsetWidth) {
      extra = (window.innerWidth - this.bar.parentElement.offsetWidth) / 2;
    }

    if (this.track) {
      maxX = Math.max(0, this.track.scrollWidth - pinWidth + extra);
    }

    if (this.introPanel && this.firstCard) {
      var introRect = this.introPanel.getBoundingClientRect();
      var firstCardRect = this.firstCard.getBoundingClientRect();
      hideStart = Math.max(24, firstCardRect.left - introRect.right - 6);
    }

    return {
      maxX: maxX,
      hideStart: hideStart
    };
  };

  MayaSeasonsInstance.prototype.initDesktop = function () {
    var _this = this;

    return ensureGsap().then(function () {
      if (_this.destroyed) return;
      if (!window.gsap || !window.ScrollTrigger) return;

      _this.killTweens();
      _this.resetInlineStyles();

      var gsap = window.gsap;
      var metrics = _this.measure();

      if (metrics.maxX <= 0) {
        if (_this.bar) _this.bar.style.transform = "scaleX(1)";
        return;
      }

      gsap.set(_this.track, { x: 0, force3D: true });
      if (_this.introPanel) _this.introPanel.classList.add("is-visible");

      _this.trackTween = gsap.to(_this.track, {
        x: -metrics.maxX,
        ease: "none",
        scrollTrigger: {
          trigger: _this.root,
          start: "top top",
          end: "+=" + (metrics.maxX + 50),
          scrub: 1.5,
          pin: _this.pinEl,
          pinSpacing: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: function (self) {
            if (_this.bar) {
              _this.bar.style.transform = "scaleX(" + self.progress + ")";
            }

            if (_this.introPanel) {
              var movedX = Math.abs(gsap.getProperty(_this.track, "x"));

              if (self.direction === 1) {
                if (movedX > metrics.hideStart || self.progress > 0.75) {
                  _this.introPanel.classList.remove("is-visible");
                }
              } else {
                if (movedX < Math.max(8, metrics.hideStart * 0.45) || self.progress === 0) {
                  _this.introPanel.classList.add("is-visible");
                }

                if (self.progress === 1) {
                  _this.introPanel.classList.remove("is-visible");
                }
              }
            }
          },
          onRefresh: function (self) {
            var next = _this.measure();
            if (next.maxX <= 0) {
              self.kill(false);
              if (_this.bar) _this.bar.style.transform = "scaleX(1)";
            }
          }
        }
      });

      window.ScrollTrigger.refresh();
    });
  };

  MayaSeasonsInstance.prototype.init = function () {
    if (!this.pinEl || !this.track) return;

    this.killTweens();

    if (!this.isDesktop()) {
      this.resetInlineStyles();
      if (this.bar) this.bar.style.transform = "scaleX(1)";
      return;
    }

    this.initDesktop();
  };

  MayaSeasonsInstance.prototype.onResize = function () {
    var _this = this;
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(function () {
      _this.init();
    }, 160);
  };

  MayaSeasonsInstance.prototype.mount = function () {
    this.init();
    window.addEventListener("resize", this.onResize, { passive: true });
  };

  MayaSeasonsInstance.prototype.unmount = function () {
    this.destroyed = true;
    window.removeEventListener("resize", this.onResize);
    window.clearTimeout(this.resizeTimer);
    this.killTweens();
    this.resetInlineStyles();
  };

  function mountSection(root) {
    if (!root) return;

    var id = root.id || root.getAttribute("data-section-id");
    if (!id) return;

    if (instances.has(id)) {
      instances.get(id).unmount();
      instances.delete(id);
    }

    var instance = new MayaSeasonsInstance(root);
    instances.set(id, instance);
    instance.mount();
  }

  function unmountSectionById(sectionId) {
    instances.forEach(function (instance, key) {
      if (
        instance.sectionId === sectionId ||
        key === sectionId ||
        key.indexOf(sectionId) !== -1
      ) {
        instance.unmount();
        instances.delete(key);
      }
    });
  }

  function bootAll() {
    var roots = document.querySelectorAll("[data-maya-seasons]");
    roots.forEach(mountSection);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAll, { once: true });
  } else {
    bootAll();
  }

  document.addEventListener("shopify:section:load", function (event) {
    var sectionId = event && event.detail ? event.detail.sectionId : "";
    if (!sectionId) return;

    var root = document.getElementById("maya-seasons-" + sectionId);
    if (root) mountSection(root);
  });

  document.addEventListener("shopify:section:unload", function (event) {
    var sectionId = event && event.detail ? event.detail.sectionId : "";
    if (!sectionId) return;
    unmountSectionById(sectionId);
  });
})();
