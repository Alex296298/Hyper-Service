document.addEventListener('DOMContentLoaded', () => {
  // Wasser-Splash Container erzeugen
  const splash = document.createElement('div');
  splash.id = 'water-splash';
  document.body.appendChild(splash);

  // Funktion: Tropfen erstellen
  function createDrop(duration = 2000, large = false, leftPos = null) {
    const drop = document.createElement('div');
    drop.classList.add('drop');

    if (large) {
      drop.style.width = '14px';
      drop.style.height = '40px';
      drop.style.animationName = 'dropFallSplash';
      drop.style.animationDuration = '0.6s';
      drop.style.filter = 'drop-shadow(0 0 8px #43c6ac)';
      drop.style.opacity = '1';
    } else {
      drop.style.width = '8px';
      drop.style.height = '20px';
      drop.style.animationName = 'dropFall';
      drop.style.animationDuration = (1 + Math.random() * 1.2) + 's';
      drop.style.filter = 'drop-shadow(0 0 5px #43c6ac)';
      drop.style.opacity = '0.8';
    }

    drop.style.left = leftPos !== null ? leftPos + 'px' : Math.random() * window.innerWidth + 'px';

    splash.appendChild(drop);

    setTimeout(() => drop.remove(), duration);
  }

  // Dauerhaft kleine Tropfen animieren (Hintergrundwasser)
  setInterval(() => createDrop(), 300);

  // Seitenwechsel Links abfangen
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href === window.location.pathname.split('/').pop()) return;

      e.preventDefault();

      // Große Tropfen Splash erzeugen
      for (let i = 0; i < 20; i++) {
        createDrop(700, true, (window.innerWidth / 20) * i + 20 + Math.random() * 20);
      }

      // Body fade out
      document.body.classList.add('page-transition');

      // Nach 600ms weiter zur neuen Seite
      setTimeout(() => {
        window.location.href = href;
      }, 600);
    });
  });
});
