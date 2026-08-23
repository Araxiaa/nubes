// Révélation des panneaux au défilement
const panneaux = document.querySelectorAll('.panneau');
const observateur = new IntersectionObserver((entrees)=>{
  entrees.forEach(entree=>{
    if(entree.isIntersecting){
      entree.target.classList.add('visible');
      observateur.unobserve(entree.target);
    }
  });
},{threshold:.12, rootMargin:'0px 0px -60px 0px'});
panneaux.forEach(p=>observateur.observe(p));

// Barres PV / PA
const barres = document.querySelectorAll('.stat-remplissage');
const observateurStats = new IntersectionObserver((entrees)=>{
  entrees.forEach(entree=>{
    if(entree.isIntersecting){
      entree.target.style.width = entree.target.dataset.valeur + '%';
      observateurStats.unobserve(entree.target);
    }
  });
},{threshold:.3});
barres.forEach(b=>observateurStats.observe(b));

// Filtres de la page Relations
const pilules = document.querySelectorAll('.filtre-pilule');
const cartesRelation = document.querySelectorAll('.carte-relation');
if(pilules.length){
  pilules.forEach(pilule=>{
    pilule.addEventListener('click', ()=>{
      pilules.forEach(p=>p.classList.remove('actif'));
      pilule.classList.add('actif');
      const categorie = pilule.dataset.filtre;
      cartesRelation.forEach(carte=>{
        const correspond = categorie === 'toutes' || carte.dataset.categorie === categorie;
        carte.classList.toggle('masquee', !correspond);
      });
    });
  });
}

// Menu mobile
const burger = document.querySelector('.nav-burger');
const liens = document.querySelector('.nav-liens');
if(burger){
  burger.addEventListener('click', ()=>{
    liens.classList.toggle('ouvert');
  });
  liens.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=> liens.classList.remove('ouvert'));
  });
}
