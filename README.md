# interpreter Québecois

Un interpréteur écrit en TypeScript.

## 🎯 Fonctionnalités

### Types de Données

- **Entiers** : `5`, `42`, `-10`
- **Booléens** : `true`, `false`
- **Chaînes de caractères** : `"hello"`
- **Tableaux** : `[1, 2, 3, 4]`
- **Hashes/Dictionnaires** : `{"clé": valeur}`
- **Fonctions** : `JAI JAMAIS TOUCHER A MES FILLES(...) SAUF UNE FOIS AU CHALET`

### Syntaxe Québécoise

| Concept      | Québécois                         | Exemple                                                              |
| ------------ | --------------------------------- | -------------------------------------------------------------------- |
| Déclaration  | `MET MOI CA ICITTE`               | `MET MOI CA ICITTE x = 5;`                                           |
| Fonction     | `JAI JAMAIS TOUCHER A MES FILLES` | `JAI JAMAIS TOUCHER A MES FILLES(x) x * 2; SAUF UNE FOIS AU CHALET;` |
| Fin fonction | `SAUF UNE FOIS AU CHALET`         |                                                                      |
| Condition    | `AMETON QUE`                      | `AMETON QUE (x > 5) { ... }`                                         |
| Sinon        | `SINON LA`                        | `SINON LA { ... }`                                                   |
| Retour       | `TOKEBEC`                         | `TOKEBEC x;`                                                         |
| Affichage    | `GAROCHE MOI CA`                  | `GAROCHE MOI CA("Bonjour");`                                         |

### Opérateurs

**Arithmétiques** : `+`, `-`, `*`, `/`

**Comparaison** : `<`, `>`, `==`, `!=`

**Logiques** : `!` (négation)

### Fonctions Intégrées

- `len(arr)` - Retourne la longueur d'un tableau ou d'une chaîne
- `first(arr)` - Retourne le premier élément d'un tableau
- `last(arr)` - Retourne le dernier élément d'un tableau
- `tail(arr)` - Retourne tous les éléments sauf le premier
- `push(arr, element)` - Ajoute un élément à la fin du tableau
- `GAROCHE MOI CA(...)` - Affiche a l'ecran

## 📖 Exemples d'Utilisation

### Déclarations Simples

```quebz
MET MOI CA ICITTE x = 10;
MET MOI CA ICITTE name = "Test";
MET MOI CA ICITTE arr = [1, 2, 3];
```

### Fonctions

```quebz
MET MOI CA ICITTE double = JAI JAMAIS TOUCHER A MES FILLES(x)
  x * 2;
SAUF UNE FOIS AU CHALET;

MET MOI CA ICITTE result = double(5);
GAROCHE MOI CA(result);
```

### Conditions

```quebz
MET MOI CA ICITTE age = 25;
AMETON QUE (age > 18) {
  GAROCHE MOI CA("Adulte");
} SINON LA {
  GAROCHE MOI CA("Mineur");
}
```

### Tableaux

```quebz
MET MOI CA ICITTE numbers = [1, 3, 50, 9];
GAROCHE MOI CA(len(numbers));
GAROCHE MOI CA(first(numbers));
GAROCHE MOI CA(last(numbers));
GAROCHE MOI CA(tail(numbers));
```

### Recursion - Map personnalisé

```quebz
MET MOI CA ICITTE map = JAI JAMAIS TOUCHER A MES FILLES(arr, f)
  MET MOI CA ICITTE iter = JAI JAMAIS TOUCHER A MES FILLES(arr, accumulated)
    AMETON QUE (len(arr) == 0) {
      accumulated
    } SINON LA {
      iter(tail(arr), push(accumulated, f(first(arr))));
    }
  SAUF UNE FOIS AU CHALET;
  iter(arr, []);
SAUF UNE FOIS AU CHALET;

MET MOI CA ICITTE a = [1, 3, 50, 9];
MET MOI CA ICITTE double = JAI JAMAIS TOUCHER A MES FILLES(x)
  x * 2;
SAUF UNE FOIS AU CHALET;

MET MOI CA ICITTE res = map(a, double);
GAROCHE MOI CA(res);
```

### Hashes

```quebz
MET MOI CA ICITTE person = {"name": "Test", "age": 85};
GAROCHE MOI CA(person["name"]);
```
