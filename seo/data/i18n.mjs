// Localized copy + keyword targeting for every language.
// Keywords are woven into titles, H1s, intros and FAQs naturally — Google ignores <meta keywords>
// and punishes stuffing, so each phrase appears where a human would expect it.
//
// cats: key -> [display name, URL slug, primary keyword phrase used in title/H1]
//
// FEATURE FLAGS — flip to true when the feature ships, then run `node scripts/build.mjs`.
// While false, the copy says "coming soon"; once true, it describes the feature as available.
// Copy must never promise what the game doesn't do yet (users bounce, and it erodes trust).

// Romanian: numbers from 20 up take "de" ("57 de întrebări").
const roN = (n) => `${n}${n % 100 >= 20 || (n >= 100 && n % 100 === 0) ? ' de' : ''}`;
export const FEATURES = {
  friend: true, // private rooms: 5-character code or /c/<code> link
  ranked: true, // live matchmaking + Glicko-2 ratings, leagues, leaderboard (ghost/bot fallback after a few seconds)
};

export const SITE = {
  name: '1v1game',
  origin: 'https://1v1game.net',
  defaultLang: 'en',
  twitter: '', // e.g. '@1v1game' once the account exists
  ogImage: '/og.png', // the site's existing 1200x630 share image
};

export const CAT_KEYS = ['geography', 'capitals', 'history', 'science', 'space', 'sports', 'movies', 'music', 'art'];

// features: string = always true; [flag, text] = shown as "text (coming soon)" while FEATURES[flag] is false.
// faq: [q, a] = always; { flag, q, on, off } = answer depends on FEATURES[flag].

