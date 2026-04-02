/* =========================================================
   Solarii Gallery JS — Desktop + Mobile
   ========================================================= */
(function () {
  'use strict';

  function initDesktop() {
    var track = document.querySelector('[data-sg-track]');
    var slider = document.querySelector('[data-sg-slider]');
    var prevBtn = document.querySelector('[data-sg-prev]');
    var nextBtn = document.querySelector('[data-sg-next]');
    var thumbRail = document.querySelector('[data-sg-thumb-rail]');
    var thumbShell = document.querySelector('[data-sg-thumb-shell]');
    var heroVideo = document.querySelector('[data-sg-hero-video]');

    if (!track || !slider || !thumbRail) return;

    var thumbs = Array.from(thumbRail.querySelectorAll('[data-sg-thumb]'));
    var slides = Array.from(track.querySelectorAll('.sg-slide'));
    var slideCount = slides.length;
    var currentSlide = 0;

    function normalizeMediaId(mediaId) {
      var raw = String(mediaId || '');
      var match = raw.match(/(\d+)$/);
      return match ? match[1] : raw;
    }

    function pauseVideoInSlide(index) {
      var slide = slides[index];
      if (!slide) return;
      var vid = slide.querySelector('video');
      if (vid && !vid.paused) vid.pause();
    }

    function goTo(index) {
      if (index < 0) index = 0;
      if (index >= slideCount) index = slideCount - 1;

      pauseVideoInSlide(currentSlide);
      currentSlide = index;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      setActiveThumb(index);
    }

    function goToMedia(mediaId) {
      var targetSlide = track.querySelector('.sg-slide[data-gallery-media-id="' + normalizeMediaId(mediaId) + '"]');
      if (!targetSlide) return;
      var idx = parseInt(targetSlide.getAttribute('data-index'), 10);
      if (!isNaN(idx)) goTo(idx);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goTo(currentSlide - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goTo(currentSlide + 1);
      });
    }

    (function () {
      var startX = 0;
      var startY = 0;
      var tracking = false;

      slider.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        tracking = true;
      }, { passive: true });

      slider.addEventListener('touchend', function (e) {
        if (!tracking) return;
        tracking = false;

        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
          if (dx < 0) goTo(currentSlide + 1);
          else goTo(currentSlide - 1);
        }
      }, { passive: true });
    })();

    function setActiveThumb(target) {
      thumbs.forEach(function (t) {
        t.classList.toggle('is-active', String(t.dataset.index) === String(target));
      });

      var activeEl = thumbRail.querySelector('[data-index="' + target + '"]');
      if (activeEl) {
        var thumbTop = activeEl.offsetTop;
        var thumbBottom = thumbTop + activeEl.offsetHeight;
        var railScroll = thumbRail.scrollTop;
        var railHeight = thumbRail.clientHeight;

        if (thumbTop < railScroll) {
          thumbRail.scrollTo({ top: thumbTop, behavior: 'smooth' });
        } else if (thumbBottom > railScroll + railHeight) {
          thumbRail.scrollTo({ top: thumbBottom - railHeight, behavior: 'smooth' });
        }
      }

      updateFade();
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var idx = thumb.dataset.index;

        if (idx === 'hero-video') {
          if (heroVideo) {
            heroVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          setActiveThumb('hero-video');
        } else {
          goTo(parseInt(idx, 10));
        }
      });
    });

    slider.addEventListener('solarii:media-select', function (event) {
      var mediaId = event.detail && event.detail.mediaId;
      if (!mediaId) return;
      goToMedia(mediaId);
    });

    var desktopRoot = slider.closest('product-info') || document;
    if (desktopRoot && !desktopRoot.dataset.sgDesktopBridgeBound) {
      desktopRoot.dataset.sgDesktopBridgeBound = 'true';
      desktopRoot.addEventListener('theme:media:select', function (event) {
        var mediaId = (event.target && event.target.getAttribute('data-gallery-media-id')) || (event.detail && event.detail.id);
        if (!mediaId) return;
        goToMedia(mediaId);
      });
    }

    function updateFade() {
      if (!thumbShell || !thumbRail) return;

      var canScroll = thumbRail.scrollHeight > thumbRail.clientHeight + 2;
      var atTop = thumbRail.scrollTop <= 2;
      var atBottom = thumbRail.scrollTop + thumbRail.clientHeight >= thumbRail.scrollHeight - 2;

      thumbShell.classList.toggle('has-top', canScroll && !atTop);
      thumbShell.classList.toggle('has-bottom', canScroll && !atBottom);
    }

    thumbRail.addEventListener('scroll', updateFade);
    window.addEventListener('resize', updateFade);
    updateFade();

    slides.forEach(function (slide) {
      var playOverlay = slide.querySelector('[data-sg-slide-play]');
      var poster = slide.querySelector('.sg-slide-poster');
      var vid = slide.querySelector('video');
      if (!playOverlay || !vid) return;

      playOverlay.addEventListener('click', function (e) {
        e.stopPropagation();
        if (vid.paused) {
          vid.play();
          playOverlay.classList.add('is-hidden');
          if (poster) poster.classList.add('is-hidden');
        } else {
          vid.pause();
          playOverlay.classList.remove('is-hidden');
        }
      });

      vid.addEventListener('pause', function () {
        playOverlay.classList.remove('is-hidden');
      });

      vid.addEventListener('play', function () {
        playOverlay.classList.add('is-hidden');
        if (poster) poster.classList.add('is-hidden');
      });
    });

    if (heroVideo) {
      var hVid = heroVideo.querySelector('video');
      var hOverlay = heroVideo.querySelector('[data-sg-hero-overlay]');
      var hPoster = heroVideo.querySelector('.sg-hero-poster');

      if (hVid && hOverlay) {
        heroVideo.addEventListener('click', function () {
          if (hVid.paused) {
            hVid.play();
            hOverlay.classList.add('is-hidden');
            if (hPoster) hPoster.classList.add('is-hidden');
          } else {
            hVid.pause();
            hOverlay.classList.remove('is-hidden');
          }
        });

        hVid.addEventListener('pause', function () {
          hOverlay.classList.remove('is-hidden');
        });

        hVid.addEventListener('play', function () {
          hOverlay.classList.add('is-hidden');
          if (hPoster) hPoster.classList.add('is-hidden');
        });
      }

      var heroThumb = thumbRail.querySelector('[data-index="hero-video"]');
      if (heroThumb) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              setActiveThumb('hero-video');
            } else {
              setActiveThumb(currentSlide);
            }
          });
        }, {
          rootMargin: '0px 0px -40% 0px',
          threshold: 0.2
        });

        obs.observe(heroVideo);
      }
    }

    goTo(0);
  }

  function initMobile() {
    var swiper = document.querySelector('[data-sg-mob-swiper]');
    var track = document.querySelector('[data-sg-mob-track]');
    var dotsWrap = document.querySelector('[data-sg-mob-dots]');

    if (!swiper || !track) return;

    var mobSlides = Array.from(track.querySelectorAll('.sg-mob-slide'));
    var dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('.sg-mob-dot')) : [];
    var totalSlides = mobSlides.length;
    var currentIdx = 0;

    function normalizeMediaId(mediaId) {
      var raw = String(mediaId || '');
      var match = raw.match(/(\d+)$/);
      return match ? match[1] : raw;
    }

    function pauseVideoInSlide(index) {
      var slide = mobSlides[index];
      if (!slide) return;
      var vid = slide.querySelector('video');
      if (vid && !vid.paused) vid.pause();
    }

    function pinUserMedia(index) {
      var slide = mobSlides[index];
      if (!slide) return;
      var mediaId = slide.getAttribute('data-gallery-media-id');
      if (mediaId) swiper.dataset.sgUserPinnedMediaId = String(mediaId);
    }

    function goToMob(index, source) {
      if (index < 0) index = 0;
      if (index >= totalSlides) index = totalSlides - 1;

      pauseVideoInSlide(currentIdx);
      currentIdx = index;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      if (source === 'user') pinUserMedia(index);

      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
      });
    }

    function goToMediaMob(mediaId) {
      var targetSlide = track.querySelector('.sg-mob-slide[data-gallery-media-id="' + normalizeMediaId(mediaId) + '"]');
      if (!targetSlide) return;
      var idx = parseInt(targetSlide.getAttribute('data-index'), 10);
      if (!isNaN(idx)) goToMob(idx);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        goToMob(i, 'user');
      });
    });

    swiper.addEventListener('solarii:media-select', function (event) {
      var mediaId = event.detail && event.detail.mediaId;
      if (!mediaId) return;
      goToMediaMob(mediaId);
    });

    swiper.querySelectorAll('img, video').forEach(function (mediaEl) {
      mediaEl.setAttribute('draggable', 'false');
      mediaEl.addEventListener('dragstart', function (event) {
        event.preventDefault();
      });
    });

    swiper.addEventListener('contextmenu', function (event) {
      var target = event.target;
      if (!target) return;
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
        event.preventDefault();
      }
    });

    var mobileRoot = swiper.closest('product-info') || document;
    if (mobileRoot && !mobileRoot.dataset.sgMobileBridgeBound) {
      mobileRoot.dataset.sgMobileBridgeBound = 'true';
      mobileRoot.addEventListener('theme:media:select', function (event) {
        var mediaId = (event.target && event.target.getAttribute('data-gallery-media-id')) || (event.detail && event.detail.id);
        if (!mediaId) return;
        goToMediaMob(mediaId);
      });
    }

    (function () {
      var sx = 0;
      var sy = 0;
      var st = 0;
      var tracking = false;

      swiper.addEventListener('touchstart', function (e) {
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        st = Date.now();
        tracking = true;
        track.style.transition = 'none';
      }, { passive: true });

      swiper.addEventListener('touchmove', function (e) {
        if (!tracking) return;

        var dx = e.touches[0].clientX - sx;
        var dy = e.touches[0].clientY - sy;

        if (Math.abs(dx) > Math.abs(dy)) {
          track.style.transform = 'translateX(' + (-(currentIdx * swiper.offsetWidth) + dx) + 'px)';
        }
      }, { passive: true });

      swiper.addEventListener('touchend', function (e) {
        if (!tracking) return;
        tracking = false;

        track.style.transition = 'transform .4s cubic-bezier(.22,.61,.36,1)';
        var dx = e.changedTouches[0].clientX - sx;
        var vel = Math.abs(dx) / (Date.now() - st);

        if (Math.abs(dx) > swiper.offsetWidth * 0.25 || vel > 0.3) {
          if (dx < 0) goToMob(currentIdx + 1, 'user');
          else goToMob(currentIdx - 1, 'user');
        } else {
          goToMob(currentIdx, 'user');
        }
      }, { passive: true });
    })();

    mobSlides.forEach(function (slide) {
      var playOv = slide.querySelector('[data-sg-mob-play]');
      var poster = slide.querySelector('.sg-mob-poster');
      var vid = slide.querySelector('video');
      if (!playOv || !vid) return;

      playOv.addEventListener('click', function (e) {
        e.stopPropagation();
        if (vid.paused) {
          vid.play();
          playOv.classList.add('is-hidden');
          if (poster) poster.classList.add('is-hidden');
        } else {
          vid.pause();
          playOv.classList.remove('is-hidden');
        }
      });

      vid.addEventListener('pause', function () {
        playOv.classList.remove('is-hidden');
      });

      vid.addEventListener('play', function () {
        playOv.classList.add('is-hidden');
        if (poster) poster.classList.add('is-hidden');
      });
    });

    goToMob(0);
  }

  function initZoom() {
    var productInfo = document.querySelector('product-info');

    if (!productInfo || productInfo.dataset.sgZoomBound === 'true') return;
    if (typeof window.theme === 'undefined' || typeof window.theme.LoadPhotoswipe === 'undefined') return;

    productInfo.dataset.sgZoomBound = 'true';

    function getColorScheme() {
      return Array.from(productInfo.classList).find(function (className) {
        return className.indexOf('color-scheme') === 0;
      });
    }

    function getZoomCaption(item, captionContainer) {
      var captionMarkup = '';
      var captionNode = captionContainer.children[0];

      if (item && item.zoomCaptionEl) {
        captionMarkup = item.zoomCaptionEl.innerHTML;

        if (item.zoomCaptionEl.closest('.variant--soldout')) captionNode.classList.add('variant--soldout');
        else captionNode.classList.remove('variant--soldout');

        if (item.zoomCaptionEl.closest('.variant--unavailable')) captionNode.classList.add('variant--unavailable');
        else captionNode.classList.remove('variant--unavailable');
      }

      captionNode.innerHTML = captionMarkup;
      return false;
    }

    function buildZoomItems(images) {
      var zoomCaptionEl = productInfo.querySelector('[data-zoom-caption]');

      return images.map(function (image) {
        return {
          src: image.getAttribute('data-sg-zoom-src'),
          w: parseInt(image.getAttribute('data-sg-zoom-width'), 10),
          h: parseInt(image.getAttribute('data-sg-zoom-height'), 10),
          msrc: image.currentSrc || image.getAttribute('src'),
          zoomCaptionEl: zoomCaptionEl
        };
      });
    }

    function openZoom(images, activeIndex) {
      if (!images.length) return;

      var thumbsTemplate = productInfo.querySelector('[data-pswp-thumbs-template]');
      var thumbsMarkup = thumbsTemplate ? thumbsTemplate.innerHTML : '';
      var colorScheme = getColorScheme();
      var items = buildZoomItems(images);

      new window.theme.LoadPhotoswipe(items, {
        history: false,
        focus: false,
        index: activeIndex,
        mainClass: 'pswp-zoom-gallery' + (items.length === 1 ? ' pswp-zoom-gallery--single' : '') + (colorScheme ? ' ' + colorScheme : ''),
        showHideOpacity: true,
        howAnimationDuration: 150,
        hideAnimationDuration: 250,
        closeOnScroll: false,
        closeOnVerticalDrag: false,
        captionEl: true,
        closeEl: true,
        closeElClasses: ['caption-close', 'title'],
        tapToClose: false,
        clickToCloseNonZoomable: false,
        maxSpreadZoom: 2,
        loop: true,
        spacing: 0,
        allowPanToNext: true,
        pinchToClose: false,
        addCaptionHTMLFn: function (item, captionContainer) {
          return getZoomCaption(item, captionContainer);
        },
        getThumbBoundsFn: function () {
          var activeImage = images[activeIndex];
          var scrollTop = window.scrollY || document.documentElement.scrollTop;
          var bounds = activeImage.getBoundingClientRect();

          return {
            x: bounds.left,
            y: bounds.top + scrollTop,
            w: bounds.width
          };
        }
      });

      if (thumbsMarkup) {
        var thumbsContainer = document.querySelector('.pswp__thumbs');
        if (thumbsContainer) thumbsContainer.innerHTML = thumbsMarkup;
      }
    }

    function bindZoom(selector) {
      var images = Array.from(productInfo.querySelectorAll(selector));
      if (!images.length) return;

      images.forEach(function (image, index) {
        image.addEventListener('click', function (event) {
          event.preventDefault();
          openZoom(images, index);
          window.a11y.lastElement = image;
        });

        image.addEventListener('keyup', function (event) {
          if (event.code !== 'Enter') return;
          event.preventDefault();
          openZoom(images, index);
          window.a11y.lastElement = image;
        });
      });
    }

    bindZoom('.sg-desktop .sg-slide img[data-sg-zoomable]');
    bindZoom('.sg-mobile .sg-mob-slide img[data-sg-zoomable]');
  }

  function init() {
    if (window.innerWidth > 1024) {
      initDesktop();
    } else {
      initMobile();
    }

    initZoom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 300);
  });
})();
