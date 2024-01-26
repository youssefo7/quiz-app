# QUIZZ APP SETUP

# Commandes npm

Les commandes commençant par `npm` devront être exécutées dans les dossiers `client` et `server`. Les scripts non standard doivent être lancés en lançant `npm run myScript`.

## Installation des dépendances de l'application

1. Installer `npm`. `npm` vient avec `Node` que vous pouvez télécharger [ici](https://nodejs.org/en/download/)

2. Lancer `npm ci` (Continuous Integration) pour installer les versions exactes des dépendances du projet. Ceci est possiblement seulement si le fichier `package-lock.json` existe. Ce fichier vous est fourni dans le code de départ.

## Ajout de dépendances aux projets

Vous pouvez ajouter d'autres dépendances aux deux projets avec la commande `npm install nomDependance`.

Pour ajouter une dépendance comme une dépendance de développement (ex : librairie de tests, types TS, etc.) ajoutez l'option `--save-dev` : `npm install nomDependance --save-dev`.

Un ajout de dépendance modifiera les fichiers `package.json` et `package-lock.json`.

***_Important_*** : assurez-vous d'ajouter ces modifications dans votre Git. N'installez jamais une dépendance du projet globalement.

# Client

## Développement local

Lorsque la commande `npm start` est lancée dans le dossier _/client_, le script suivant (disponible dans `package.json`) est exécuté : `ng serve --open` qu exécute les 2 étapes suivantes :

1. **Bundle generation** : Traduire le code TypeScript et la syntaxe Angular en JavaScript standard. À la fin de cette étape, vous verrez que les fichiers suivants sont générés : `vendor.js`,`polyfills.js`, `main.js`,`runtime.js` et `styles.css`. Ces fichiers continent le code de votre application ainsi que le CSS des différents Components.

    **Note** : ceci est un _build_ de développement : la taille des fichiers est très grande et le code n'est pas minifié. Vous pouvez accéder à votre code à travers les outils de développement de votre navigateur et déboguer avec des _breaking points_ par exemple. Une configuration de _debugger_ pour VSCode est également disponible. Voir la section _Debugger_ pour plus d'informations.

2. **Development Server** : un serveur web statique sera lancé sur votre machine pour pouvoir servir votre application web. Le serveur est lancé sur le port 4200 et est accessible à travers `http://localhost:4200/` ou `127.0.0.1:4200`. Une page web avec cette adresse s'ouvrira automatiquement.

## Lectures suggérées

[AntiPatterns](https://sourcemaking.com/antipatterns) (plus spécifiquement [Software Development AntiPatterns](https://sourcemaking.com/antipatterns/software-development-antipatterns))

[Building your first Angular App](https://scrimba.com/g/gyourfirstangularapp)