export const LANGS = {
  en: {
    name: 'English', locale: 'en_US', prefix: '',
    home: {
      modes: 'Also inside: a flag quiz with 194 countries, chess puzzles, a mental math game and a real 3D Rubik’s Cube.',
      title: '1v1game – Free 1v1 Quiz Game Online: Trivia, Flags, Chess & Math',
      desc: '1v1game is a free 1v1 quiz game in your browser: trivia duels with 1,200+ questions, a flag quiz, chess puzzles and mental math. No download, no sign-up.',
      h1: '1v1 Trivia Quiz: General Knowledge Duels',
      lead: 'Prove you know more. Start a free 1v1 quiz duel in seconds, answer general knowledge questions against the clock and win the best of three.',
      paras: [
        '1v1game is a free trivia game you play right in your browser – on phone, tablet or PC, with no app and no sign-up. Press Play and you get an opponent instantly: three rounds on random topics, best of three wins.',
        'Questions cover general knowledge from geography, history and science to sports, movies, music, art and space. Use it as a pub quiz in your pocket, a brain game for a coffee break or practice for your next trivia night.',
      ],
      features: ['Instant 1v1 duels, no waiting: a live opponent, or a recorded or computer opponent when nobody is online', ['friend', 'Challenge a friend with a private link'], ['ranked', 'Ranked online matches against real players'], '1,200+ trivia questions in 12 categories', 'Free, browser-based, works on mobile'],
      faq: [
        ['Is 1v1game free?', 'Yes. 1v1game is a free online trivia game. You can play quiz duels in your browser without downloading anything.'],
        ['How does a 1v1 quiz duel work?', 'You and your opponent play three rounds on random topics. Win two rounds and you win the duel.'],
        { flag: 'friend', q: 'Can I play trivia with friends online?', on: 'Yes. Create a match, share the invite link and your friend joins instantly.', off: 'Friend duels with a private invite link are coming soon. Right now Play finds you an opponent automatically, free and without sign-up.' },
        { flag: 'ranked', q: 'Can I play against real people?', on: 'Yes. Press Play and you are matched with a real player of similar rating. If nobody is online within a few seconds, you play a recorded duel of a real player or a computer opponent instead, so you never wait.', off: 'Ranked online matches against real players are coming soon. Today every duel is against a bot, so you can practise any time without waiting.' },
        ['What topics are in the quiz?', 'Geography, history, science, space, sports, movies and TV, music, art and literature – classic general knowledge trivia for all levels.'],
      ],
      cta: 'Play a 1v1 quiz now',
    },
    hub: {
      title: 'Free Trivia Questions and Answers by Category | 1v1game',
      desc: 'General knowledge trivia questions with answers: geography, history, science, space, sports, movies, music and art quizzes. Practice, then play a 1v1 quiz duel.',
      h1: 'Trivia Questions and Answers',
      lead: 'Pick a category, test yourself with real quiz questions and answers, then put your knowledge to work in a 1v1 trivia duel.',
    },
    cat: {
      title: (kw, n) => `${kw}: ${n} Trivia Questions & Answers + 1v1 Duel | 1v1game`,
      desc: (kw, n) => `${kw} with answers – ${n} free trivia questions to test your general knowledge. Think you know more? Prove it in a 1v1 quiz duel.`,
      h1: (kw) => `${kw} – Questions and Answers`,
      intro: (kw, n) => `Try this free ${kw.toLowerCase()}: ${n} trivia questions with answers hidden under each question. Tap a question to reveal the answer, then put your knowledge to the test in a 1v1 quiz duel.`,
    },
    ui: { show: 'Show answer', play: 'Play 1v1 now', home: 'Home', quizzes: 'Quizzes', more: 'More trivia categories', faq: 'Frequently asked questions', langs: 'Languages', why: 'Why play 1v1game', ready: 'Ready for a duel?', readyText: 'Reading answers is easy. Winning a 1v1 duel against the clock is not. Start a free trivia duel now.', soon: 'coming soon' },
    cats: {
      geography: ['Geography', 'geography', 'Geography Quiz'],
      capitals: ['World Capitals', 'world-capitals', 'World Capitals Quiz'],
      history: ['History', 'history', 'History Quiz'],
      science: ['Science', 'science', 'Science Quiz'],
      space: ['Space & Astronomy', 'space', 'Space Quiz'],
      sports: ['Sports', 'sports', 'Sports Quiz'],
      movies: ['Movies & TV', 'movies', 'Movie Quiz'],
      music: ['Music', 'music', 'Music Quiz'],
      art: ['Art & Literature', 'art-literature', 'Art and Literature Quiz'],
    },
  },

  es: {
    name: 'Español', locale: 'es_ES', prefix: '/es',
    home: {
      modes: 'Y además: quiz de banderas con 194 países, problemas de ajedrez, cálculo mental y un cubo de Rubik 3D de verdad.',
      title: 'Trivia 1 contra 1 online – Preguntas de cultura general | 1v1game',
      desc: 'Trivia 1 contra 1 gratis en el navegador: duelos de cultura general con más de 1.200 preguntas, quiz de banderas, ajedrez y cálculo mental. Sin descargas ni registro.',
      h1: 'Juego de preguntas y respuestas 1 contra 1',
      lead: 'Demuestra quién sabe más. Empieza un duelo de trivia gratis en segundos, responde preguntas de cultura general contra el reloj y gana al mejor de tres.',
      paras: [
        '1v1game es un juego de trivia gratis que se juega en el navegador: en el móvil, la tablet o el PC, sin instalar nada y sin registro. Pulsa Jugar y tendrás rival al instante: tres rondas de temas al azar, gana el mejor de tres.',
        'Hay preguntas de cultura general de geografía, historia, ciencia, deportes, cine, música, arte y el espacio. Ideal como quiz de bolsillo, para entrenar la mente en cinco minutos o para preparar tu próxima noche de trivia.',
      ],
      features: ['Duelos 1 contra 1 al instante: un rival en vivo o, si no hay nadie conectado, uno grabado o del ordenador', ['friend', 'Reta a un amigo con un enlace privado'], ['ranked', 'Partidas online clasificatorias contra jugadores reales'], 'Más de 1.200 preguntas en 12 categorías', 'Gratis, en el navegador y en el móvil'],
      faq: [
        ['¿1v1game es gratis?', 'Sí. Es un juego de preguntas y respuestas online totalmente gratis que funciona en el navegador, sin descargas.'],
        ['¿Cómo funciona un duelo 1 contra 1?', 'Tú y tu rival jugáis tres rondas de temas al azar. Gana dos rondas y ganas el duelo.'],
        { flag: 'friend', q: '¿Puedo jugar a trivia con amigos online?', on: 'Sí. Crea una partida, comparte el enlace y tu amigo entra al instante.', off: 'Los duelos con amigos mediante enlace privado llegan pronto. Por ahora Jugar te busca rival automáticamente, gratis y sin registro.' },
        { flag: 'ranked', q: '¿Puedo jugar contra personas reales?', on: 'Sí. Pulsa Jugar y te emparejamos con un jugador real de nivel parecido. Si no hay nadie conectado en unos segundos, juegas contra la partida grabada de un jugador real o contra el ordenador, así que nunca esperas.', off: 'Las partidas online clasificatorias contra jugadores reales llegan pronto. Hoy cada duelo es contra un bot, así que puedes practicar cuando quieras sin esperar.' },
        ['¿Qué temas incluye el quiz?', 'Geografía, historia, ciencia, espacio, deportes, cine y series, música, arte y literatura.'],
      ],
      cta: 'Jugar un duelo 1 contra 1',
    },
    hub: {
      title: 'Preguntas de cultura general con respuestas por categoría | 1v1game',
      desc: 'Preguntas de cultura general con respuestas: geografía, historia, ciencia, espacio, deportes, cine, música y arte. Practica y juega un duelo de trivia 1 contra 1.',
      h1: 'Preguntas de cultura general con respuestas',
      lead: 'Elige una categoría, ponte a prueba con preguntas y respuestas reales y luego demuestra lo que sabes en un duelo de trivia 1 contra 1.',
    },
    cat: {
      title: (kw, n) => `${kw}: ${n} preguntas con respuestas + duelo 1v1 | 1v1game`,
      desc: (kw, n) => `${kw} con respuestas: ${n} preguntas de cultura general gratis. ¿Crees que sabes más? Demuéstralo en un duelo de trivia 1 contra 1.`,
      h1: (kw) => `${kw}: preguntas y respuestas`,
      intro: (kw, n) => `${kw} gratis: ${n} preguntas de trivia con la respuesta oculta debajo de cada una. Toca una pregunta para ver la respuesta y después demuestra lo que sabes en un duelo 1 contra 1.`,
    },
    ui: { show: 'Ver respuesta', play: 'Jugar 1v1 ahora', home: 'Inicio', quizzes: 'Quizzes', more: 'Más categorías de trivia', faq: 'Preguntas frecuentes', langs: 'Idiomas', why: 'Por qué jugar a 1v1game', ready: '¿Listo para un duelo?', readyText: 'Leer respuestas es fácil. Ganar un duelo 1 contra 1 contra el reloj, no tanto. Empieza gratis un duelo de trivia.', soon: 'próximamente' },
    cats: {
      geography: ['Geografía', 'geografia', 'Quiz de geografía'],
      capitals: ['Capitales del mundo', 'capitales', 'Quiz de capitales del mundo'],
      history: ['Historia', 'historia', 'Quiz de historia'],
      science: ['Ciencia', 'ciencia', 'Quiz de ciencia'],
      space: ['Espacio y astronomía', 'espacio', 'Quiz del espacio'],
      sports: ['Deportes', 'deportes', 'Quiz de deportes'],
      movies: ['Cine y series', 'cine', 'Quiz de cine'],
      music: ['Música', 'musica', 'Quiz de música'],
      art: ['Arte y literatura', 'arte-literatura', 'Quiz de arte y literatura'],
    },
  },

  pt: {
    name: 'Português', locale: 'pt_BR', prefix: '/pt',
    home: {
      modes: 'E mais: quiz de bandeiras com 194 países, problemas de xadrez, cálculo mental e um cubo mágico 3D de verdade.',
      title: 'Quiz 1x1 online – Perguntas de conhecimentos gerais | 1v1game',
      desc: 'Quiz 1x1 grátis no navegador: duelos de conhecimentos gerais com mais de 1.200 perguntas, quiz de bandeiras, xadrez e cálculo mental. Sem download e sem cadastro.',
      h1: 'Jogo de perguntas e respostas 1x1 online',
      lead: 'Prove quem sabe mais. Comece um duelo de quiz grátis em segundos, responda perguntas de conhecimentos gerais contra o relógio e vença a melhor de três.',
      paras: [
        '1v1game é um jogo de quiz grátis que roda no navegador – no celular, tablet ou PC, sem instalar nada e sem cadastro. Aperte Jogar e você tem um adversário na hora: três rodadas com temas aleatórios, vence quem ganhar duas.',
        'São perguntas de conhecimentos gerais sobre geografia, história, ciência, esportes, filmes, música, arte e espaço. Perfeito para treinar o cérebro em poucos minutos ou se preparar para a próxima noite de quiz.',
      ],
      features: ['Duelos 1x1 instantâneos: um adversário ao vivo ou, se ninguém estiver online, um gravado ou do computador', ['friend', 'Desafie um amigo com um link privado (X1)'], ['ranked', 'Partidas online ranqueadas contra jogadores reais'], 'Mais de 1.200 perguntas em 12 categorias', 'Grátis, no navegador e no celular'],
      faq: [
        ['O 1v1game é grátis?', 'Sim. É um jogo de perguntas e respostas online totalmente grátis, direto no navegador, sem download.'],
        ['Como funciona um duelo 1x1?', 'Você e seu adversário jogam três rodadas com temas aleatórios. Quem vencer duas rodadas ganha o duelo.'],
        { flag: 'friend', q: 'Posso jogar quiz com amigos online?', on: 'Sim. Crie uma partida, compartilhe o link e seu amigo entra na hora para um X1.', off: 'Os duelos com amigos por link privado chegam em breve. Por enquanto o botão Jogar encontra um adversário automaticamente, grátis e sem cadastro.' },
        { flag: 'ranked', q: 'Posso jogar contra pessoas reais?', on: 'Sim. Aperte Jogar e você enfrenta um jogador real de nível parecido. Se ninguém estiver online em alguns segundos, você joga contra a partida gravada de um jogador real ou contra o computador, então nunca espera.', off: 'As partidas online ranqueadas contra jogadores reais chegam em breve. Hoje cada duelo é contra um bot, então você pode treinar a qualquer hora, sem esperar.' },
        ['Quais temas tem o quiz?', 'Geografia, história, ciência, espaço, esportes, filmes e séries, música, arte e literatura.'],
      ],
      cta: 'Jogar um quiz 1x1',
    },
    hub: {
      title: 'Perguntas de conhecimentos gerais com respostas | 1v1game',
      desc: 'Perguntas de conhecimentos gerais com respostas: geografia, história, ciência, espaço, esportes, filmes, música e arte. Treine e jogue um quiz 1x1.',
      h1: 'Perguntas de conhecimentos gerais com respostas',
      lead: 'Escolha uma categoria, teste-se com perguntas e respostas reais e depois mostre o que sabe num duelo de quiz 1x1.',
    },
    cat: {
      title: (kw, n) => `${kw}: ${n} perguntas e respostas + duelo 1x1 | 1v1game`,
      desc: (kw, n) => `${kw} com respostas: ${n} perguntas de conhecimentos gerais grátis. Acha que sabe mais? Prove num duelo de quiz 1x1.`,
      h1: (kw) => `${kw}: perguntas e respostas`,
      intro: (kw, n) => `${kw} grátis: ${n} perguntas com a resposta escondida embaixo de cada uma. Toque numa pergunta para ver a resposta e depois mostre o que sabe num duelo 1x1.`,
    },
    ui: { show: 'Ver resposta', play: 'Jogar 1x1 agora', home: 'Início', quizzes: 'Quizzes', more: 'Mais categorias de quiz', faq: 'Perguntas frequentes', langs: 'Idiomas', why: 'Por que jogar 1v1game', ready: 'Pronto para um duelo?', readyText: 'Ler respostas é fácil. Vencer um duelo 1x1 contra o relógio, nem tanto. Comece agora um quiz 1x1 grátis.', soon: 'em breve' },
    cats: {
      geography: ['Geografia', 'geografia', 'Quiz de geografia'],
      capitals: ['Capitais do mundo', 'capitais', 'Quiz de capitais do mundo'],
      history: ['História', 'historia', 'Quiz de história'],
      science: ['Ciência', 'ciencia', 'Quiz de ciência'],
      space: ['Espaço e astronomia', 'espaco', 'Quiz sobre o espaço'],
      sports: ['Esportes', 'esportes', 'Quiz de esportes'],
      movies: ['Filmes e séries', 'filmes', 'Quiz de filmes'],
      music: ['Música', 'musica', 'Quiz de música'],
      art: ['Arte e literatura', 'arte-literatura', 'Quiz de arte e literatura'],
    },
  },

  fr: {
    name: 'Français', locale: 'fr_FR', prefix: '/fr',
    home: {
      modes: 'Et aussi : un quiz des drapeaux avec 194 pays, des problèmes d’échecs, du calcul mental et un vrai Rubik’s Cube en 3D.',
      title: 'Quiz 1 contre 1 en ligne – Culture générale en duel | 1v1game',
      desc: 'Quiz 1 contre 1 gratuit en ligne : duels de culture générale avec plus de 1 200 questions, quiz des drapeaux, échecs et calcul mental. Sans inscription.',
      h1: 'Quiz de culture générale en duel 1 contre 1',
      lead: 'Prouvez que vous en savez plus. Lancez un duel de quiz gratuit en quelques secondes, répondez à des questions de culture générale contre la montre et gagnez deux manches sur trois.',
      paras: [
        '1v1game est un jeu de quiz gratuit qui se joue dans le navigateur – sur mobile, tablette ou PC, sans rien installer ni s’inscrire. Appuyez sur Jouer et un adversaire est là tout de suite : trois manches sur des thèmes au hasard, le premier à deux manches gagne.',
        'Les questions de culture générale couvrent la géographie, l’histoire, les sciences, le sport, le cinéma, la musique, l’art et l’espace. Idéal pour entraîner sa mémoire pendant la pause ou préparer votre prochaine soirée quiz.',
      ],
      features: ['Duels 1 contre 1 instantanés : un adversaire en direct ou, si personne n’est en ligne, un adversaire enregistré ou l’ordinateur', ['friend', 'Défiez un ami avec un lien privé'], ['ranked', 'Parties classées en ligne contre de vrais joueurs'], 'Plus de 1 200 questions dans 12 catégories', 'Gratuit, dans le navigateur et sur mobile'],
      faq: [
        ['1v1game est-il gratuit ?', 'Oui. C’est un jeu de quiz en ligne entièrement gratuit, directement dans le navigateur, sans téléchargement.'],
        ['Comment fonctionne un duel 1 contre 1 ?', 'Vous et votre adversaire jouez trois manches sur des thèmes au hasard. Gagnez deux manches et vous remportez le duel.'],
        { flag: 'friend', q: 'Peut-on jouer à un quiz entre amis en ligne ?', on: 'Oui. Créez une partie, partagez le lien et votre ami vous rejoint immédiatement.', off: 'Les duels entre amis avec un lien privé arrivent bientôt. Pour l’instant, Jouer vous trouve un adversaire automatiquement, gratuitement et sans inscription.' },
        { flag: 'ranked', q: 'Peut-on jouer contre de vraies personnes ?', on: 'Oui. Appuyez sur Jouer et vous affrontez un vrai joueur de niveau proche. Si personne n’est en ligne au bout de quelques secondes, vous jouez contre la partie enregistrée d’un vrai joueur ou contre l’ordinateur : vous n’attendez jamais.', off: 'Les parties classées en ligne contre de vrais joueurs arrivent bientôt. Aujourd’hui, chaque duel se joue contre un bot : vous pouvez vous entraîner à tout moment, sans attendre.' },
        ['Quels thèmes contient le quiz ?', 'Géographie, histoire, sciences, espace, sport, cinéma et séries, musique, art et littérature.'],
      ],
      cta: 'Jouer un duel 1 contre 1',
    },
    hub: {
      title: 'Questions de culture générale avec réponses par thème | 1v1game',
      desc: 'Questions de culture générale avec réponses : géographie, histoire, sciences, espace, sport, cinéma, musique et art. Entraînez-vous puis jouez un duel de quiz 1v1.',
      h1: 'Questions de culture générale avec réponses',
      lead: 'Choisissez un thème, testez-vous avec de vraies questions-réponses, puis mettez vos connaissances à l’épreuve en duel 1 contre 1.',
    },
    cat: {
      title: (kw, n) => `${kw} : ${n} questions et réponses + duel 1v1 | 1v1game`,
      desc: (kw, n) => `${kw} avec réponses : ${n} questions de culture générale gratuites. Vous pensez en savoir plus ? Prouvez-le en duel de quiz 1 contre 1.`,
      h1: (kw) => `${kw} : questions et réponses`,
      intro: (kw, n) => `${kw} gratuit : ${n} questions avec la réponse cachée sous chacune. Touchez une question pour voir la réponse, puis mesurez-vous en duel 1 contre 1.`,
    },
    ui: { show: 'Voir la réponse', play: 'Jouer en 1v1', home: 'Accueil', quizzes: 'Quiz', more: 'Autres thèmes de quiz', faq: 'Questions fréquentes', langs: 'Langues', why: 'Pourquoi jouer à 1v1game', ready: 'Prêt pour un duel ?', readyText: 'Lire les réponses, c’est facile. Gagner un duel 1 contre 1 contre la montre, beaucoup moins. Lancez un duel de quiz gratuit.', soon: 'bientôt' },
    cats: {
      geography: ['Géographie', 'geographie', 'Quiz de géographie'],
      capitals: ['Capitales du monde', 'capitales', 'Quiz des capitales du monde'],
      history: ['Histoire', 'histoire', 'Quiz d’histoire'],
      science: ['Sciences', 'sciences', 'Quiz de sciences'],
      space: ['Espace et astronomie', 'espace', 'Quiz sur l’espace'],
      sports: ['Sport', 'sport', 'Quiz de sport'],
      movies: ['Cinéma et séries', 'cinema', 'Quiz cinéma'],
      music: ['Musique', 'musique', 'Quiz de musique'],
      art: ['Art et littérature', 'art-litterature', 'Quiz d’art et de littérature'],
    },
  },

  de: {
    name: 'Deutsch', locale: 'de_DE', prefix: '/de',
    home: {
      modes: 'Außerdem: ein Flaggen-Quiz mit 194 Ländern, Schachaufgaben, Kopfrechnen und ein echter 3D-Zauberwürfel.',
      title: '1 gegen 1 Quiz online – Allgemeinwissen im Duell | 1v1game',
      desc: 'Kostenloses 1 gegen 1 Quiz im Browser: Wissensduelle mit über 1.200 Quizfragen, dazu Flaggen-Quiz, Schachaufgaben und Kopfrechnen. Ohne Download, ohne Anmeldung.',
      h1: 'Allgemeinwissen Quiz: 1 gegen 1 im Duell',
      lead: 'Beweise, wer mehr weiß. Starte in Sekunden ein kostenloses Quiz-Duell, beantworte Quizfragen zum Allgemeinwissen gegen die Uhr und gewinne zwei von drei Runden.',
      paras: [
        '1v1game ist ein kostenloses Quiz, das du direkt im Browser spielst – auf Handy, Tablet oder PC, ganz ohne App und ohne Anmeldung. Drück auf Spielen und du hast sofort einen Gegner: drei Runden mit zufälligen Themen, wer zwei gewinnt, gewinnt das Duell.',
        'Die Quizfragen decken Allgemeinwissen aus Geografie, Geschichte, Wissenschaft, Sport, Film, Musik, Kunst und Weltraum ab. Perfekt als Gehirntraining zwischendurch oder zur Vorbereitung auf den nächsten Quizabend.',
      ],
      features: ['Sofortige 1 gegen 1 Duelle: ein Live-Gegner oder, wenn niemand online ist, ein aufgezeichneter oder Computer-Gegner', ['friend', 'Freunde per privatem Link herausfordern'], ['ranked', 'Ranglisten-Spiele online gegen echte Spieler'], 'Über 1.200 Quizfragen in 12 Kategorien', 'Kostenlos, im Browser und auf dem Handy'],
      faq: [
        ['Ist 1v1game kostenlos?', 'Ja. 1v1game ist ein komplett kostenloses Online-Quiz, das direkt im Browser läuft – ohne Download.'],
        ['Wie funktioniert ein 1 gegen 1 Quiz?', 'Du und dein Gegner spielt drei Runden mit zufälligen Themen. Wer zwei Runden gewinnt, gewinnt das Duell.'],
        { flag: 'friend', q: 'Kann ich online mit Freunden quizzen?', on: 'Ja. Erstelle ein Spiel, teile den Link und dein Freund ist sofort dabei.', off: 'Duelle mit Freunden per privatem Link kommen bald. Im Moment findet „Spielen“ automatisch einen Gegner für dich – kostenlos und ohne Anmeldung.' },
        { flag: 'ranked', q: 'Kann ich gegen echte Menschen spielen?', on: 'Ja. Drück auf Spielen und du triffst auf einen echten Spieler mit ähnlicher Wertung. Ist nach ein paar Sekunden niemand online, spielst du gegen die aufgezeichnete Partie eines echten Spielers oder gegen den Computer – du wartest also nie.', off: 'Ranglisten-Spiele online gegen echte Spieler kommen bald. Aktuell spielst du jedes Duell gegen einen Bot – so kannst du jederzeit ohne Wartezeit üben.' },
        ['Welche Themen gibt es?', 'Geografie, Geschichte, Wissenschaft, Weltraum, Sport, Filme und Serien, Musik, Kunst und Literatur.'],
      ],
      cta: 'Jetzt 1 gegen 1 spielen',
    },
    hub: {
      title: 'Quizfragen mit Antworten zum Allgemeinwissen | 1v1game',
      desc: 'Quizfragen mit Antworten: Geografie, Geschichte, Wissenschaft, Weltraum, Sport, Filme, Musik und Kunst. Erst üben, dann im 1 gegen 1 Quiz-Duell gewinnen.',
      h1: 'Quizfragen mit Antworten',
      lead: 'Wähle eine Kategorie, teste dich mit echten Quizfragen und Antworten und beweise dein Wissen dann im 1 gegen 1 Duell.',
    },
    cat: {
      title: (kw, n) => `${kw}: ${n} Quizfragen mit Antworten + 1v1 Duell | 1v1game`,
      desc: (kw, n) => `${kw} mit Antworten – ${n} kostenlose Quizfragen zum Allgemeinwissen. Du weißt mehr? Beweise es im 1 gegen 1 Quiz-Duell.`,
      h1: (kw) => `${kw}: Fragen und Antworten`,
      intro: (kw, n) => `${kw} kostenlos: ${n} Quizfragen, die Antwort steht versteckt unter jeder Frage. Tippe auf eine Frage, um die Lösung zu sehen – und beweise dein Wissen danach im 1 gegen 1 Duell.`,
    },
    ui: { show: 'Antwort zeigen', play: 'Jetzt 1v1 spielen', home: 'Start', quizzes: 'Quiz', more: 'Weitere Quiz-Kategorien', faq: 'Häufige Fragen', langs: 'Sprachen', why: 'Warum 1v1game spielen', ready: 'Bereit für ein Duell?', readyText: 'Antworten lesen ist leicht. Ein 1 gegen 1 Duell gegen die Uhr zu gewinnen nicht. Starte jetzt ein kostenloses Quiz-Duell.', soon: 'bald verfügbar' },
    cats: {
      geography: ['Geografie', 'geografie', 'Geografie Quiz'],
      capitals: ['Hauptstädte der Welt', 'hauptstaedte', 'Hauptstädte Quiz'],
      history: ['Geschichte', 'geschichte', 'Geschichte Quiz'],
      science: ['Wissenschaft', 'wissenschaft', 'Wissenschaft Quiz'],
      space: ['Weltraum und Astronomie', 'weltraum', 'Weltraum Quiz'],
      sports: ['Sport', 'sport', 'Sport Quiz'],
      movies: ['Filme und Serien', 'filme', 'Film Quiz'],
      music: ['Musik', 'musik', 'Musik Quiz'],
      art: ['Kunst und Literatur', 'kunst-literatur', 'Kunst und Literatur Quiz'],
    },
  },

  it: {
    name: 'Italiano', locale: 'it_IT', prefix: '/it',
    home: {
      modes: 'E in più: quiz sulle bandiere con 194 paesi, problemi di scacchi, calcolo mentale e un vero cubo di Rubik in 3D.',
      title: 'Quiz 1 contro 1 online – Sfida di cultura generale | 1v1game',
      desc: 'Quiz 1 contro 1 gratis nel browser: sfide di cultura generale con oltre 1.200 domande, quiz sulle bandiere, scacchi e calcolo mentale. Senza download né registrazione.',
      h1: 'Quiz di cultura generale: sfida 1 contro 1',
      lead: 'Dimostra chi ne sa di più. Inizia una sfida a quiz gratis in pochi secondi, rispondi a domande di cultura generale contro il tempo e vinci al meglio delle tre.',
      paras: [
        '1v1game è un gioco a quiz gratuito che si gioca nel browser – su smartphone, tablet o PC, senza installare nulla e senza registrazione. Premi Gioca e hai subito un avversario: tre round su argomenti casuali, vince chi ne conquista due.',
        'Le domande di cultura generale spaziano tra geografia, storia, scienza, sport, cinema, musica, arte e spazio. Perfetto per allenare la mente in pausa o prepararsi alla prossima serata quiz.',
      ],
      features: ['Sfide 1 contro 1 immediate: un avversario dal vivo o, se nessuno è online, uno registrato o il computer', ['friend', 'Sfida un amico con un link privato'], ['ranked', 'Partite online classificate contro giocatori veri'], 'Oltre 1.200 domande in 12 categorie', 'Gratis, nel browser e su smartphone'],
      faq: [
        ['1v1game è gratis?', 'Sì. È un gioco a quiz online completamente gratuito che funziona nel browser, senza download.'],
        ['Come funziona una sfida 1 contro 1?', 'Tu e il tuo avversario giocate tre round su argomenti casuali. Vinci due round e vinci la sfida.'],
        { flag: 'friend', q: 'Posso giocare a quiz con gli amici online?', on: 'Sì. Crea una partita, condividi il link e il tuo amico entra subito.', off: 'Le sfide con gli amici tramite link privato arriveranno presto. Per ora Gioca ti trova un avversario in automatico, gratis e senza registrazione.' },
        { flag: 'ranked', q: 'Posso giocare contro persone vere?', on: 'Sì. Premi Gioca e affronti un giocatore vero di livello simile. Se in pochi secondi non c’è nessuno online, giochi contro la partita registrata di un giocatore vero o contro il computer, così non aspetti mai.', off: 'Le partite online classificate contro giocatori veri arriveranno presto. Oggi ogni sfida è contro un bot, così puoi allenarti quando vuoi senza attese.' },
        ['Quali argomenti ci sono?', 'Geografia, storia, scienza, spazio, sport, film e serie TV, musica, arte e letteratura.'],
      ],
      cta: 'Gioca una sfida 1 contro 1',
    },
    hub: {
      title: 'Domande di cultura generale con risposte per categoria | 1v1game',
      desc: 'Domande di cultura generale con risposte: geografia, storia, scienza, spazio, sport, cinema, musica e arte. Allenati e poi gioca una sfida a quiz 1 contro 1.',
      h1: 'Domande di cultura generale con risposte',
      lead: 'Scegli una categoria, mettiti alla prova con domande e risposte vere e poi dimostra quanto sai in una sfida 1 contro 1.',
    },
    cat: {
      title: (kw, n) => `${kw}: ${n} domande e risposte + sfida 1v1 | 1v1game`,
      desc: (kw, n) => `${kw} con risposte: ${n} domande di cultura generale gratis. Pensi di saperne di più? Dimostralo in una sfida a quiz 1 contro 1.`,
      h1: (kw) => `${kw}: domande e risposte`,
      intro: (kw, n) => `${kw} gratis: ${n} domande con la risposta nascosta sotto ciascuna. Tocca una domanda per vedere la risposta, poi metti alla prova le tue conoscenze in una sfida 1 contro 1.`,
    },
    ui: { show: 'Mostra risposta', play: 'Gioca 1v1 ora', home: 'Home', quizzes: 'Quiz', more: 'Altre categorie di quiz', faq: 'Domande frequenti', langs: 'Lingue', why: 'Perché giocare a 1v1game', ready: 'Pronto per una sfida?', readyText: 'Leggere le risposte è facile. Vincere una sfida 1 contro 1 contro il tempo, molto meno. Inizia gratis una sfida a quiz.', soon: 'in arrivo' },
    cats: {
      geography: ['Geografia', 'geografia', 'Quiz di geografia'],
      capitals: ['Capitali del mondo', 'capitali', 'Quiz sulle capitali del mondo'],
      history: ['Storia', 'storia', 'Quiz di storia'],
      science: ['Scienza', 'scienza', 'Quiz di scienza'],
      space: ['Spazio e astronomia', 'spazio', 'Quiz sullo spazio'],
      sports: ['Sport', 'sport', 'Quiz sullo sport'],
      movies: ['Film e serie TV', 'film', 'Quiz sui film'],
      music: ['Musica', 'musica', 'Quiz di musica'],
      art: ['Arte e letteratura', 'arte-letteratura', 'Quiz di arte e letteratura'],
    },
  },

  ro: {
    name: 'Română', locale: 'ro_RO', prefix: '/ro',
    home: {
      modes: 'Mai ai și: quiz cu steagurile a 194 de țări, probleme de șah, calcul mental și un cub Rubik 3D adevărat.',
      title: 'Quiz 1 la 1 online – Test de cultură generală în duel | 1v1game',
      desc: 'Quiz 1 la 1 gratuit în browser: dueluri de cultură generală cu peste 1.200 de întrebări, quiz cu steaguri, probleme de șah și calcul mental. Fără instalare și fără cont.',
      h1: 'Joc de cultură generală: duel 1 la 1 online',
      lead: 'Demonstrează cine știe mai mult. Pornește în câteva secunde un duel de quiz gratuit, răspunde la întrebări de cultură generală contra cronometru și câștigă două runde din trei.',
      paras: [
        '1v1game este un joc de cultură generală gratuit, pe care îl joci direct în browser – pe telefon, tabletă sau PC, fără să instalezi nimic și fără cont. Apeși Joacă și ai imediat un adversar: trei runde pe teme alese la întâmplare, câștigă cine ia două.',
        'Întrebările de cultură generală acoperă geografie, istorie, știință, sport, filme, muzică, artă și spațiu. E un test de cultură generală perfect pentru antrenat mintea în pauză sau pentru pregătit următoarea seară de quiz.',
      ],
      features: ['Dueluri 1 la 1 instant: un adversar live sau, dacă nu e nimeni online, unul înregistrat ori calculatorul', ['friend', 'Provoacă un prieten cu un link privat'], ['ranked', 'Meciuri online pentru rank contra jucătorilor reali'], 'Peste 1.200 de întrebări în 12 categorii', 'Gratuit, în browser și pe telefon'],
      faq: [
        ['1v1game este gratuit?', 'Da. Este un joc de cultură generală online complet gratuit, care merge direct în browser, fără descărcare.'],
        ['Cum funcționează un duel 1 la 1?', 'Tu și adversarul jucați trei runde pe teme alese la întâmplare. Câștigi două runde și ai câștigat duelul.'],
        { flag: 'friend', q: 'Pot juca quiz cu prietenii online?', on: 'Da. Creezi un meci, trimiți linkul și prietenul tău intră imediat în duel.', off: 'Duelurile cu prietenii prin link privat vin în curând. Deocamdată Joacă îți găsește automat un adversar, gratuit și fără cont.' },
        { flag: 'ranked', q: 'Pot juca împotriva unor oameni reali?', on: 'Da. Apeși Joacă și ești pus față în față cu un jucător real de nivel apropiat. Dacă în câteva secunde nu e nimeni online, joci contra meciului înregistrat al unui jucător real sau contra calculatorului, deci nu aștepți niciodată.', off: 'Meciurile online pentru rank contra jucătorilor reali vin în curând. Acum fiecare duel e contra unui bot, așa că te poți antrena oricând, fără să aștepți.' },
        ['Ce teme are testul?', 'Geografie, istorie, știință, spațiu, sport, filme și seriale, muzică, artă și literatură.'],
      ],
      cta: 'Joacă un duel 1 la 1',
    },
    hub: {
      title: 'Întrebări de cultură generală cu răspunsuri pe categorii | 1v1game',
      desc: 'Întrebări de cultură generală cu răspunsuri: geografie, istorie, știință, spațiu, sport, filme, muzică și artă. Exersează, apoi joacă un duel de quiz 1 la 1.',
      h1: 'Întrebări de cultură generală cu răspunsuri',
      lead: 'Alege o categorie, testează-te cu întrebări și răspunsuri reale, apoi arată ce știi într-un duel 1 la 1.',
    },
    cat: {
      title: (kw, n) => `${kw}: ${roN(n)} întrebări cu răspunsuri + duel 1v1 | 1v1game`,
      desc: (kw, n) => `${kw} cu răspunsuri: ${roN(n)} întrebări de cultură generală gratuite. Crezi că știi mai mult? Demonstrează într-un duel de quiz 1 la 1.`,
      h1: (kw) => `${kw}: întrebări și răspunsuri`,
      intro: (kw, n) => `${kw} gratuit: ${roN(n)} întrebări, cu răspunsul ascuns sub fiecare. Apasă pe o întrebare ca să vezi răspunsul, apoi arată ce știi într-un duel 1 la 1.`,
    },
    ui: { show: 'Vezi răspunsul', play: 'Joacă 1v1 acum', home: 'Acasă', quizzes: 'Quiz-uri', more: 'Alte categorii de quiz', faq: 'Întrebări frecvente', langs: 'Limbi', why: 'De ce să joci 1v1game', ready: 'Gata de duel?', readyText: 'E ușor să citești răspunsurile. Să câștigi un duel 1 la 1 contra cronometru, nu chiar. Începe acum un duel gratuit.', soon: 'în curând' },
    cats: {
      geography: ['Geografie', 'geografie', 'Test de geografie'],
      capitals: ['Capitalele lumii', 'capitale', 'Quiz cu capitalele lumii'],
      history: ['Istorie', 'istorie', 'Test de istorie'],
      science: ['Știință', 'stiinta', 'Test de știință'],
      space: ['Spațiu și astronomie', 'spatiu', 'Quiz despre spațiu'],
      sports: ['Sport', 'sport', 'Quiz de sport'],
      movies: ['Filme și seriale', 'filme', 'Quiz de filme'],
      music: ['Muzică', 'muzica', 'Quiz de muzică'],
      art: ['Artă și literatură', 'arta-literatura', 'Test de artă și literatură'],
    },
  },

  pl: {
    name: 'Polski', locale: 'pl_PL', prefix: '/pl',
    home: {
      modes: 'A do tego: quiz flag 194 państw, zadania szachowe, liczenie w pamięci i prawdziwa kostka Rubika 3D.',
      title: 'Quiz 1 na 1 online – Pojedynek wiedzy ogólnej | 1v1game',
      desc: 'Darmowy quiz 1 na 1 w przeglądarce: pojedynki wiedzy ogólnej z ponad 1200 pytaniami, quiz flag, zadania szachowe i liczenie w pamięci. Bez pobierania i rejestracji.',
      h1: 'Quiz wiedzy ogólnej: pojedynek 1 na 1',
      lead: 'Udowodnij, kto wie więcej. Rozpocznij darmowy pojedynek quizowy w kilka sekund, odpowiadaj na pytania z wiedzy ogólnej na czas i wygraj dwie rundy z trzech.',
      paras: [
        '1v1game to darmowa gra quizowa w przeglądarce – na telefonie, tablecie lub komputerze, bez instalowania i bez rejestracji. Naciśnij Graj i od razu masz przeciwnika: trzy rundy na losowe tematy, wygrywa ten, kto zdobędzie dwie.',
        'Pytania z wiedzy ogólnej obejmują geografię, historię, naukę, sport, filmy, muzykę, sztukę i kosmos. Idealne na szybki trening mózgu albo przygotowanie do następnego wieczoru quizowego.',
      ],
      features: ['Natychmiastowe pojedynki 1 na 1: przeciwnik na żywo albo, gdy nikogo nie ma online, nagrany lub komputerowy', ['friend', 'Wyzwij znajomego prywatnym linkiem'], ['ranked', 'Rankingowe mecze online z prawdziwymi graczami'], 'Ponad 1200 pytań w 12 kategoriach', 'Za darmo, w przeglądarce i na telefonie'],
      faq: [
        ['Czy 1v1game jest darmowe?', 'Tak. To całkowicie darmowa gra quizowa online, działająca w przeglądarce bez pobierania.'],
        ['Jak działa pojedynek 1 na 1?', 'Ty i twój przeciwnik gracie trzy rundy na losowe tematy. Wygraj dwie rundy, a wygrasz pojedynek.'],
        { flag: 'friend', q: 'Czy mogę grać w quiz ze znajomymi online?', on: 'Tak. Utwórz mecz, udostępnij link, a znajomy od razu dołączy.', off: 'Pojedynki ze znajomymi przez prywatny link już wkrótce. Na razie przycisk Graj sam znajduje ci przeciwnika – za darmo i bez rejestracji.' },
        { flag: 'ranked', q: 'Czy mogę grać z prawdziwymi ludźmi?', on: 'Tak. Naciśnij Graj, a trafisz na prawdziwego gracza o podobnym rankingu. Jeśli przez kilka sekund nikogo nie ma online, grasz z nagraną grą prawdziwego gracza albo z komputerem, więc nigdy nie czekasz.', off: 'Rankingowe mecze online z prawdziwymi graczami już wkrótce. Obecnie każdy pojedynek toczysz z botem, więc możesz ćwiczyć kiedy chcesz, bez czekania.' },
        ['Jakie tematy są w quizie?', 'Geografia, historia, nauka, kosmos, sport, filmy i seriale, muzyka, sztuka i literatura.'],
      ],
      cta: 'Zagraj pojedynek 1 na 1',
    },
    hub: {
      title: 'Quizy z wiedzy ogólnej – pytania z odpowiedziami | 1v1game',
      desc: 'Quizy z wiedzy ogólnej z odpowiedziami: geografia, historia, nauka, kosmos, sport, filmy, muzyka i sztuka. Poćwicz, a potem zagraj w quiz 1 na 1.',
      h1: 'Quizy z wiedzy ogólnej: pytania z odpowiedziami',
      lead: 'Wybierz kategorię, sprawdź się na prawdziwych pytaniach z odpowiedziami, a potem pokaż, co wiesz, w pojedynku 1 na 1.',
    },
    cat: {
      title: (kw, n) => `${kw}: ${n} pytań z odpowiedziami + pojedynek 1v1 | 1v1game`,
      desc: (kw, n) => `${kw} z odpowiedziami – ${n} darmowych pytań z wiedzy ogólnej. Myślisz, że wiesz więcej? Udowodnij to w pojedynku 1 na 1.`,
      h1: (kw) => `${kw}: pytania i odpowiedzi`,
      intro: (kw, n) => `${kw} za darmo: ${n} pytań, odpowiedź jest ukryta pod każdym z nich. Kliknij pytanie, aby zobaczyć odpowiedź, a potem sprawdź swoją wiedzę w pojedynku 1 na 1.`,
    },
    ui: { show: 'Pokaż odpowiedź', play: 'Zagraj 1v1 teraz', home: 'Start', quizzes: 'Quizy', more: 'Więcej kategorii quizów', faq: 'Najczęstsze pytania', langs: 'Języki', why: 'Dlaczego warto grać w 1v1game', ready: 'Gotowy na pojedynek?', readyText: 'Czytanie odpowiedzi jest łatwe. Wygranie pojedynku 1 na 1 na czas – już nie. Zacznij darmowy pojedynek quizowy.', soon: 'wkrótce' },
    cats: {
      geography: ['Geografia', 'geografia', 'Quiz z geografii'],
      capitals: ['Stolice świata', 'stolice', 'Quiz stolice świata'],
      history: ['Historia', 'historia', 'Quiz z historii'],
      science: ['Nauka', 'nauka', 'Quiz naukowy'],
      space: ['Kosmos i astronomia', 'kosmos', 'Quiz o kosmosie'],
      sports: ['Sport', 'sport', 'Quiz sportowy'],
      movies: ['Filmy i seriale', 'filmy', 'Quiz filmowy'],
      music: ['Muzyka', 'muzyka', 'Quiz muzyczny'],
      art: ['Sztuka i literatura', 'sztuka-literatura', 'Quiz o sztuce i literaturze'],
    },
  },

  tr: {
    name: 'Türkçe', locale: 'tr_TR', prefix: '/tr',
    home: {
      modes: 'Ayrıca: 194 ülkenin bayrak testi, satranç bulmacaları, zihinden matematik oyunu ve gerçek bir 3D Rubik Küpü.',
      title: '1v1 Bilgi Yarışması Online – Genel Kültür Düellosu | 1v1game',
      desc: 'Tarayıcıda ücretsiz 1’e 1 bilgi yarışması: 1.200’den fazla soruyla genel kültür düelloları, bayrak testi, satranç bulmacaları ve zihinden matematik. Kayıt yok.',
      h1: 'Genel Kültür Bilgi Yarışması: 1’e 1 Düello',
      lead: 'Kimin daha çok bildiğini kanıtla. Saniyeler içinde ücretsiz bir bilgi düellosu başlat, genel kültür sorularını zamana karşı cevapla ve üç turun ikisini kazan.',
      paras: [
        '1v1game, doğrudan tarayıcıda oynanan ücretsiz bir bilgi yarışması oyunudur – telefonda, tablette veya bilgisayarda, uygulama yüklemeden ve kayıt olmadan. Oyna’ya bas, rakibin hemen hazır: rastgele konularda üç tur, iki turu alan düelloyu kazanır.',
        'Genel kültür soruları coğrafya, tarih, bilim, spor, film, müzik, sanat ve uzay konularını kapsar. Kısa bir zihin egzersizi ya da bir sonraki yarışma gecesine hazırlık için ideal bir genel kültür testi.',
      ],
      features: ['Anında 1’e 1 düellolar: canlı bir rakip ya da kimse çevrimiçi değilse kayıtlı bir rakip veya bilgisayar', ['friend', 'Özel bağlantıyla arkadaşına meydan oku'], ['ranked', 'Gerçek oyunculara karşı dereceli online maçlar'], '12 kategoride 1.200’den fazla soru', 'Ücretsiz, tarayıcıda ve mobilde'],
      faq: [
        ['1v1game ücretsiz mi?', 'Evet. Tamamen ücretsiz bir online bilgi yarışması oyunudur ve indirme gerektirmeden tarayıcıda çalışır.'],
        ['1’e 1 düello nasıl işler?', 'Sen ve rakibin rastgele konularda üç tur oynarsınız. İki turu kazanan düelloyu kazanır.'],
        { flag: 'friend', q: 'Arkadaşlarımla online bilgi yarışması oynayabilir miyim?', on: 'Evet. Bir maç oluştur, bağlantıyı paylaş ve arkadaşın hemen katılsın.', off: 'Özel bağlantıyla arkadaş düelloları çok yakında. Şimdilik Oyna düğmesi sana otomatik olarak rakip bulur; ücretsiz ve kayıtsız.' },
        { flag: 'ranked', q: 'Gerçek insanlara karşı oynayabilir miyim?', on: 'Evet. Oyna’ya bas, benzer puandaki gerçek bir oyuncuyla eşleş. Birkaç saniye içinde kimse çevrimiçi değilse gerçek bir oyuncunun kayıtlı düellosuna veya bilgisayara karşı oynarsın, yani hiç beklemezsin.', off: 'Gerçek oyunculara karşı dereceli online maçlar çok yakında. Şu anda her düello bota karşı, böylece beklemeden istediğin zaman pratik yapabilirsin.' },
        ['Hangi konular var?', 'Coğrafya, tarih, bilim, uzay, spor, film ve dizi, müzik, sanat ve edebiyat.'],
      ],
      cta: '1’e 1 düello oyna',
    },
    hub: {
      title: 'Cevaplı Genel Kültür Soruları – Kategoriler | 1v1game',
      desc: 'Cevaplı genel kültür soruları: coğrafya, tarih, bilim, uzay, spor, film, müzik ve sanat. Önce pratik yap, sonra 1’e 1 bilgi düellosunda kazan.',
      h1: 'Cevaplı Genel Kültür Soruları',
      lead: 'Bir kategori seç, gerçek soru ve cevaplarla kendini test et, ardından bilgini 1’e 1 düelloda kanıtla.',
    },
    cat: {
      title: (kw, n) => `${kw}: ${n} Cevaplı Soru + 1v1 Düello | 1v1game`,
      desc: (kw, n) => `Cevaplı ${kw.toLocaleLowerCase('tr')}: ${n} ücretsiz genel kültür sorusu. Daha çok bildiğini mi düşünüyorsun? 1’e 1 bilgi düellosunda kanıtla.`,
      h1: (kw) => `${kw}: Sorular ve Cevaplar`,
      intro: (kw, n) => `${kw}: ${n} soru, cevaplar her sorunun altında gizli. Cevabı görmek için soruya dokun, sonra bilgini 1’e 1 düelloda kanıtla.`,
    },
    ui: { show: 'Cevabı göster', play: 'Şimdi 1v1 oyna', home: 'Ana sayfa', quizzes: 'Testler', more: 'Diğer test kategorileri', faq: 'Sık sorulan sorular', langs: 'Diller', why: 'Neden 1v1game oynamalı', ready: 'Düelloya hazır mısın?', readyText: 'Cevapları okumak kolay. Zamana karşı 1’e 1 düello kazanmak o kadar değil. Ücretsiz bir bilgi düellosuna şimdi başla.', soon: 'çok yakında' },
    cats: {
      geography: ['Coğrafya', 'cografya', 'Coğrafya Soruları'],
      capitals: ['Dünya Başkentleri', 'baskentler', 'Başkentler Testi'],
      history: ['Tarih', 'tarih', 'Tarih Soruları'],
      science: ['Bilim', 'bilim', 'Bilim Soruları'],
      space: ['Uzay ve Astronomi', 'uzay', 'Uzay Soruları'],
      sports: ['Spor', 'spor', 'Spor Soruları'],
      movies: ['Film ve Dizi', 'film', 'Film Soruları'],
      music: ['Müzik', 'muzik', 'Müzik Soruları'],
      art: ['Sanat ve Edebiyat', 'sanat-edebiyat', 'Sanat ve Edebiyat Soruları'],
    },
  },
};
