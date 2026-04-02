/* Solarii Stone Spec Card */
(function () {
  'use strict';

  var drawerReady = false;

  var FIELD_RULES = {
    ms_carat: {
      exact: ['carat', 'carat weight'],
      fuzzy: ['center stone carat', 'main stone carat', 'center stone weight', 'main stone weight']
    },
    ms_color: {
      exact: ['color', 'color grade'],
      fuzzy: ['center stone color', 'main stone color', 'stone color', 'center stone color grade', 'main stone color grade'],
      exclude: ['plating', 'accent', 'side', 'metal', 'band']
    },
    ms_clarity: {
      exact: ['clarity', 'clarity grade'],
      fuzzy: ['center stone clarity', 'main stone clarity', 'stone clarity'],
      exclude: ['accent', 'side']
    },
    ms_cut: {
      exact: ['cut', 'cut grade'],
      fuzzy: ['center stone cut', 'main stone cut', 'stone cut'],
      exclude: ['shape']
    },
    ms_shape: {
      exact: ['shape'],
      fuzzy: ['center stone shape', 'main stone shape', 'stone shape'],
      exclude: ['profile', 'band']
    },
    ms_origin: {
      exact: ['stone origin', 'gem type', 'stone type'],
      fuzzy: ['center stone type', 'main stone type', 'gemstone'],
      exclude: ['accent', 'side']
    },
    ks_width: {
      exact: ['width', 'band width', 'ring width', 'shank width']
    },
    ks_tcw: {
      exact: ['approx tcw', 'tcw', 'total carat weight'],
      fuzzy: ['accent stone total carat weight', 'side stone total carat weight', 'accent gem total carat weight']
    },
    ks_metal: {
      exact: ['metal', 'material', 'metal type']
    },
    ks_accent_color: {
      exact: ['accent color', 'accent stone color', 'side stone color', 'side stones color'],
      fuzzy: ['accent gems color', 'accent diamond color']
    },
    ks_accent_clarity: {
      exact: ['accent clarity', 'accent stone clarity', 'side stone clarity', 'side stones clarity'],
      fuzzy: ['accent gems clarity', 'accent diamond clarity']
    },
    ks_profile: {
      exact: ['profile', 'setting profile', 'ring profile']
    }
  };

  function cleanText(value) {
    return (value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function normalize(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function isExcluded(key, list) {
    if (!list || !list.length) return false;

    return list.some(function (item) {
      return key.indexOf(item) > -1;
    });
  }

  function extractTableData(markup) {
    var data = {};

    if (!markup || typeof DOMParser === 'undefined') return data;

    var doc = new DOMParser().parseFromString(markup, 'text/html');

    doc.querySelectorAll('tr').forEach(function (row) {
      var cells = [];

      row.querySelectorAll('th, td').forEach(function (cell) {
        var text = cleanText(cell.textContent);
        if (text) cells.push(text);
      });

      if (cells.length < 2) return;

      var key = normalize(cells[0]);
      var value = cleanText(cells.slice(1).join(' '));

      if (!key || !value || data[key]) return;
      data[key] = value;
    });

    return data;
  }

  function findValue(data, rule) {
    var keys = Object.keys(data);
    var exact = rule.exact || [];
    var fuzzy = rule.fuzzy || [];
    var exclude = rule.exclude || [];
    var i;
    var j;
    var key;
    var candidate;

    for (i = 0; i < exact.length; i += 1) {
      candidate = normalize(exact[i]);

      for (j = 0; j < keys.length; j += 1) {
        key = keys[j];
        if (isExcluded(key, exclude)) continue;
        if (key === candidate) return data[key];
      }
    }

    for (i = 0; i < fuzzy.length; i += 1) {
      candidate = normalize(fuzzy[i]);

      for (j = 0; j < keys.length; j += 1) {
        key = keys[j];
        if (isExcluded(key, exclude)) continue;
        if (key.indexOf(candidate) > -1 || candidate.indexOf(key) > -1) return data[key];
      }
    }

    return '';
  }

  function parseCaratFromTitle(title) {
    var match = cleanText(title).match(/(\d+(?:\.\d+)?)\s*(?:ct|carat)\b/i);
    return match ? match[1] + ' CT' : '';
  }

  function findTokenMatch(items, source) {
    var index;

    for (index = 0; index < items.length; index += 1) {
      if (source.indexOf(items[index].token) > -1) return items[index];
    }

    return null;
  }

  function parseShapeFromTitle(title) {
    var normalizedTitle = normalize(title);
    var shapes = [
      { token: 'radiant', label: 'Radiant' },
      { token: 'marquise', label: 'Marquise' },
      { token: 'cushion', label: 'Cushion' },
      { token: 'emerald', label: 'Emerald' },
      { token: 'princess', label: 'Princess' },
      { token: 'round', label: 'Round' },
      { token: 'oval', label: 'Oval' },
      { token: 'pear', label: 'Pear' },
      { token: 'asscher', label: 'Asscher' },
      { token: 'heart', label: 'Heart' }
    ];

    var match = findTokenMatch(shapes, normalizedTitle);

    return match ? match.label : '';
  }

  function parseMetalFromTitle(title) {
    var normalizedTitle = normalize(title);
    var metals = [
      { token: '925 sterling silver', label: '925 Sterling Silver' },
      { token: 'sterling silver', label: 'Sterling Silver' },
      { token: '18k white gold', label: '18K White Gold' },
      { token: '14k white gold', label: '14K White Gold' },
      { token: '10k white gold', label: '10K White Gold' },
      { token: '18k yellow gold', label: '18K Yellow Gold' },
      { token: '14k yellow gold', label: '14K Yellow Gold' },
      { token: '10k yellow gold', label: '10K Yellow Gold' },
      { token: '18k rose gold', label: '18K Rose Gold' },
      { token: '14k rose gold', label: '14K Rose Gold' },
      { token: '10k rose gold', label: '10K Rose Gold' },
      { token: 'platinum', label: 'Platinum' }
    ];

    var match = findTokenMatch(metals, normalizedTitle);

    return match ? match.label : '';
  }

  function parseOriginFromTitle(title) {
    var normalizedTitle = normalize(title);
    var origins = [
      { token: 'moissanite', label: 'Moissanite' },
      { token: 'lab diamond', label: 'Lab Diamond' },
      { token: 'simulated diamonds', label: 'Simulated Diamonds' },
      { token: 'simulated diamond', label: 'Simulated Diamond' },
      { token: 'cubic zirconia', label: 'Cubic Zirconia' },
      { token: 'cz', label: 'Cubic Zirconia' },
      { token: 'diamond', label: 'Diamond' }
    ];

    var match = findTokenMatch(origins, normalizedTitle);

    return match ? match.label : '';
  }

  function isYes(value) {
    var normalizedValue = normalize(value);
    return normalizedValue === 'yes' || normalizedValue === 'true' || normalizedValue === 'y' || normalizedValue === 'included';
  }

  function setField(card, key, value) {
    if (!value) return;

    card.querySelectorAll('[data-ssc-field="' + key + '"]').forEach(function (node) {
      node.textContent = value;
    });
  }

  function getMetalPreset(metal) {
    var normalizedMetal = normalize(metal);

    if (
      normalizedMetal.indexOf('sterling silver') > -1 ||
      normalizedMetal.indexOf('925 silver') > -1 ||
      normalizedMetal.indexOf('925 sterling') > -1
    ) {
      return [
        { pct: 92.5, label: 'Silver', color: '#cfd4db' },
        { pct: 7.5, label: 'Alloy', color: '#9d846f' }
      ];
    }

    return null;
  }

  function applyMetalPreset(card, segments) {
    var offset = 25;

    [1, 2, 3, 4].forEach(function (index) {
      var segment = segments[index - 1];
      var circle = card.querySelector('[data-ssc-metal-circle="' + index + '"]');
      var legend = card.querySelector('[data-ssc-metal-legend="' + index + '"]');
      var dot = card.querySelector('[data-ssc-metal-dot="' + index + '"]');
      var text = card.querySelector('[data-ssc-metal-text="' + index + '"]');

      if (!circle || !legend || !dot || !text) return;

      if (!segment) {
        circle.style.display = 'none';
        legend.hidden = true;
        return;
      }

      circle.style.display = '';
      circle.setAttribute('stroke', segment.color);
      circle.setAttribute('stroke-dasharray', segment.pct + ' ' + (100 - segment.pct));
      circle.setAttribute('stroke-dashoffset', offset);

      dot.style.background = segment.color;
      text.textContent = segment.pct + '% ' + segment.label;
      legend.hidden = false;

      offset -= segment.pct;
    });
  }

  function applyAutoFill(card) {
    var source = card.querySelector('[data-ssc-source]');
    var title = card.getAttribute('data-ssc-product-title') || '';
    var defaultMetal = card.getAttribute('data-ssc-default-metal') || '';
    var rowData = extractTableData(source ? source.innerHTML : '');
    var fields = {
      ms_carat: findValue(rowData, FIELD_RULES.ms_carat) || parseCaratFromTitle(title),
      ms_color: findValue(rowData, FIELD_RULES.ms_color),
      ms_clarity: findValue(rowData, FIELD_RULES.ms_clarity),
      ms_cut: findValue(rowData, FIELD_RULES.ms_cut),
      ms_shape: findValue(rowData, FIELD_RULES.ms_shape) || parseShapeFromTitle(title),
      ms_origin: findValue(rowData, FIELD_RULES.ms_origin) || parseOriginFromTitle(title),
      ks_width: findValue(rowData, FIELD_RULES.ks_width),
      ks_tcw: findValue(rowData, FIELD_RULES.ks_tcw),
      ks_metal: findValue(rowData, FIELD_RULES.ks_metal) || parseMetalFromTitle(title),
      ks_accent_color: findValue(rowData, FIELD_RULES.ks_accent_color),
      ks_accent_clarity: findValue(rowData, FIELD_RULES.ks_accent_clarity),
      ks_profile: findValue(rowData, FIELD_RULES.ks_profile)
    };

    Object.keys(fields).forEach(function (key) {
      setField(card, key, fields[key]);
    });

    var metalComp = card.querySelector('[data-ssc-metal-comp]');
    var metalNote = card.querySelector('[data-ssc-metal-note]');
    var metalPreset = getMetalPreset(fields.ks_metal);
    var rhodiumValue = findValue(rowData, { exact: ['rhodium', 'rhodium plated'] });

    if (metalComp) {
      if (metalPreset) {
        metalComp.hidden = false;
        applyMetalPreset(card, metalPreset);
      } else if (fields.ks_metal && normalize(fields.ks_metal) !== normalize(defaultMetal)) {
        metalComp.hidden = true;
      }
    }

    if (metalNote) {
      if (isYes(rhodiumValue)) {
        metalNote.textContent = 'Rhodium plated finish';
        metalNote.hidden = false;
      } else if ((fields.ks_metal || defaultMetal).toLowerCase().indexOf('white gold') > -1) {
        metalNote.textContent = '*All white gold pieces are Rhodium plated';
        metalNote.hidden = false;
      } else {
        metalNote.textContent = '';
        metalNote.hidden = true;
      }
    }
  }

  function openDrawer(title, body) {
    var overlay = document.getElementById('sscOverlay');
    var wrap = document.getElementById('sscDrawerWrap');
    var titleEl = document.getElementById('sscDrawerTitle');
    var bodyEl = document.getElementById('sscDrawerBody');

    if (!overlay || !wrap || !titleEl || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = '<p>' + body + '</p>';
    overlay.classList.add('is-open');
    wrap.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    var overlay = document.getElementById('sscOverlay');
    var wrap = document.getElementById('sscDrawerWrap');

    if (overlay) overlay.classList.remove('is-open');
    if (wrap) wrap.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function bindDrawer() {
    if (drawerReady) return;

    var overlay = document.getElementById('sscOverlay');
    var wrap = document.getElementById('sscDrawerWrap');
    var close = document.getElementById('sscDrawerClose');
    var floatClose = document.getElementById('sscFloatClose');

    if (!overlay || !wrap || !close || !floatClose) return;

    if (overlay.parentNode !== document.body) document.body.appendChild(overlay);
    if (wrap.parentNode !== document.body) document.body.appendChild(wrap);

    close.addEventListener('click', closeDrawer);
    floatClose.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeDrawer();
    });

    drawerReady = true;
  }

  function initCard(card) {
    if (card.dataset.sscReady === 'true') return;
    card.dataset.sscReady = 'true';

    applyAutoFill(card);
    bindDrawer();

    card.querySelectorAll('[data-ssc-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        card.querySelectorAll('[data-ssc-tab]').forEach(function (node) {
          node.classList.remove('is-active');
        });

        card.querySelectorAll('[data-ssc-panel]').forEach(function (panel) {
          panel.classList.remove('is-active');
        });

        tab.classList.add('is-active');

        var target = card.querySelector('[data-ssc-panel="' + tab.dataset.sscTab + '"]');
        if (target) target.classList.add('is-active');
      });
    });

    card.querySelectorAll('[data-ssc-tip]').forEach(function (tip) {
      tip.addEventListener('click', function (event) {
        event.stopPropagation();
        openDrawer(tip.dataset.sscTitle || '', tip.dataset.sscBody || '');
      });
    });
  }

  function initAll() {
    document.querySelectorAll('[data-ssc]').forEach(initCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', initAll);
})();
