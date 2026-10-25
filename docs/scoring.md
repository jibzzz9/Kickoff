# Comment Kickoff calcule la compatibilité (algorithme v1.0.0)

Ce document explique le calcul en langage simple, pour une entreprise, un parent, un enseignant ou un juriste.
Code source : `packages/shared/src/scoring.ts` (tests : `scoring.test.ts`).

## Principes

- **Un humain décide toujours.** Le score aide à lire les dossiers ; il ne refuse jamais personne et ne déclenche aucune action.
- **Calcul déterministe** : le même dossier donne toujours le même résultat. Pas d'IA dans le calcul.
- **Données utilisées (liste fermée)** : moyenne, tests d'aptitudes, stages d'essai, langues, qualités (savoir-être),
  permis vélomoteur, bénévolat, longueur de la lettre de motivation, présence d'un CV.
- **Jamais utilisées** : prénom, nom, âge, genre, nationalité, origine, religion, adresse, photo, santé.
  Un test automatique vérifie que le résultat ne change pas quand on ajoute ces informations.
- **Journal** : chaque nouveau résultat est enregistré avec la version de l'algorithme et une empreinte des données utilisées
  (table `score_audit_log`, sans données personnelles).

## Le calcul

1. **Critères de l'annonce.** Chaque critère est *rempli*, *pas encore rempli* ou *information manquante*
   (compte pour moitié).
2. **Ce qui compte pour l'entreprise.** Quatre dimensions notées de 0 à 1, pondérées de 1 à 3 par l'entreprise :
   - notes : moyenne (4 = suffisant, 6 = maximum) et résultats aux tests ;
   - expérience pratique : stages d'essai, surtout dans le métier ;
   - savoir-être : nombre de qualités indiquées ;
   - motivation : lettre de motivation, bénévolat, stage dans le métier.
3. **Score final (0-100 %)** : 50 % dimensions + 35 % critères indispensables + 15 % critères « un plus »
   (les parts sont redistribuées s'il n'y a pas de critère d'un type).

## Ce que voit l'entreprise : la jauge

| Score | Segments | Badge |
|---|---|---|
| 85 et plus | 5 | 🟢 Très intéressant |
| 70 à 84 | 4 | 🟢 Très intéressant |
| 55 à 69 | 3 | 🔵 Intéressant |
| 35 à 54 | 2 | 🟡 À découvrir |
| moins de 35 | 1 | 🟡 À découvrir |

- Si un critère indispensable n'est pas encore rempli, la jauge s'arrête à 3 segments.
- ⚪ **Profil incomplet** : un critère indispensable ne peut pas être vérifié, ou au moins deux informations
  importantes manquent (notes, langues, qualités, CV).
- La ligne d'explication montre 2-3 atouts concrets, en priorité ceux qui remplissent un critère de l'annonce.
- Les libellés sont toujours positifs. La liste reste dans l'ordre d'arrivée ; le filtre « très intéressants d'abord »
  est désactivé par défaut et ne masque personne.

## Ce que voit l'élève : l'anneau

- Le même score, en pourcentage. **Jamais le badge ni la jauge.**
- « Ce qui correspond » : ses atouts et les critères remplis.
- « Ce qu'il te manque » : jusqu'à 3 actions concrètes, chacune avec le score qu'il atteindrait
  (« Fais un stage d'essai dans ce métier → jusqu'à 70 % »).

## Plus tard (payant, branché en fin de projet)

Claude reformulera ces explications en phrases naturelles à partir du résultat calculé, sans pouvoir changer le score.
