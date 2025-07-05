document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('water-splash');
  const body = document.body;

  // Wasser Tropfen erzeugen (normale Tropfen)
  function createDrop() {
    const drop = document.createElement('div');
    drop.classList.add('drop');
    drop.style.left = Math.random() * window.innerWidth + 'px';
    drop.style.animationDuration = 1 + Math.random() * 1.2 + 's';
    splash.appendChild(drop);

    setTimeout(() => {
      drop.remove();
    }, 2200);
  }

  setInterval(createDrop, 300);

  // Seitenwechsel Animation verbessern
  const links = document.querySelectorAll('nav a');

  links.forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');

      if (!href || href === '#' || href === window.location.pathname.split('/').pop()) return;

      e.preventDefault();

      // Wasser Splash Aktivieren
      splash.classList.add('splash-active');

      // Große Tropfen für Splash erzeugen
      for (let i = 0; i < 20; i++) {
        const drop = document.createElement('div');
        drop.classList.add('drop');
        drop.style.left = (window.innerWidth / 20) * i + 20 + Math.random() * 20 + 'px';
        drop.style.animationDuration = 0.6 + Math.random() * 0.3 + 's';
        splash.appendChild(drop);

        setTimeout(() => drop.remove(), 700);
      }

      // Body ausblenden (600ms)
      body.classList.add('page-transition');

      setTimeout(() => {
        window.location.href = href;
      }, 600);
    });
  });

  // Popup-Logik (für angebote.html)
  const popup = document.getElementById('popup');
  if (popup) {
    const popupTitle = document.getElementById('popup-title');
    const popupDescription = document.getElementById('popup-description');
    const popupVersions = document.getElementById('popup-versions');
    const popupClose = document.getElementById('popup-close');

    const scriptDetails = {
      gps: {
        title: 'GPS Tracker',
        description: 'Mit unserem GPS Tracker kannst du die Position von Spielern in Echtzeit verfolgen. Perfekt für Roleplay und Sicherheit.',
        versions: ['ESX', 'QBcore'],
      },
      jail: {
        title: 'Jail Script',
        description: 'Das Jail Script ermöglicht ein realistisches In-Game Gefängnis mit vielen Features und Anpassungen.',
        versions: ['ESX', 'QBcore'],
      },
      admin: {
        title: 'Admin Tools',
        description: 'Vielseitige Admin Tools für Serververwaltung, Player Management und Logs.',
        versions: ['ESX', 'QBcore'],
      },
      performance: {
        title: 'Performance Optimierung',
        description: 'Skripte und Einstellungen zur Verbesserung der Serverperformance und Stabilität.',
        versions: ['ESX', 'QBcore'],
      },
      custom: {
        title: 'Individuelle Anpassungen',
        description: 'Maßgeschneiderte Scripts, die genau auf deinen Server zugeschnitten sind.',
        versions: ['ESX', 'QBcore'],
      },
      dokuments: {
        title: 'Dokumenten Script',
        description: 'Verwalte Spielerdokumente wie Führerscheine, Pässe oder Ausweise mit einfachem Handling.',
        versions: ['ESX', 'QBcore'],
      },
      casesystem: {
        title: 'Casesystem V3',
        description: 'Ein voll funktionsfähiges Casesystem zum Verwalten von Spielerfällen, Strafanzeigen und Beweisen.',
        versions: ['ESX', 'QBcore'],
      },
      panicbutton: {
        title: 'Panic Button',
        description: 'Ein Notfall-Knopf für Spieler, der sofort Admins alarmiert und Hilfe anfordert.',
        versions: ['ESX', 'QBcore'],
      },
    };

    function openPopup(scriptKey) {
      const data = scriptDetails[scriptKey];
      if (!data) return;

      popupTitle.textContent = data.title;
      popupDescription.textContent = data.description;

      popupVersions.innerHTML = '';
      data.versions.forEach(ver => {
        const li = document.createElement('li');
        li.textContent = ver;
        popupVersions.appendChild(li);
      });

      popup.classList.add('active');
    }

    document.querySelectorAll('.popup-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const scriptKey = btn.getAttribute('data-script');
        openPopup(scriptKey);
      });
    });

    popupClose.addEventListener('click', () => {
      popup.classList.remove('active');
    });

    popup.addEventListener('click', e => {
      if (e.target === popup) {
        popup.classList.remove('active');
      }
    });
  }
});
