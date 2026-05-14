// Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav-overlay');
    
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('active');
    });
    
    // Close mobile nav when link is clicked
    document.querySelectorAll('#mobile-nav-overlay a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
      });
    });
    
    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
    
    // Close sidebar when a link is clicked on mobile
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
        }
      });
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        sidebar.classList.remove('open');
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
      }
    });

    // Fetch release info for navbar badge
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
        // Update mobile badge too
        const btMobile = document.querySelector('#release-badge-mobile .loading-text');
        if (btMobile) btMobile.textContent = `Current Release: ${version}`;
      } catch(err) {
        const bt = document.getElementById('release-badge-text');
        bt.textContent = 'Current Release';
        bt.classList.remove('loading-text');
      }
    }

    fetchReleaseBadge();

    // Sidebar active link tracking
    const links = document.querySelectorAll('.sidebar-link');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(link => link.classList.remove('active'));
          const activeLink = document.querySelector(`.sidebar-link[href="#${entry.target.id}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, { threshold: 0.1, rootMargin: '-50px 0px -50px 0px' });

    document.querySelectorAll('.doc-section').forEach(section => {
      observer.observe(section);
    });
