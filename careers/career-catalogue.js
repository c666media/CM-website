(function () {
  'use strict';

  var API = 'https://script.google.com/macros/s/AKfycbwN2yoH-MHqysBi1cJEYj_f1iKbkYgCDHmMvCkzgttRS0uDkLGopfIhR6oPuwZlhqDecQ/exec';
  var root = document.querySelector('main[data-category]');

  if (!root) {
    console.error('[Corceptive Careers] Missing main[data-category] container.');
    return;
  }

  var type = root.getAttribute('data-category');
  var list = document.getElementById('listings');
  var info = document.getElementById('listing-info');

  if (!list || !info) {
    console.error('[Corceptive Careers] Catalogue containers missing.', {
      type: type,
      listingsContainerFound: !!list,
      infoContainerFound: !!info
    });
    if (info) info.textContent = 'Catalogue layout error — please contact our team.';
    if (list) list.innerHTML = '<div class="empty"><h2>Catalogue layout error.</h2><p>Please contact our team for assistance.</p></div>';
    return;
  }

  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.navlinks');

  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
      menu.textContent = open ? 'Close' : 'Menu';
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
        menu.textContent = 'Menu';
      });
    });
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function showEmpty() {
    info.textContent = '0 published opportunities';
    list.innerHTML = '<div class="empty"><div class="empty-mark">✧</div><h2>New opportunities are on the way.</h2><p>There are no published listings in this category at the moment. Check back soon or contact our team with your area of interest.</p><a class="btn" href="/contact">Contact our team ↗</a></div>';
  }

  function showError(message) {
    info.textContent = 'Listings temporarily unavailable';
    list.innerHTML = '<div class="empty"><div class="empty-mark">!</div><h2>We couldn’t load the opportunities.</h2><p>' + esc(message || 'Please refresh the page shortly. You can also contact our team for assistance.') + '</p><a class="btn" href="/contact">Contact our team ↗</a></div>';
  }

  function chips(item) {
    var keys = type === 'internships'
      ? ['duration', 'work_mode', 'location']
      : type === 'projects'
        ? ['project_type', 'duration', 'work_mode', 'location']
        : ['employer', 'employment_type', 'location'];

    return keys.map(function (key) {
      return item[key];
    }).filter(function (value) {
      return value !== undefined && value !== null && String(value).trim() !== '';
    }).slice(0, 4);
  }

 function card(item) {
    var id = item.listing_id || item.slug || '';
    var title = item.title || 'Opportunity';
    var description = item.short_description || 'View the full listing for more information.';
    var status = item.effective_status || 'Open';
    var tags = chips(item);

    return '<article class="listing"><div class="listing-top"><span class="status">' + esc(status) +
      '</span></div><h2>' + esc(title) + '</h2><p>' + esc(description) +
      '</p><div class="chips">' + tags.map(function (tag) {
        return '<span>' + esc(tag) + '</span>';
      }).join('') + '</div><a class="listing-link" href="../opportunity/?type=' +
      encodeURIComponent(type) + '&id=' + encodeURIComponent(id) +
      '">View opportunity <b>↗</b></a></article>';
}

  function load() {
    var callback = 'cmCareerCatalogueCallback';
    var script = document.createElement('script');
    var finished = false;
    var timer = window.setTimeout(function () {
      fail('The listings feed did not respond within 15 seconds.');
    }, 15000);

    function cleanup() {
      window.clearTimeout(timer);
      script.onerror = null;
      script.onload = null;
      if (script.parentNode) script.parentNode.removeChild(script);
      try {
        delete window[callback];
      } catch (error) {
        window[callback] = undefined;
      }
    }

    function fail(message) {
      if (finished) return;
      finished = true;
      cleanup();
      console.error('[Corceptive Careers] Catalogue request failed:', message);
      showError(message);
    }

    window[callback] = function (response) {
      if (finished) return;
      finished = true;
      cleanup();

      if (!response || response.ok !== true || !Array.isArray(response.items)) {
        console.error('[Corceptive Careers] Unexpected API response:', response);
        showError('The listings feed returned an unexpected response.');
        return;
      }

      if (!response.items.length) {
        showEmpty();
        return;
      }

      info.textContent = response.items.length + ' published ' +
        (response.items.length === 1 ? 'opportunity' : 'opportunities');
      list.innerHTML = response.items.map(card).join('');
      console.info('[Corceptive Careers] Loaded ' + response.items.length + ' ' + type + ' listing(s).');
    };

    script.onerror = function () {
      fail('The browser could not load the Google Apps Script listings feed. Check browser extensions or network filtering.');
    };

    script.src = API + '?action=list&type=' + encodeURIComponent(type) +
      '&callback=' + encodeURIComponent(callback) + '&_=' + Date.now();

    document.head.appendChild(script);
  }

  load();
})();
