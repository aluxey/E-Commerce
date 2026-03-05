# Checklist de Diagnostic Mobile-First

Cette checklist vous aide à identifier et corriger les problèmes de débordement horizontal (scroll latéral indésirable) et de mise en page sur mobile.

## 1. Débordement Horizontal (Overflow-X)

Le symptôme principal est la possibilité de "dézoomer" ou de scroller horizontalement pour voir du vide ou des éléments cachés.

### Causes probables (par ordre de fréquence) :
- [ ] **Largeurs fixes en pixels** : Éléments avec `width: 300px` ou plus sur des écrans de 320px.
  - *Solution* : Utiliser `width: 100%`, `max-width: 100%`, ou `min()`.
- [ ] **`width: 100vw`** : Inclut la largeur de la barre de défilement verticale, ce qui dépasse `body` (100%).
  - *Solution* : Utiliser `width: 100%` ou `max-width: 100vw`.
- [ ] **Marges négatives non contenues** : `margin-left: -20px` sans `overflow: hidden` sur le parent.
  - *Solution* : Vérifier les conteneurs ou ajouter `overflow-x: clip` / `hidden`.
- [ ] **Positionnement absolu/fixe** : Éléments positionnés hors écran (`left: -100%`) qui restent dans le layout.
  - *Solution* : Ajouter `visibility: hidden` quand l'élément est fermé/inactif.
- [ ] **Contenu non sécable** : Longs mots, URLs, ou `white-space: nowrap` qui forcent la largeur.
  - *Solution* : `word-break: break-word`, `overflow-wrap: anywhere`, ou `text-overflow: ellipsis`.
- [ ] **Padding + Width** : `width: 100%` + `padding` sans `box-sizing: border-box`.
  - *Solution* : S'assurer que `* { box-sizing: border-box; }` est appliqué.

### Outils de débug rapide :
1.  **Outline Global** : Ajouter `* { outline: 1px solid red !important; }` pour voir les limites des boîtes.
2.  **JavaScript** : Exécuter ceci dans la console pour trouver l'élément coupable :
    ```javascript
    document.querySelectorAll('*').forEach(el => {
      if (el.offsetWidth > document.documentElement.clientWidth) {
        console.log('Débordement détecté :', el);
        el.style.border = '2px solid red';
      }
    });
    ```

## 2. Menu Latéral (Drawer)

- [ ] **Visibilité** : Le menu doit être `visibility: hidden` quand il est fermé, sinon il élargit la page même si `translateX` le sort de l'écran.
- [ ] **Overlay** : L'arrière-plan doit être bloqué (`overflow: hidden` sur body) quand le menu est ouvert.
- [ ] **Largeur** : Ne pas dépasser `85vw` ou `300px` (le plus petit des deux).

## 3. Images et Médias

- [ ] **Responsive** : Toujours avoir `max-width: 100%; height: auto;`.
- [ ] **Ratio** : Utiliser `aspect-ratio` pour éviter les sauts de page (CLS).

## 4. Formulaires

- [ ] **Inputs** : `width: 100%` pour s'adapter au conteneur.
- [ ] **Font-size** : Minimum `16px` sur mobile pour éviter que le navigateur ne zoome automatiquement au focus.

## 5. Grilles (Grid/Flex)

- [ ] **Colonnes** : Passer à 1 colonne (`grid-template-columns: 1fr`) sur mobile (< 640px).
- [ ] **Gap** : Réduire les `gap` sur mobile (ex: `0.5rem` ou `1rem` max).

---

## Definition of Done (Mobile)

- [ ] Pas de scroll horizontal (sauf pour les carrousels explicites).
- [ ] Le site est lisible sans zoomer.
- [ ] Les boutons et liens sont assez grands (min 44x44px).
- [ ] Le menu s'ouvre et se ferme sans casser le layout.
- [ ] Les formulaires sont remplissables facilement.
