// ── HAMBURGER MENU ──
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav-overlay');
    const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
    
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('active');
      mobileBackdrop.classList.toggle('active');
    });
    
    // Close mobile nav when link is clicked
    document.querySelectorAll('#mobile-nav-overlay a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        mobileBackdrop.classList.remove('active');
      });
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        mobileBackdrop.classList.remove('active');
      }
    });

    // ── SCROLL REVEAL ──
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // Stagger grid children
    document.querySelectorAll('.features-grid, .req-grid, .steps, .presence-grid, .showcase-grid').forEach(parent => {
      [...parent.querySelectorAll('.reveal')].forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.07}s`;
      });
    });

    // ── FEATURES CAROUSEL ──
    function initCarousel() {
      const container = document.querySelector('.carousel-container');
      const track = document.getElementById('features-track');
      const rawSlides = [...track.querySelectorAll('.carousel-slide')];
      const dotsContainer = document.getElementById('features-dots');
      if (!track || rawSlides.length === 0) return;

      let offset = 0;
      let slidesPerView = 3;
      let currentIndex = 0;
      let isPaused = false;
      let pauseTimeout = null;
      let rafId = null;
      let isDragging = false;
      let isHovering = false;
      let startX = 0;
      let dragStartOffset = 0;
      let dragDistance = 0;
      let lastTime = 0;
      let velocity = 0;
      let lastPointerX = 0;
      let lastMoveTime = 0;
      let momentumId = null;
      const DRAG_THRESHOLD = 10;

      rawSlides.forEach(s => track.appendChild(s.cloneNode(true)));

      function getSlideWidth() {
        const first = track.querySelector('.carousel-slide');
        return first ? first.getBoundingClientRect().width : 0;
      }

      function getSetWidth() {
        const first = track.children[0];
        const clone = track.children[rawSlides.length];
        if (!first || !clone) return 0;
        return clone.getBoundingClientRect().left - first.getBoundingClientRect().left;
      }

      function getSlidesPerView() {
        if (window.innerWidth <= 640) return 1;
        if (window.innerWidth <= 1120) return 2;
        return 3;
      }

      function getMaxIndex() {
        return Math.max(0, rawSlides.length - slidesPerView);
      }

      function getSpeed() {
        const sw = getSlideWidth();
        if (!sw) return 0;
        return sw / 5000;
      }

      function tick(time) {
        if (!isPaused) {
          if (lastTime === 0) lastTime = time;
          const dt = Math.min(time - lastTime, 50);
          const speed = getSpeed();
          if (speed > 0) {
            offset += speed * dt;
            const setW = getSetWidth();
            if (setW > 0 && offset >= setW) offset -= setW;
            track.style.transform = `translateX(${-offset}px)`;
            updateCurrentIndex();
          }
          lastTime = time;
        }
        rafId = requestAnimationFrame(tick);
      }

      function wrapOffset() {
        const setW = getSetWidth();
        if (setW <= 0) return;
        offset = ((offset % setW) + setW) % setW;
      }

      function updateCurrentIndex() {
        const sw = getSlideWidth();
        if (!sw) return;
        const idx = Math.round(offset / sw);
        const maxIdx = getMaxIndex();
        const clamped = Math.min(idx, maxIdx);
        if (clamped !== currentIndex) {
          currentIndex = clamped;
          updateDots();
        }
      }

      function createDots() {
        dotsContainer.innerHTML = '';
        slidesPerView = getSlidesPerView();
        const totalDots = Math.max(1, rawSlides.length - slidesPerView + 1);
        for (let i = 0; i < totalDots; i++) {
          const dot = document.createElement('span');
          dot.className = 'carousel-dot' + (i === currentIndex ? ' active' : '');
          dotsContainer.appendChild(dot);
        }
      }

      function updateDots() {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
      }

      function pauseAutoScroll() {
        isPaused = true;
      }

      function resumeAutoScroll() {
        isPaused = false;
        lastTime = 0;
      }

      container.addEventListener('mouseenter', () => { isHovering = true; pauseAutoScroll(); });
      container.addEventListener('mouseleave', () => { isHovering = false; resumeAutoScroll(); });

      track.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        lastPointerX = e.clientX;
        lastMoveTime = performance.now();
        velocity = 0;
        dragDistance = 0;
        dragStartOffset = offset;
        track.classList.add('grabbing');
        pauseAutoScroll();
        track.setPointerCapture(e.pointerId);
        if (momentumId) {
          cancelAnimationFrame(momentumId);
          momentumId = null;
        }
      });

      track.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        dragDistance = Math.abs(dx);
        offset = dragStartOffset - dx;
        const now = performance.now();
        const dt = now - lastMoveTime;
        if (dt > 0) {
          velocity = (lastPointerX - e.clientX) / dt;
        }
        lastPointerX = e.clientX;
        lastMoveTime = now;
        track.style.transform = `translateX(${-offset}px)`;
      });

      track.addEventListener('pointerup', () => {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('grabbing');
        if (Math.abs(velocity) > 0.15) {
          applyMomentum(velocity);
        } else {
          finishScroll();
        }
      });

      function applyMomentum(vel) {
        const friction = 0.92;
        const minVel = 0.3;
        function step() {
          vel *= friction;
          if (Math.abs(vel) < minVel) {
            momentumId = null;
            finishScroll();
            return;
          }
          offset += vel * 16;
          track.style.transform = `translateX(${-offset}px)`;
          momentumId = requestAnimationFrame(step);
        }
        momentumId = requestAnimationFrame(step);
      }

      function finishScroll() {
        wrapOffset();
        track.style.transform = `translateX(${-offset}px)`;
        updateCurrentIndex();
        if (!isHovering) resumeAutoScroll();
      }

      track.addEventListener('pointercancel', () => {
        isDragging = false;
        track.classList.remove('grabbing');
        finishScroll();
      });

      track.addEventListener('click', (e) => {
        if (dragDistance > DRAG_THRESHOLD) e.preventDefault();
      });

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const oldSpv = slidesPerView;
          slidesPerView = getSlidesPerView();
          if (slidesPerView !== oldSpv) {
            const sw = getSlideWidth();
            if (sw) {
              const idx = Math.round(offset / sw);
              const maxIdx = getMaxIndex();
              currentIndex = Math.min(idx, maxIdx);
              offset = currentIndex * sw;
              track.style.transform = `translateX(${-offset}px)`;
              updateDots();
            }
            createDots();
          }
        }, 150);
      });

      createDots();
      rafId = requestAnimationFrame(tick);
    }

    initCarousel();

    // ── GITHUB RELEASE FETCH ──
    async function fetchRelease() {
      const REPO = 'd1vid3d/CraftDaemon';
      try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
          headers: { Accept: 'application/vnd.github+json' }
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const d = await res.json();

        const version = d.tag_name || 'Unknown';
        const url     = './releases.html';
        const body    = d.body     || '_No changelog provided._';
        const date    = d.published_at
          ? new Date(d.published_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
          : '';

        // Hero badge
        const bt = document.getElementById('release-badge-text');
        bt.textContent = `Current Release: ${version}`;
        bt.classList.remove('loading-text');
        document.getElementById('release-badge').href = url;
        
        // Mobile badge
        const btMobile = document.querySelector('#release-badge-mobile .loading-text');
        if (btMobile) btMobile.textContent = `Current Release: ${version}`;

        // Card header
        document.getElementById('cl-version').textContent = version;
        document.getElementById('cl-date').textContent    = date;
        document.getElementById('cl-link').href           = url;

        // Changelog body
        document.getElementById('cl-body').innerHTML = renderMd(body);

      } catch(err) {
        const bt = document.getElementById('release-badge-text');
        bt.textContent = 'Current Release';
        bt.classList.remove('loading-text');
        document.getElementById('cl-version').textContent = '—';
        document.getElementById('cl-body').innerHTML =
          `<div class="release-error">⚠ Could not load changelog. &nbsp;<a href="https://github.com/${REPO}/releases" target="_blank" style="color:var(--blurple-bright)">View on GitHub ↗</a></div>`;
      }
    }

    // Lightweight markdown → HTML
    function renderMd(md) {
      const lines = md.split('\n');
      let html = '', inList = false, inCode = false, inTable = false;
      let codeLines = [], tableRows = [];

      const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
      const closeTable = () => {
        if (!inTable) return;
        if (tableRows.length < 2) { tableRows = []; inTable = false; return; }
        const headerCells = tableRows[0].split('|').filter(c => c.trim() !== '');
        const bodyRows = tableRows.slice(2);
        let tHtml = '<table class="changelog-table"><thead><tr>';
        headerCells.forEach(c => { tHtml += `<th>${inline(escapeHtml(c.trim()))}</th>`; });
        tHtml += '</tr></thead><tbody>';
        bodyRows.forEach(row => {
          const cells = row.split('|').filter(c => c.trim() !== '');
          if (cells.length === 0) return;
          tHtml += '<tr>';
          cells.forEach(c => { tHtml += `<td>${inline(escapeHtml(c.trim()))}</td>`; });
          tHtml += '</tr>';
        });
        tHtml += '</tbody></table>';
        html += tHtml;
        tableRows = [];
        inTable = false;
      };

      const escapeHtml = t => t
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const flushCodeBlock = () => {
        if (!inCode) return;
        const code = escapeHtml(codeLines.join('\n'));
        html += `<pre><code>${code}</code></pre>`;
        inCode = false;
        codeLines = [];
      };

      const inline = t => t
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

      for (const line of lines) {
        if (/^```/.test(line.trim())) {
          closeTable();
          closeList();
          if (inCode) {
            flushCodeBlock();
          } else {
            inCode = true;
          }
          continue;
        }

        if (inCode) {
          codeLines.push(line);
          continue;
        }

        if (/^\|.+\|/.test(line.trim())) {
          closeList();
          tableRows.push(line);
          if (!inTable) inTable = true;
          continue;
        }

        if (inTable) {
          closeTable();
        }

        if      (/^###\s/.test(line)) { closeList(); html += `<h3>${inline(escapeHtml(line.slice(4)))}</h3>`; }
        else if (/^##\s/.test(line))  { closeList(); html += `<h2>${inline(escapeHtml(line.slice(3)))}</h2>`; }
        else if (/^#\s/.test(line))   { closeList(); html += `<h2>${inline(escapeHtml(line.slice(2)))}</h2>`; }
        else if (/^[-*+]\s/.test(line)) {
          if (!inList) { html += '<ul>'; inList = true; }
          html += `<li>${inline(escapeHtml(line.slice(2)))}</li>`;
        } else if (/^\s*((---+)|(\*\*\*+)|(___+))\s*$/.test(line)) {
          closeList();
          html += '<hr />';
        } else if (line.trim() === '') { closeList(); }
        else { closeList(); html += `<p>${inline(escapeHtml(line))}</p>`; }
      }
      flushCodeBlock();
      closeList();
      closeTable();
      return `<div class="changelog-content">${html}</div>`;
    }

    // ── COLLAPSE/EXPAND RELEASE CARD ──
    document.getElementById('release-card-toggle').addEventListener('click', () => {
      const body = document.getElementById('release-card-body');
      const arrow = document.querySelector('.release-toggle-arrow');
      body.classList.toggle('collapsed');
      arrow.classList.toggle('collapsed');
    });

    // Collapse by default
    document.getElementById('release-card-body').classList.add('collapsed');
    document.querySelector('.release-toggle-arrow').classList.add('collapsed');

    // ── FETCH PREVIOUS RELEASES ──
    async function fetchPreviousReleases() {
      const REPO = 'd1vid3d/CraftDaemon';
      try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=5`, {
          headers: { Accept: 'application/vnd.github+json' }
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const releases = await res.json();

        // Filter out the latest release, show up to N amount of older ones including a "View All" card
        const older = releases.slice(1, 4);

        const grid = document.getElementById('prev-releases-grid');

        if (older.length === 0) {
          grid.innerHTML = 
            '<div style="grid-column:1/-1; text-align:center; color:var(--text-dimmer); font-family:var(--mono); font-size:0.75rem;">No previous releases</div>';
          return;
        }

        grid.innerHTML = '';

        older.forEach(release => {
          const version = release.tag_name || 'Unknown';
          const url = release.html_url || `https://github.com/${REPO}/releases`;
          const date = release.published_at
            ? new Date(release.published_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
            : '';

          const card = document.createElement('div');
          card.className = 'previous-release-card';
          card.innerHTML = `
            <div class="prev-version">${version}</div>
            <div class="prev-date">${date}</div>
            <a href="${url}" target="_blank" class="prev-link">View Release ↗</a>
          `;
          grid.appendChild(card);
        });

        // Add "View All Releases" card
        const allCard = document.createElement('div');
        allCard.className = 'previous-release-card view-all-card';
        allCard.innerHTML = `
          <div class="prev-version" style="color:var(--blurple-bright);">View All Releases</div>
          <div class="prev-date" style="color:var(--text-dimmer);">Full release history</div>
          <a href="./releases.html" class="prev-link" style="color:var(--blurple-bright); border-color:rgba(88,101,242,0.35);">Browse All →</a>
        `;
        grid.appendChild(allCard);
      } catch(err) {
        const grid = document.getElementById('prev-releases-grid');
        grid.innerHTML = 
          `<div style="grid-column:1/-1; text-align:center; color:var(--text-dimmer); font-family:var(--mono); font-size:0.75rem;">Could not load previous releases</div>`;
        // Still show the link
        const container = grid.parentElement;
        const viewAll = document.createElement('div');
        viewAll.style.cssText = 'text-align:center; margin-top:1.5rem;';
        viewAll.innerHTML = `<a href="./releases.html" class="btn-secondary" style="font-size:0.75rem;">Browse All Releases →</a>`;
        container.appendChild(viewAll);
      }
    }

    fetchRelease();
    fetchPreviousReleases();
