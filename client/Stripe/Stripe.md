# Documentation Stripe - Intégration E-Commerce

## 📋 Vue d'ensemble

Cette documentation détaille l'implémentation complète de Stripe dans notre application e-commerce React avec Supabase. L'intégration permet aux utilisateurs de finaliser leurs achats de manière sécurisée après validation de leur panier.

## 🏗️ Architecture

```
client/
├── src/
│   ├── components/
│   │   ├── Stripe.jsx              # Composant principal Stripe
│   │   ├── CheckoutForm.jsx        # Formulaire de paiement
│   │   └── PaymentSuccess.jsx      # Page de confirmation
│   ├── styles/
│   │   └── stripe.css              # Styles Stripe
│   └── context/
│       ├── CartContext.js          # Contexte du panier
│       └── AuthContext.js          # Contexte d'authentification
├── .env                            # Variables d'environnement
└── package.json
```

## 🔧 Installation et Configuration

### 1. Installation des dépendances

```bash
cd client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Variables d'environnement

Créer un fichier `.env` dans le dossier `client/` :

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Configuration Stripe

1. **Créer un compte Stripe** (mode test)
2. **Récupérer les clés API** depuis le dashboard Stripe
3. **Configurer les webhooks** (optionnel pour la production)

## 📱 Composants

### 1. Stripe.jsx - Composant Principal

**Fonctionnalités :**
- Initialisation de Stripe avec la clé publique
- Calcul du total du panier
- Création du PaymentIntent via l'API backend
- Gestion des états de chargement et d'erreur
- Affichage du résumé de commande

**Points clés :**
```jsx
// Initialisation Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Calcul du total
const calculateTotal = () => {
  return cart.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

// Appel API pour PaymentIntent
const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({
    amount: Math.round(total * 100), // Convertir en centimes
    currency: 'eur',
    cartItems: cart,
    customerEmail: userData?.email,
  }),
});
```

### 2. CheckoutForm.jsx - Formulaire de Paiement

**Fonctionnalités :**
- Utilisation des éléments Stripe (PaymentElement, AddressElement)
- Confirmation du paiement
- Gestion des erreurs de paiement
- Redirection après succès

**Points clés :**
```jsx
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: `${window.location.origin}/payment-success`,
  },
  redirect: 'if_required'
});
```

### 3. PaymentSuccess.jsx - Page de Confirmation

**Fonctionnalités :**
- Vérification du statut du paiement
- Affichage des informations de transaction
- Gestion des différents états (succeeded, processing, error)

## 🎨 Personnalisation UI

### Thème Stripe

```jsx
const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#b56730',      // Couleur principale
    colorBackground: '#e5ddc7',   // Arrière-plan
    colorText: '#2d2d2d',         // Texte
    colorDanger: '#df1b41',       // Erreurs
    borderRadius: '8px',          // Bordures arrondies
  },
};
```

### Classes CSS principales

- `.stripe-checkout` : Container principal
- `.order-summary` : Résumé de commande
- `.checkout-form` : Formulaire de paiement
- `.payment-status` : Pages de statut
- `.loading-spinner` : Indicateurs de chargement

## 🔐 Sécurité

### Authentification

```jsx
// Vérification de session avant paiement
useEffect(() => {
  if (cart.length > 0 && session) {
    createPaymentIntent();
  }
}, [cart, session]);
```

### Headers d'autorisation

```jsx
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${session?.access_token}`,
}
```

## 🌐 API Backend (Supabase Edge Function)

### Structure de la fonction

```typescript
// supabase/functions/create-payment-intent/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { amount, currency, cartItems, customerEmail } = await req.json()

    // Authentification utilisateur
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Création PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer_email: customerEmail,
      metadata: {
        user_id: user.id,
        cart_items: JSON.stringify(cartItems)
      }
    })

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

### Déploiement de la fonction

```bash
# Installation Supabase CLI
npm install -g supabase

# Login et déploiement
supabase login
supabase functions deploy create-payment-intent
```

## 🔄 Flux de Paiement

1. **Initialisation**
   - L'utilisateur arrive sur `/checkout`
   - Vérification de l'authentification
   - Calcul du total du panier

2. **Création PaymentIntent**
   - Appel à l'Edge Function Supabase
   - Création du PaymentIntent côté Stripe
   - Retour du `client_secret`

3. **Affichage du formulaire**
   - Initialisation des éléments Stripe
   - Affichage du résumé de commande
   - Formulaire de paiement et adresse

4. **Confirmation du paiement**
   - Validation des données
   - Confirmation via Stripe
   - Gestion des erreurs

5. **Finalisation**
   - Redirection vers page de succès
   - Vidage du panier
   - Affichage de la confirmation

## 🧪 Tests

### Cartes de test Stripe

```
Paiement réussi:     4242 4242 4242 4242
Paiement refusé:     4000 0000 0000 0002
Authentification:    4000 0027 6000 3184
```

### Test d'intégration

1. Ajouter des produits au panier
2. Se connecter avec un compte test
3. Aller sur `/checkout`
4. Utiliser une carte de test
5. Vérifier la redirection

## 📊 Monitoring et Logs

### Logs côté client

```jsx
console.error('Erreur payment intent:', err);
```

### Logs côté serveur

Accessible via Supabase Dashboard > Edge Functions > Logs

## 🚀 Déploiement Production

### Variables d'environnement production

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### Checklist production

- [ ] Clés Stripe en mode live
- [ ] Webhooks configurés
- [ ] SSL activé
- [ ] Logs de monitoring
- [ ] Tests de paiement réels

## 🔧 Maintenance

### Mise à jour des dépendances

```bash
npm update @stripe/stripe-js @stripe/react-stripe-js
```

### Monitoring des erreurs

- Utiliser Sentry ou LogRocket pour le monitoring
- Surveiller les logs Supabase
- Configurer des alertes Stripe

## 📞 Support

### Ressources utiles

- [Documentation Stripe](https://stripe.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Stripe.js](https://stripe.com/docs/stripe-js/react)

### Problèmes courants

1. **Erreur "Invalid API Key"** : Vérifier les variables d'environnement
2. **CORS Error** : Configurer les domaines autorisés dans Stripe
3. **PaymentIntent Error** : Vérifier l'authentification utilisateur
