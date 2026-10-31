// Fichier fabriqué par pages.py : ne pas modifier à la main (les textes sont dans langues/).
(function () {
  var TEXTES = {
 "fr": {
  "un_dispo": "1 bonnet disponible en ce moment.",
  "n_dispo": "{n} bonnets disponibles en ce moment.",
  "vendu": "Vendu",
  "vendu_aria": "{nom}, vendu",
  "ouvrir": "{nom}, {prix}. Ouvrir la page du bonnet",
  "enquete_titre": "Petite enquête",
  "enquete_question": "On a besoin de ton avis : tu préfères quel bonnet ?",
  "enquete_aria": "Choisis ton bonnet préféré",
  "merci": "Merci ! Bonne visite.",
  "euro_devant": false
 },
 "en": {
  "un_dispo": "1 beanie available right now.",
  "n_dispo": "{n} beanies available right now.",
  "vendu": "Sold",
  "vendu_aria": "{nom}, sold",
  "ouvrir": "{nom}, {prix}. Open the beanie's page",
  "enquete_titre": "Quick survey",
  "enquete_question": "We need your opinion: which beanie do you prefer?",
  "enquete_aria": "Choose your favourite beanie",
  "merci": "Thank you! Enjoy your visit.",
  "euro_devant": true
 },
 "de": {
  "un_dispo": "1 Mütze ist gerade verfügbar.",
  "n_dispo": "{n} Mützen sind gerade verfügbar.",
  "vendu": "Verkauft",
  "vendu_aria": "{nom}, verkauft",
  "ouvrir": "{nom}, {prix}. Seite der Mütze öffnen",
  "enquete_titre": "Kleine Umfrage",
  "enquete_question": "Wir brauchen deine Meinung: Welche Mütze gefällt dir am besten?",
  "enquete_aria": "Wähle deine Lieblingsmütze",
  "merci": "Danke! Viel Spaß beim Stöbern.",
  "euro_devant": false
 },
 "es": {
  "un_dispo": "1 gorro disponible ahora mismo.",
  "n_dispo": "{n} gorros disponibles ahora mismo.",
  "vendu": "Vendido",
  "vendu_aria": "{nom}, vendido",
  "ouvrir": "{nom}, {prix}. Abrir la página del gorro",
  "enquete_titre": "Pequeña encuesta",
  "enquete_question": "Necesitamos tu opinión: ¿qué gorro prefieres?",
  "enquete_aria": "Elige tu gorro favorito",
  "merci": "¡Gracias! Buena visita.",
  "euro_devant": false
 }
};
  var racine = document.documentElement;
  var T = TEXTES[racine.lang] || TEXTES.fr;
  // 20 € en français, en allemand et en espagnol ; €20 en anglais
  T.prix = function (prix) {
    return T.euro_devant ? "€" + prix.replace(/\s*€/, "").replace(",", ".") : prix;
  };
  window.T = T;
  window.RACINE = racine.getAttribute("data-racine") || "";
})();
