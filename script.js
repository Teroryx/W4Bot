import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-analytics.js";

// === CONFIGURATION FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyAFFH15gz0mKrtZml-g7tmiN-1y8k8ghmA",
  authDomain: "w4bot-1ca1c.firebaseapp.com",
  projectId: "w4bot-1ca1c",
  storageBucket: "w4bot-1ca1c.firebasestorage.app",
  messagingSenderId: "294042118681",
  appId: "1:294042118681:web:d06f9080c27d971b099888",
  measurementId: "G-ZC3KNDBWDX"
};

// === INITIALISATION FIREBASE ===
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// === SÉLECTION DES ÉLÉMENTS DOM ===
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

let typingIndicator = null;      // Animation typing utilisateur
let botTypingIndicator = null;   // Animation typing bot
let lastUnknownQuestion = null;
const pseudo = "Anonyme";

// === MESSAGE D'ACCUEIL ALÉATOIRE ===
const welcomes = [
  "Salut ! Je suis W4Bot, prêt à papoter 😎",
  "Yo 👋 Besoin d'aide ?",
  "Bienvenue à bord, humain.",
  "Heureux de te revoir 👾",
  "Tape 'menu' pour savoir quoi me dire !"
];
typingMessage(welcomes[Math.floor(Math.random() * welcomes.length)], 'bot');

// === GESTION DE L'ENVOI DU FORMULAIRE ===
chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  showTypingIndicator();  // Affiche "Tu écris ..."
  userInput.value = '';

  setTimeout(() => {
    removeTypingIndicator();
    typingMessage(message, 'user');

    setTimeout(() => {
      showBotTyping(() => botResponse(message.toLowerCase()));
    }, 400);
  }, 1000);
});

// === ANIMATION "TU ÉCRIS ..." ===
function showTypingIndicator() {
  if (typingIndicator) return;
  typingIndicator = document.createElement('div');
  typingIndicator.classList.add('typing-indicator');
  typingIndicator.innerHTML = `Tu écris <span>.</span><span>.</span><span>.</span>`;
  chatBox.appendChild(typingIndicator);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
  if (typingIndicator) {
    typingIndicator.remove();
    typingIndicator = null;
  }
}

// === ANIMATION "W4Bot ÉCRIT ..." ===
function showBotTyping(callback) {
  if (botTypingIndicator) return;

  botTypingIndicator = document.createElement('div');
  botTypingIndicator.classList.add('typing-indicator');
  botTypingIndicator.textContent = "W4Bot écrit";
  const dots = document.createElement('span');
  dots.textContent = ".";
  dots.style.animation = "typingDot 1.2s infinite";
  botTypingIndicator.appendChild(dots.cloneNode(true));
  botTypingIndicator.appendChild(dots.cloneNode(true));
  botTypingIndicator.appendChild(dots.cloneNode(true));

  chatBox.appendChild(botTypingIndicator);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Simuler délai "écriture"
  setTimeout(() => {
    if (botTypingIndicator) {
      botTypingIndicator.remove();
      botTypingIndicator = null;
    }
    callback();
  }, 1500);
}

// === AFFICHER UN MESSAGE DANS LE CHAT ===
function typingMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);
  messageDiv.innerHTML = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// === ENVOYER UNE QUESTION NON RECONNUE À FIREBASE ===
function sendQuestionToFirebase(userPseudo, question) {
  return new Promise((resolve, reject) => {
    const questionsRef = ref(database, 'questions');
    const newQuestionRef = push(questionsRef);
    set(newQuestionRef, {
      pseudo: userPseudo,
      question: question,
      timestamp: new Date().toISOString()
    }).then(resolve).catch(reject);
  });
}

