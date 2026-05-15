// ── HAMBURGER MENU ──
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav-overlay');
    const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
    
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('active');
      mobileBackdrop.classList.toggle('active');
    });
    
    document.querySelectorAll('#mobile-nav-overlay a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        mobileBackdrop.classList.remove('active');
      });
    });
    
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

    // ── GITHUB RELEASE FETCH ──
    async function fetchAllReleases() {
      const REPO = 'd1vid3d/CraftDaemon';
      const loadingEl = document.getElementById('releases-loading');
      const listEl = document.getElementById('releases-list');

      try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=30`, {
          headers: { Accept: 'application/vnd.github+json' }
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const releases = await res.json();

        if (releases.length === 0) {
          loadingEl.innerHTML = '<span>No releases found.</span>';
          return;
        }

        loadingEl.style.display = 'none';

        releases.forEach((release, index) => {
          const isFirst = index === 0;
          const version = release.tag_name || 'Unknown';
          const url = release.html_url || `https://github.com/${REPO}/releases`;
          const date = release.published_at
            ? new Date(release.published_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
            : '';
          const body = release.body || '_No changelog provided._';

          const card = document.createElement('div');
          card.className = 'release-card';

          const header = document.createElement('div');
          header.className = 'release-card-header';

          const left = document.createElement('div');
          left.className = 'release-card-header-left';
          left.innerHTML = `
            <span class="release-version-tag">${version}</span>
            <span class="release-date">${date}</span>
          `;

          if (isFirst) {
            const badge = document.createElement('span');
            badge.className = 'release-latest-badge';
            badge.innerHTML = '<span class="release-latest-dot"></span>Latest';
            left.appendChild(badge);
          }

          const right = document.createElement('div');
          right.className = 'release-card-header-right';
          right.innerHTML = `
            <a href="${url}" target="_blank" class="release-gh-link" onclick="event.stopPropagation();">View on GitHub ↗</a>
            <div class="release-toggle-arrow collapsed"></div>
          `;

          header.appendChild(left);
          header.appendChild(right);

          const bodyEl = document.createElement('div');
          bodyEl.className = 'release-card-body collapsed';
          bodyEl.innerHTML = renderMd(body);

          header.addEventListener('click', () => {
            bodyEl.classList.toggle('collapsed');
            right.querySelector('.release-toggle-arrow').classList.toggle('collapsed');
          });

          card.appendChild(header);
          card.appendChild(bodyEl);
          listEl.appendChild(card);

          if (isFirst) {
            const separator = document.createElement('div');
            separator.className = 'releases-separator';
            separator.textContent = 'Previous Releases';
            listEl.appendChild(separator);
          }
        });
      } catch(err) {
        loadingEl.innerHTML = `<span>⚠ Could not load releases. <a href="https://github.com/${REPO}/releases" target="_blank" style="color:var(--blurple-bright)">View on GitHub ↗</a></span>`;
      }
    }

    // ── LIGHTWEIGHT MARKDOWN → HTML (same renderer as index) ──
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
          if (inCode) { flushCodeBlock(); }
          else { inCode = true; }
          continue;
        }

        if (inCode) { codeLines.push(line); continue; }

        if (/^\|.+\|/.test(line.trim())) {
          closeList();
          tableRows.push(line);
          if (!inTable) inTable = true;
          continue;
        }

        if (inTable) closeTable();

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

    // ── FETCH RELEASE BADGE ──
    async function fetchReleaseBadge() {
      const REPO = 'd1vid3d/CraftDaemon';
      try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
          headers: { Accept: 'application/vnd.github+json' }
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const d = await res.json();
        const version = d.tag_name || 'Unknown';
        const bt = document.getElementById('release-badge-text');
        bt.textContent = `Current Release: ${version}`;
        bt.classList.remove('loading-text');
        document.getElementById('release-badge').href = './releases.html';
        const btMobile = document.querySelector('#release-badge-mobile .loading-text');
        if (btMobile) btMobile.textContent = `Current Release: ${version}`;
      } catch(err) {
        const bt = document.getElementById('release-badge-text');
        bt.textContent = 'Current Release';
        bt.classList.remove('loading-text');
      }
    }

    fetchReleaseBadge();
    fetchAllReleases();
