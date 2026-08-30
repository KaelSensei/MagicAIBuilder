# TDD avec une IA

Le TDD reste le même contrat : le test décrit un comportement attendu, le code
répond à ce besoin, puis la conception s'améliore sans changer le comportement.
L'IA change surtout la manière d'obtenir le Green.

## Le cycle de travail

### Red

On formule un seul comportement observable, puis on écrit le test le plus petit
possible. On exécute ce test et on vérifie qu'il échoue pour la bonne raison.
Pour un bug, ce test est d'abord une reproduction et devient la non-régression.

### Super Green

On demande à l'IA une implémentation minimale, mais propre dès maintenant : bon
nommage, bon emplacement, responsabilité claire, typage strict et gestion des
erreurs cohérente. Cela ne signifie pas concevoir l'état final du système. Une
enum, une factory ou une abstraction n'existe que lorsqu'un test la rend utile.

Le Super Green ne supprime donc pas le TPP (Transformation Priority Premise).
La structure peut être propre alors que le comportement progresse encore par
petites transformations : constante, scalaire, invariant, conditionnelle, puis
boucle.

### Refining Refactoring

Quand les tests sont verts, on peut améliorer la conception : clarifier une
frontière métier, isoler une responsabilité réellement apparue, supprimer une
duplication ou simplifier un flux. Chaque étape conserve le comportement et
reste vérifiable. On ne crée pas volontairement un Green sale pour justifier un
second passage de rangement.

## Quels tests écrire ?

Par défaut, MagicAIBuilder privilégie les tests sociables : ils traversent une
frontière stable, comme une action de store, un cas d'usage, une route ou le
comportement visible d'un composant, avec les collaborateurs en mémoire. Ils
résistent mieux aux déplacements de classes et de méthodes par l'IA.

Les tests solitaires restent adaptés aux fonctions pures, parseurs et politiques
algorithmiques isolées. Les dépendances externes sont simulées à leur frontière,
mais les collaborateurs internes ne sont pas mockés pour imposer une structure.

## Contrat pour l'agent

À chaque incrément, l'agent doit :

1. annoncer le comportement ciblé et le fichier de test ;
2. écrire et exécuter le Red ;
3. produire le plus petit Super Green propre ;
4. exécuter le test ciblé puis la suite Vitest ;
5. proposer séparément un Refining Refactoring si la conception le justifie.

L'agent ne doit pas anticiper les besoins futurs, réécrire les tests pour faire
passer son code, ni mélanger une feature avec une refonte générale. Les tests E2E
complètent ce cycle lorsqu'un parcours réel ou une intégration le nécessite.