// === FONCTION PRINCIPALE DE RÉPONSE DU BOT ===
function botResponse(msg) {
  let response = "";

  // Si on répond "oui" ou "ok" après question inconnue, envoie à Firebase
  if ((msg === "oui" || msg === "ok") && lastUnknownQuestion) {
    sendQuestionToFirebase(pseudo, lastUnknownQuestion)
      .then(() => typingMessage("✅ Question envoyée à Enzo !", 'bot'))
      .catch(() => typingMessage("❌ Erreur lors de l'envoi, vérifie ta connexion internet", 'bot'));
    lastUnknownQuestion = null;
    return;
  }

  // Commande pour vider le chat
  if (msg === "/clear") {
    chatBox.innerHTML = '';
    return;
  }

  // Afficher le menu / commandes
  if (msg === "menu" || msg.includes("commandes") || msg.includes("liste")) {
    response = `
<b>Voici ce que tu peux me demander :</b><br>
- Bonjour / Salut 👋<br>
- Comment ça va ? 😊<br>
- Qui es-tu ? 🤖<br>
- C’est quoi ce site ? 🌐<br>
- Aide / Help 🆘<br>
- Merci 🙏<br>
- GitHub 💻<br>
- Ton créateur ? 🧠<br>
- Mode dark ? 🌒<br>
- Langages utilisés ? 📦<br>
- Version ? 🔢<br>
- Dis une blague 😂<br>
- Calculs (ex: 3+5*2) 🧮<br>
- Et quelques trucs en anglais 🇬🇧
    `;
  }
  // Calcul simple si uniquement chiffres et opérateurs
  else if (/^[0-9+\-*/(). ]+$/.test(msg)) {
    try {
      // Attention eval peut être risqué en vrai
      const result = eval(msg);
      response = `Le résultat est : <b>${result}</b>`;
    } catch {
      response = "Oups, ce calcul ne marche pas 😅";
    }
  }
  else if (msg.includes("bonjour") || msg.includes("salut")) {
    response = "Yo 👋 ! Bienvenue sur W4Bot.";
  }
  else if (msg.includes("comment ça va") || msg.includes("ça va")) {
    response = "Toujours au top ! Et toi ?";
  }
  else if (msg.includes("qui es-tu") || msg.includes("t'es qui")) {
    response = "Je suis <b>W4Bot</b>, le bot officiel de <b>W4Pulse</b> 🤖";
  }
  else if (msg.includes("aide") || msg.includes("help")) {
    response = "Tape <code>menu</code> pour voir toutes mes commandes 😉";
  }
  else if (msg.includes("merci")) {
    response = "Avec plaisir 😉";
  }
  else if (msg.includes("site web") || msg.includes("c’est quoi ce site")) {
    response = "Tu es sur le site officiel de <b>W4Pulse</b> 😎";
  }
  else if (msg.includes("github")) {
    response = `Le GitHub sera bientôt public 🔧 : <a href="#" target="_blank">Lien à venir</a>`;
  }
  else if (msg.includes("créateur") || msg.includes("fondateur") || msg.includes("admin")) {
    response = "Je suis né grâce à <b>Enzo Izinga</b> 👑";
  }
  else if (msg.includes("fonctionnalités")) {
    response = "Je réponds à des questions, je calcule, je blague et plus 😄";
  }
  else if (msg.includes("mode dark") || msg.includes("dark mode")) {
    response = "Toujours en full dark avec une touche néon 💡";
  }
  else if (msg.includes("langage") || msg.includes("technologie")) {
    response = "Je suis codé en <b>HTML</b>, <b>CSS</b> et <b>JavaScript</b>, avec Firebase côté serveur.";
  }
  else if (msg.includes("version")) {
    response = "Version 0.3.1 - Bêta.";
  }
  else if (msg.includes("blague")) {
    const jokes = [
      "Pourquoi les développeurs confondent Halloween et Noël ? Parce que OCT 31 == DEC 25.",
      "Un programmeur entre dans un bar... et commande une bière.",
      "Pourquoi le JavaScript est-il triste ? Parce qu’il n’aime pas être typé."
    ];
    response = jokes[Math.floor(Math.random() * jokes.length)];
  }
  else {
    response = "Je ne comprends pas... Veux-tu que j’enregistre ta question pour Enzo ? (réponds par 'oui' ou 'ok')";
    lastUnknownQuestion = msg;
  }

  typingMessage(response, 'bot');
}
